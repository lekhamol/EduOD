import express from 'express';
import { query } from '../config/db.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { role, id, department } = req.user;
    let stats = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    if (role === 'student') {
      const rows = await query(
        `SELECT
          COUNT(*) AS total,
          SUM(status IN ('Pending','Faculty_Approved')) AS pending,
          SUM(status = 'Approved') AS approved,
          SUM(status = 'Rejected') AS rejected
         FROM od_requests WHERE student_id = ?`,
        [id]
      );
      stats = {
        total: rows[0].total || 0,
        pending: rows[0].pending || 0,
        approved: rows[0].approved || 0,
        rejected: rows[0].rejected || 0
      };
    } else {
      let sql, params;

      if (role === 'hod') {
        sql = `SELECT
          COUNT(*) AS total,
          SUM(status = 'Pending') AS pending,
          SUM(status = 'Approved') AS approved,
          SUM(status = 'Rejected') AS rejected
         FROM od_requests`;
        params = [];
      } else {
        sql = `SELECT
          COUNT(*) AS total,
          SUM(status = 'Pending') AS pending,
          SUM(status = 'Approved') AS approved,
          SUM(status = 'Rejected') AS rejected
         FROM od_requests WHERE department = ?`;
        params = [department];
      }

      const rows = await query(sql, params);
      stats = {
        total: rows[0].total || 0,
        pending: rows[0].pending || 0,
        approved: rows[0].approved || 0,
        rejected: rows[0].rejected || 0
      };

      if (role === 'hod') {
        const breakdown = await query(
          `SELECT department AS _id, COUNT(*) AS count FROM od_requests GROUP BY department`
        );
        stats.departmentBreakdown = breakdown;
      }
    }

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
