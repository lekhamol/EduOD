import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

// Route Imports
import authRoutes from './routes/auth.js';
import odRoutes from './routes/od.js';
import statsRoutes from './routes/stats.js';
import chatbotRoutes from './routes/chatbot.js';
import attendanceRoutes from './routes/attendance.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Connect to MongoDB
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve files uploaded statically
app.use('/uploads', express.static(uploadsDir));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/od', odRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/attendance', attendanceRoutes);

app.get('/verify-od/:id', (req, res) => {
  res.redirect(`http://localhost:5173/verify-od/${req.params.id}`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
