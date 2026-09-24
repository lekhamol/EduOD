import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'edu_od_secret_key_jwt_2026_xyz', {
    expiresIn: '30d'
  });
};

router.post('/register', async (req, res) => {
  const { name, email, password, role, department, reg_no } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();

  try {
    const userExists = await query('SELECT id FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
    if (userExists && userExists.length > 0) {
      return res.status(400).json({ success: false, error: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const attendance = role === 'student' ? Math.floor(Math.random() * (95 - 65 + 1)) + 65 : null;

    const result = await query(
      'INSERT INTO users (name, email, password, role, department, reg_no, attendance) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name.trim(), normalizedEmail, hashedPassword, role, department, role === 'student' ? reg_no : null, attendance]
    );

    const userId = result.insertId;

    if (role === 'student') {
      try {
        const faculty = await query('SELECT id FROM users WHERE role = "faculty" AND department = ? LIMIT 1', [department]);
        const markerId = (faculty && faculty.length > 0) ? faculty[0].id : userId;

        const today = new Date();
        const records = [];
        for (let i = 120; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          
          if (date.getDay() === 0 || date.getDay() === 6) continue;
          
          const status = Math.random() * 100 < attendance ? 'present' : 'absent';
          const formattedDate = date.toISOString().split('T')[0];
          records.push([userId, formattedDate, status, markerId]);
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
    }

    res.status(201).json({
      success: true,
      token: generateToken(userId),
      user: {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        role,
        department,
        reg_no: role === 'student' ? reg_no : undefined,
        attendance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();

  try {
    const users = await query('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
    if (users && users.length > 0) {
      const user = users[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        res.json({
          success: true,
          token: generateToken(user.id),
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            reg_no: user.reg_no,
            attendance: user.attendance
          }
        });
      } else {
        res.status(401).json({ success: false, error: 'Incorrect password. Please try again.' });
      }
    } else {
      res.status(401).json({ success: false, error: 'No account found with this email. Please register first.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

export default router;
