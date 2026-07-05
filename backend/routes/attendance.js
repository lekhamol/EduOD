import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

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
