import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'edu_od_secret_key_jwt_2026_xyz');
      
      const users = await query(
        'SELECT id, name, email, role, department, reg_no, attendance FROM users WHERE id = ?',
        [decoded.id]
      );
      
      if (!users || users.length === 0) {
        return res.status(401).json({ success: false, error: 'Not authorized, user not found' });
      }
      
      req.user = users[0];
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized, no token provided' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Role (${req.user ? req.user.role : 'none'}) is not authorized to access this resource`
      });
    }
    next();
  };
};
