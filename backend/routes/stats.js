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

      // 1. Student monthly OD submissions trend
      const monthlyTrend = await query(
        `SELECT
           DATE_FORMAT(created_at, '%Y-%m') AS month,
           COUNT(*) AS total,
           SUM(status = 'Approved') AS approved,
           SUM(status = 'Rejected') AS rejected,
           SUM(status IN ('Pending','Faculty_Approved')) AS pending
         FROM od_requests
         WHERE student_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
         GROUP BY DATE_FORMAT(created_at, '%Y-%m')
         ORDER BY month ASC`,
        [id]
      );
      stats.monthlyTrend = monthlyTrend;

      // 2. Student top events
      const eventRows = await query(
        `SELECT event_name, COUNT(*) AS count
         FROM od_requests
         WHERE student_id = ?
         GROUP BY event_name
         ORDER BY count DESC
         LIMIT 8`,
        [id]
      );
      stats.topEvents = eventRows;

      // 3. Student weekday submission activity
      const weekdayActivity = await query(
        `SELECT
           DAYNAME(created_at) AS day_name,
           DAYOFWEEK(created_at) AS day_num,
           COUNT(*) AS count
         FROM od_requests
         WHERE student_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 4 WEEK)
         GROUP BY DAYNAME(created_at), DAYOFWEEK(created_at)
         ORDER BY day_num ASC`,
        [id]
      );
      stats.weekdayActivity = weekdayActivity;

      // 4. Student Attendance Stats
      const studentUser = await query(
        `SELECT attendance, department FROM users WHERE id = ?`,
        [id]
      );
      stats.personalAttendance = studentUser[0]?.attendance ?? null;

      if (studentUser[0]?.department) {
        const deptAvgRow = await query(
          `SELECT ROUND(AVG(attendance), 1) AS avg_attendance
           FROM users WHERE role = 'student' AND department = ? AND attendance IS NOT NULL`,
          [studentUser[0].department]
        );
        stats.deptAvgAttendance = deptAvgRow[0]?.avg_attendance || null;
      } else {
        stats.deptAvgAttendance = null;
      }

      // Detailed present/absent/od day breakdown from attendance_records
      const recordsBreakdown = await query(
        `SELECT
           SUM(status = 'present') AS present_count,
           SUM(status = 'absent') AS absent_count,
           SUM(status = 'od') AS od_count
         FROM attendance_records WHERE student_id = ?`,
        [id]
      );
      stats.attendanceBreakdown = {
        present: recordsBreakdown[0]?.present_count || 0,
        absent: recordsBreakdown[0]?.absent_count || 0,
        od: recordsBreakdown[0]?.od_count || 0
      };

      // 5. Personal approval rate
      const total = stats.total || 1;
      stats.approvalRate = Math.round((stats.approved / total) * 100);

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
        // Faculty
        sql = `SELECT
          COUNT(*) AS total,
          SUM(status = 'Pending') AS pending,
          SUM(status = 'Faculty_Approved') AS recommended,
          SUM(status = 'Approved') AS approved,
          SUM(status = 'Rejected') AS rejected
         FROM od_requests WHERE department = ?`;
        params = [department];
      }

      const rows = await query(sql, params);
      
      if (role === 'hod') {
        stats = {
          total: rows[0].total || 0,
          pending: rows[0].pending || 0,
          approved: rows[0].approved || 0,
          rejected: rows[0].rejected || 0
        };

        // Department breakdown (existing)
        const breakdown = await query(
          `SELECT department AS _id, COUNT(*) AS count FROM od_requests GROUP BY department`
        );
        stats.departmentBreakdown = breakdown;

        // ── Analytics Data for HOD ──────────────────────────────────────────
        const monthlyTrend = await query(
          `SELECT
             DATE_FORMAT(created_at, '%Y-%m') AS month,
             COUNT(*) AS total,
             SUM(status = 'Approved') AS approved,
             SUM(status = 'Rejected') AS rejected,
             SUM(status IN ('Pending','Faculty_Approved')) AS pending
           FROM od_requests
           WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
           GROUP BY DATE_FORMAT(created_at, '%Y-%m')
           ORDER BY month ASC`
        );
        stats.monthlyTrend = monthlyTrend;

        const eventRows = await query(
          `SELECT event_name, COUNT(*) AS count
           FROM od_requests
           GROUP BY event_name
           ORDER BY count DESC
           LIMIT 8`
        );
        stats.topEvents = eventRows;

        const deptApproval = await query(
          `SELECT
             department,
             COUNT(*) AS total,
             SUM(status = 'Approved') AS approved,
             ROUND(100.0 * SUM(status = 'Approved') / COUNT(*), 1) AS approval_rate
           FROM od_requests
           GROUP BY department
           ORDER BY approval_rate DESC`
        );
        stats.deptApproval = deptApproval;

        const deptAttendance = await query(
          `SELECT department, ROUND(AVG(attendance), 1) AS avg_attendance
           FROM users WHERE role = 'student' AND attendance IS NOT NULL
           GROUP BY department
           ORDER BY avg_attendance DESC`
        );
        stats.deptAttendance = deptAttendance;

        const weekdayActivity = await query(
          `SELECT
             DAYNAME(created_at) AS day_name,
             DAYOFWEEK(created_at) AS day_num,
             COUNT(*) AS count
           FROM od_requests
           WHERE created_at >= DATE_SUB(NOW(), INTERVAL 4 WEEK)
           GROUP BY DAYNAME(created_at), DAYOFWEEK(created_at)
           ORDER BY day_num ASC`
        );
        stats.weekdayActivity = weekdayActivity;

        const totalCount = stats.total || 1;
        stats.approvalRate = Math.round((stats.approved / totalCount) * 100);
      } else {
        // Faculty: department-scoped statistics
        stats = {
          total: rows[0].total || 0,
          pending: rows[0].pending || 0,
          recommended: rows[0].recommended || 0,
          approved: rows[0].approved || 0,
          rejected: rows[0].rejected || 0
        };

        // 1. Department monthly trend
        const monthlyTrend = await query(
          `SELECT
             DATE_FORMAT(created_at, '%Y-%m') AS month,
             COUNT(*) AS total,
             SUM(status = 'Approved') AS approved,
             SUM(status = 'Rejected') AS rejected,
             SUM(status = 'Pending') AS pending_faculty,
             SUM(status = 'Faculty_Approved') AS pending_hod
           FROM od_requests
           WHERE department = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
           GROUP BY DATE_FORMAT(created_at, '%Y-%m')
           ORDER BY month ASC`,
          [department]
        );
        stats.monthlyTrend = monthlyTrend;

        // 2. Department top events
        const eventRows = await query(
          `SELECT event_name, COUNT(*) AS count
           FROM od_requests
           WHERE department = ?
           GROUP BY event_name
           ORDER BY count DESC
           LIMIT 8`,
          [department]
        );
        stats.topEvents = eventRows;

        // 3. Department weekday activity
        const weekdayActivity = await query(
          `SELECT
             DAYNAME(created_at) AS day_name,
             DAYOFWEEK(created_at) AS day_num,
             COUNT(*) AS count
           FROM od_requests
           WHERE department = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 4 WEEK)
           GROUP BY DAYNAME(created_at), DAYOFWEEK(created_at)
           ORDER BY day_num ASC`,
          [department]
        );
        stats.weekdayActivity = weekdayActivity;

        // 4. Department Attendance Tracker
        const avgAttendanceRow = await query(
          `SELECT ROUND(AVG(attendance), 1) AS avg_attendance
           FROM users WHERE role = 'student' AND department = ? AND attendance IS NOT NULL`,
          [department]
        );
        stats.avgAttendance = avgAttendanceRow[0]?.avg_attendance || 0;

        const shortageCountRow = await query(
          `SELECT COUNT(*) AS count FROM users WHERE role = 'student' AND department = ? AND attendance < 75`,
          [department]
        );
        stats.shortageCount = shortageCountRow[0]?.count || 0;

        const shortageStudents = await query(
          `SELECT id, name, reg_no, attendance FROM users WHERE role = 'student' AND department = ? AND attendance < 75 ORDER BY attendance ASC LIMIT 5`,
          [department]
        );
        stats.shortageStudents = shortageStudents;

        // 5. Department approval rate
        const totalCount = stats.total || 1;
        stats.approvalRate = Math.round((stats.approved / totalCount) * 100);
      }
    }

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

