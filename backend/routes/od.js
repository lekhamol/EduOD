import express from 'express';
import multer from 'multer';
import ODRequest from '../models/ODRequest.js';
import User from '../models/User.js';
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

// Apply for OD (Student)
router.post('/apply', protect, authorize('student'), upload.single('attachment'), async (req, res) => {
  try {
    const { event_name, start_date, end_date, reason } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Document attachment is mandatory.' });
    }

    const attachmentPath = req.file.path.replace(/\\/g, '/');

    // Run AI analysis helper
    const aiAnalysis = await analyzeODRequest(req.user._id, start_date, reason, req.file.filename);

    const odRequest = await ODRequest.create({
      student: req.user._id,
      student_name: req.user.name,
      reg_no: req.user.reg_no,
      department: req.user.department,
      event_name,
      start_date,
      end_date,
      reason,
      attachment: attachmentPath,
      ai_analysis: aiAnalysis
    });

    res.status(201).json({ success: true, odRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// View student's own ODs
router.get('/my', protect, authorize('student'), async (req, res) => {
  try {
    const requests = await ODRequest.find({ student: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// View all ODs (Faculty & HOD)
router.get('/all', protect, authorize('faculty', 'hod'), async (req, res) => {
  try {
    const { status, department, search } = req.query;
    let query = {};

    if (department) {
      query.department = department;
    }
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { student_name: { $regex: search, $options: 'i' } },
        { reg_no: { $regex: search, $options: 'i' } },
        { event_name: { $regex: search, $options: 'i' } }
      ];
    }

    const requests = await ODRequest.find(query)
      .populate('student', 'name email department attendance')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get OD details
router.get('/:id', async (req, res) => {
  try {
    const request = await ODRequest.findById(req.params.id).populate('student', 'name email department reg_no attendance');
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    res.json({ success: true, request });
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

    const request = await ODRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    request.status = status;
    if (comment) {
      request.comments.push({
        author: req.user.name,
        role: 'faculty',
        text: comment
      });
    }

    await request.save();

    // Notify student via email
    const student = await User.findById(request.student);
    if (student) {
      await sendStatusEmail(student.email, student.name, request);
    }

    res.json({ success: true, request });
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

    const request = await ODRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    request.status = status;
    if (comment) {
      request.comments.push({
        author: req.user.name,
        role: 'hod',
        text: comment
      });
    }

    if (status === 'Approved') {
      const verificationLink = `http://localhost:5173/verify-od/${request._id}`;
      request.qr_code_data = await generateQRCode(
        `Verified OD: ${request.student_name} (${request.reg_no}) - Event: ${request.event_name} - Date: ${new Date(request.start_date).toLocaleDateString()} - Verification: ${verificationLink}`
      );
    }

    await request.save();

    // Notify student via email
    const student = await User.findById(request.student);
    if (student) {
      await sendStatusEmail(student.email, student.name, request);
    }

    res.json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
