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

  try {
    const userExists = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (userExists && userExists.length > 0) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const attendance = role === 'student' ? Math.floor(Math.random() * (95 - 65 + 1)) + 65 : null;

    const result = await query(
      'INSERT INTO users (name, email, password, role, department, reg_no, attendance) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, department, role === 'student' ? reg_no : null, attendance]
    );

    const userId = result.insertId;

    res.status(201).json({
      success: true,
      token: generateToken(userId),
      user: {
        id: userId,
        name,
        email,
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

  try {
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
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
        res.status(401).json({ success: false, error: 'Invalid email or password' });
      }
    } else {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

export default router;
