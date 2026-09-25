import express from 'express';
import multer from 'multer';
import { query } from '../config/db.js';
import { protect, authorize } from '../middleware/auth.js';
import { analyzeODRequest } from '../utils/aiHelper.js';
import { generateQRCode } from '../utils/qrHelper.js';
import { sendStatusEmail } from '../utils/emailHelper.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// GET Faculty list for a department (to allow student selection)
router.get('/faculty-list', protect, async (req, res) => {
  try {
    const dept = req.query.department || req.user.department;
    const faculty = await query(
      'SELECT id, name, email, department FROM users WHERE role = "faculty" AND department = ? ORDER BY name ASC',
      [dept]
    );
    res.json({ success: true, faculty });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Apply for OD (Student)
router.post('/apply', protect, authorize('student'), upload.single('attachment'), async (req, res) => {
  try {
    const { event_name, start_date, end_date, reason, faculty_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Document attachment is mandatory.' });
    }

    const attachmentPath = req.file.path.replace(/\\/g, '/');

    // Run AI analysis helper
    const aiAnalysis = await analyzeODRequest(req.user.id, start_date, reason, req.file.filename);

    const result = await query(
      `INSERT INTO od_requests (student_id, student_name, reg_no, department, faculty_id, event_name, start_date, end_date, reason, attachment, ai_analysis)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        req.user.name,
        req.user.reg_no,
        req.user.department,
        faculty_id || null,
        event_name,
        start_date,
        end_date,
        reason,
        attachmentPath,
        JSON.stringify(aiAnalysis)
      ]
    );

    const [odRequest] = await query('SELECT * FROM od_requests WHERE id = ?', [result.insertId]);

    res.status(201).json({ success: true, odRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// View student's own ODs
router.get('/my', protect, authorize('student'), async (req, res) => {
  try {
    const requests = await query(
      `SELECT o.*, f.name AS faculty_name 
       FROM od_requests o 
       LEFT JOIN users f ON o.faculty_id = f.id 
       WHERE o.student_id = ? 
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// View all ODs (Faculty & HOD)
router.get('/all', protect, authorize('faculty', 'hod'), async (req, res) => {
  try {
    const { status, department, search } = req.query;

    let sql = `
      SELECT o.*, u.email, u.attendance, f.name AS faculty_name
      FROM od_requests o
      LEFT JOIN users u ON o.student_id = u.id
      LEFT JOIN users f ON o.faculty_id = f.id
      WHERE 1=1
    `;
    const params = [];

    // Restrict access: Faculty can ONLY view requests assigned to them
    if (req.user.role === 'faculty') {
      sql += ' AND (o.faculty_id = ? OR o.faculty_id IS NULL)';
      params.push(req.user.id);
    } else if (department) {
      sql += ' AND o.department = ?';
      params.push(department);
    }

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (o.student_name LIKE ? OR o.reg_no LIKE ? OR o.event_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY o.created_at DESC';

    const requests = await query(sql, params);
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get OD details
router.get('/:id', async (req, res) => {
  try {
    const rows = await query(
      `SELECT o.*, u.email, u.attendance, f.name AS faculty_name
       FROM od_requests o
       LEFT JOIN users u ON o.student_id = u.id
       LEFT JOIN users f ON o.faculty_id = f.id
       WHERE o.id = ?`,
      [req.params.id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    res.json({ success: true, request: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Faculty Action (Approve/Reject)
router.put('/:id/review', protect, authorize('faculty'), async (req, res) => {
  try {
    const { status, comment } = req.body;
    if (!['Faculty_Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status for Faculty review' });
    }

    const rows = await query('SELECT * FROM od_requests WHERE id = ?', [req.params.id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    const request = rows[0];

    // Restrict review to assigned faculty only
    if (request.faculty_id && request.faculty_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied: This request is assigned to another faculty advisor.' });
    }

    let comments = [];
    try { comments = JSON.parse(request.comments || '[]'); } catch { comments = []; }

    if (comment) {
      comments.push({ author: req.user.name, role: 'faculty', text: comment });
    }

    await query(
      'UPDATE od_requests SET status = ?, comments = ? WHERE id = ?',
      [status, JSON.stringify(comments), req.params.id]
    );

    // Notify student via email
    const students = await query('SELECT * FROM users WHERE id = ?', [request.student_id]);
    if (students && students.length > 0) {
      await sendStatusEmail(students[0].email, students[0].name, { ...request, status, comments });
    }

    const [updated] = await query('SELECT * FROM od_requests WHERE id = ?', [req.params.id]);
    res.json({ success: true, request: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// HOD Action (Approve/Reject)
router.put('/:id/approve', protect, authorize('hod'), async (req, res) => {
  try {
    const { status, comment } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status for HOD approval' });
    }

    const rows = await query('SELECT * FROM od_requests WHERE id = ?', [req.params.id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    const request = rows[0];

    let comments = [];
    try { comments = JSON.parse(request.comments || '[]'); } catch { comments = []; }

    if (comment) {
      comments.push({ author: req.user.name, role: 'hod', text: comment });
    }

    let qrCodeData = request.qr_code_data || null;
    if (status === 'Approved') {
      const verificationLink = `http://localhost:5173/verify-od/${request.id}`;
      qrCodeData = await generateQRCode(
        `Verified OD: ${request.student_name} (${request.reg_no}) - Event: ${request.event_name} - Date: ${new Date(request.start_date).toLocaleDateString()} - Verification: ${verificationLink}`
      );
    }

    await query(
      'UPDATE od_requests SET status = ?, comments = ?, qr_code_data = ? WHERE id = ?',
      [status, JSON.stringify(comments), qrCodeData, req.params.id]
    );

    // Notify student via email
    const students = await query('SELECT * FROM users WHERE id = ?', [request.student_id]);
    if (students && students.length > 0) {
      await sendStatusEmail(students[0].email, students[0].name, { ...request, status, comments });
    }

    const [updated] = await query('SELECT * FROM od_requests WHERE id = ?', [req.params.id]);
    res.json({ success: true, request: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate OD Letter Data (approved only)
router.get('/:id/letter', async (req, res) => {
  try {
    const rows = await query(
      `SELECT o.*, 
              u.email AS student_email,
              u.attendance,
              f.name AS faculty_name,
              f.email AS faculty_email,
              h.name AS hod_name,
              h.email AS hod_email
       FROM od_requests o
       LEFT JOIN users u ON o.student_id = u.id
       LEFT JOIN users f ON o.faculty_id = f.id
       LEFT JOIN users h ON h.role = 'hod' AND h.department = o.department
       WHERE o.id = ?`,
      [req.params.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const request = rows[0];

    if (request.status !== 'Approved') {
      return res.status(400).json({ success: false, error: 'OD Letter is only available for Approved requests.' });
    }

    // Parse comments
    let comments = [];
    try { comments = JSON.parse(request.comments || '[]'); } catch { comments = []; }

    // Build reference number: OD/DEPT-CODE/YEAR/ID
    const deptCode = (request.department || 'GEN')
      .split(/[\s&]+/)
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 4);
    const year = new Date().getFullYear();
    const refNo = `OD/${deptCode}/${year}/${String(request.id).padStart(4, '0')}`;

    // Approval chain from comments
    const facultyComment = comments.find(c => c.role === 'faculty');
    const hodComment = comments.find(c => c.role === 'hod');

    const letterData = {
      ...request,
      comments,
      ref_no: refNo,
      letter_date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      start_date_fmt: new Date(request.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      end_date_fmt: new Date(request.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      faculty_name: request.faculty_name || 'Class Faculty',
      hod_name: request.hod_name || 'Head of Department',
      faculty_comment: facultyComment?.text || null,
      hod_comment: hodComment?.text || null,
      verification_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-od/${request.id}`,
    };

    res.json({ success: true, letter: letterData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

