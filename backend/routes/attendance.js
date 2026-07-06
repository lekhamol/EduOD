import express from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { query } from '../config/db.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Multer: store file in memory for parsing
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.toLowerCase();
    if (ext.endsWith('.csv') || ext.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Only .csv and .txt files are allowed'));
    }
  }
});

// ── Fuzzy matching helpers ──────────────────────────────────────────────────

/** Normalize a string: lowercase, remove punctuation, collapse whitespace */
function normalize(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

/** Levenshtein distance between two strings */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Similarity score 0–100 between two normalized strings.
 * Combines exact-contains bonus + Levenshtein ratio.
 */
function similarity(a, b) {
  if (!a || !b) return 0;
  const na = normalize(a), nb = normalize(b);
  if (na === nb) return 100;
  // Token overlap bonus
  const tokA = new Set(na.split(' '));
  const tokB = nb.split(' ');
  const overlap = tokB.filter(t => tokA.has(t)).length;
  const tokenScore = tokB.length > 0 ? (overlap / tokB.length) * 60 : 0;
  // Levenshtein ratio component
  const maxLen = Math.max(na.length, nb.length);
  const levScore = maxLen > 0 ? ((maxLen - levenshtein(na, nb)) / maxLen) * 40 : 0;
  return Math.round(tokenScore + levScore);
}

/**
 * Parse a raw file buffer (.txt or .csv) into a list of { name?, reg_no? } entries.
 * Supports:
 *   - Plain text: one name or reg_no per line
 *   - CSV with optional headers: name, reg_no
 */
function parseAbsenteeFile(buffer, filename) {
  const text = buffer.toString('utf-8');
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const entries = [];

  const isCsv = filename.toLowerCase().endsWith('.csv');
  if (isCsv) {
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('name') || firstLine.includes('reg');
    const dataLines = hasHeader ? lines.slice(1) : lines;
    for (const line of dataLines) {
      const parts = line.split(',').map(p => p.trim());
      entries.push({ name: parts[0] || '', reg_no: parts[1] || '' });
    }
  } else {
    // Plain text: each line is either a name or reg_no (detect by pattern)
    for (const line of lines) {
      // Reg no pattern: contains digits (e.g. 2026CS1045)
      if (/\d/.test(line) && line.length <= 20) {
        entries.push({ name: '', reg_no: line });
      } else {
        entries.push({ name: line, reg_no: '' });
      }
    }
  }
  return entries;
}

// ── AI Match Endpoint ───────────────────────────────────────────────────────

// POST parse absentee file and fuzzy-match to department students (Faculty only)
router.post('/parse-absentees', protect, authorize('faculty'), (req, res) => {
  // Run multer manually so we can catch its errors and return proper JSON
  uploadMemory.single('absentee_file')(req, res, async (multerErr) => {
    if (multerErr) {
      return res.status(400).json({ success: false, error: multerErr.message || 'File upload error.' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file received. Please select a .csv or .txt file and try again.' });
      }

      // 1. Fetch all students in this faculty's department
      const students = await query(
        'SELECT id, name, reg_no, attendance FROM users WHERE role = ? AND department = ? ORDER BY name ASC',
        ['student', req.user.department]
      );

      // 2. Parse the uploaded file into raw entries
      const rawEntries = parseAbsenteeFile(req.file.buffer, req.file.originalname);

      const matched = [];
      const unmatched = [];
      const CONFIDENCE_THRESHOLD = 50;

      for (const entry of rawEntries) {
        const { name: rawName, reg_no: rawRegNo } = entry;
        if (!rawName && !rawRegNo) continue;

        let bestMatch = null;
        let bestScore = 0;
        let matchedBy = 'name';

        for (const student of students) {
          let score = 0;

          // Exact reg_no match → 100
          if (rawRegNo && normalize(rawRegNo) === normalize(student.reg_no)) {
            score = 100;
            matchedBy = 'reg_no';
          } else if (rawName) {
            score = similarity(rawName, student.name);
            matchedBy = 'name';
          }

          if (score > bestScore) {
            bestScore = score;
            bestMatch = student;
          }
        }

        if (bestMatch && bestScore >= CONFIDENCE_THRESHOLD) {
          // Avoid duplicates
          if (!matched.find(m => m.student_id === bestMatch.id)) {
            matched.push({
              student_id: bestMatch.id,
              name: bestMatch.name,
              reg_no: bestMatch.reg_no,
              attendance: bestMatch.attendance,
              confidence: bestScore,
              matched_by: matchedBy,
              raw_input: rawName || rawRegNo
            });
          }
        } else {
          unmatched.push({
            raw_input: rawName || rawRegNo,
            best_guess: bestMatch ? { name: bestMatch.name, reg_no: bestMatch.reg_no, confidence: bestScore } : null
          });
        }
      }

      res.json({
        success: true,
        total_uploaded: rawEntries.length,
        matched,
        unmatched,
        message: `Matched ${matched.length} of ${rawEntries.length} entries. ${unmatched.length} could not be identified.`
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

});

// GET students in faculty's department (for marking attendance)
router.get('/students', protect, authorize('faculty'), async (req, res) => {
  try {
    const students = await query(
      'SELECT id, name, reg_no, attendance FROM users WHERE role = ? AND department = ? ORDER BY name ASC',
      ['student', req.user.department]
    );
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST mark attendance for multiple students on a date (Faculty only)
router.post('/mark', protect, authorize('faculty'), async (req, res) => {
  try {
    const { date, records } = req.body;
    // records = [{ student_id, status }]

    if (!date || !records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'Date and records are required.' });
    }

    // Upsert each record
    for (const record of records) {
      await query(
        `INSERT INTO attendance_records (student_id, date, status, marked_by)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by)`,
        [record.student_id, date, record.status, req.user.id]
      );
    }

    // Recalculate and update each student's overall attendance %
    for (const record of records) {
      const rows = await query(
        `SELECT
           COUNT(*) AS total,
           SUM(status = 'present') AS present_count
         FROM attendance_records
         WHERE student_id = ? AND status IN ('present','absent')`,
        [record.student_id]
      );
      const total = rows[0].total || 0;
      const present = rows[0].present_count || 0;
      const pct = total > 0 ? Math.round((present / total) * 100) : null;
      await query('UPDATE users SET attendance = ? WHERE id = ?', [pct, record.student_id]);
    }

    res.json({ success: true, message: `Attendance marked for ${records.length} student(s) on ${date}.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET heatmap data for a specific student (Faculty or HOD)
router.get('/:studentId', protect, authorize('faculty', 'hod'), async (req, res) => {
  try {
    const records = await query(
      `SELECT date, status FROM attendance_records
       WHERE student_id = ?
       ORDER BY date ASC`,
      [req.params.studentId]
    );

    // Also return student info
    const students = await query(
      'SELECT id, name, reg_no, department, attendance FROM users WHERE id = ? AND role = ?',
      [req.params.studentId, 'student']
    );

    if (!students || students.length === 0) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }

    res.json({ success: true, student: students[0], records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST add student (Faculty only)
router.post('/add-student', protect, authorize('faculty'), async (req, res) => {
  const { name, email, reg_no, password } = req.body;
  if (!name || !email || !reg_no) {
    return res.status(400).json({ success: false, error: 'Name, email, and register number are required.' });
  }

  try {
    const userExists = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (userExists && userExists.length > 0) {
      return res.status(400).json({ success: false, error: 'Student email already exists.' });
    }

    const regNoExists = await query('SELECT id FROM users WHERE reg_no = ?', [reg_no]);
    if (regNoExists && regNoExists.length > 0) {
      return res.status(400).json({ success: false, error: 'Register number already registered.' });
    }

    const defaultPassword = password || 'student123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // Random initial overall attendance for seeding
    const attendance = Math.floor(Math.random() * (95 - 65 + 1)) + 65;

    const result = await query(
      'INSERT INTO users (name, email, password, role, department, reg_no, attendance) VALUES (?, ?, ?, "student", ?, ?, ?)',
      [name, email, hashedPassword, req.user.department, reg_no, attendance]
    );

    const userId = result.insertId;

    // Seed 6 months of attendance records for the heatmap
    try {
      const today = new Date();
      const records = [];
      for (let i = 120; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        const status = Math.random() * 100 < attendance ? 'present' : 'absent';
        const formattedDate = date.toISOString().split('T')[0];
        records.push([userId, formattedDate, status, req.user.id]);
      }

      for (const rec of records) {
        await query(
          'INSERT INTO attendance_records (student_id, date, status, marked_by) VALUES (?, ?, ?, ?)',
          rec
        );
      }
    } catch (err) {
      console.error('Failed to seed attendance records:', err);
    }

    res.status(201).json({
      success: true,
      message: 'Student added successfully and attendance seeded.',
      student: {
        id: userId,
        name,
        email,
        role: 'student',
        department: req.user.department,
        reg_no,
        attendance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
