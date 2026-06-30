import express from 'express';
import ODRequest from '../models/ODRequest.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { role, _id, department } = req.user;
    let stats = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    if (role === 'student') {
      stats.total = await ODRequest.countDocuments({ student: _id });
      stats.pending = await ODRequest.countDocuments({ student: _id, status: { $in: ['Pending', 'Faculty_Approved'] } });
      stats.approved = await ODRequest.countDocuments({ student: _id, status: 'Approved' });
      stats.rejected = await ODRequest.countDocuments({ student: _id, status: 'Rejected' });
    } else {
      const deptQuery = role === 'hod' ? {} : { department };
      
      stats.total = await ODRequest.countDocuments(deptQuery);
      stats.pending = await ODRequest.countDocuments({ ...deptQuery, status: 'Pending' });
      stats.approved = await ODRequest.countDocuments({ ...deptQuery, status: 'Approved' });
      stats.rejected = await ODRequest.countDocuments({ ...deptQuery, status: 'Rejected' });

      if (role === 'hod') {
        const breakdown = await ODRequest.aggregate([
          { $group: { _id: '$department', count: { $sum: 1 } } }
        ]);
        stats.departmentBreakdown = breakdown;
      }
    }

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
