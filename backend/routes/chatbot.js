import express from 'express';
import jwt from 'jsonwebtoken';
import ODRequest from '../models/ODRequest.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { message, token } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  const query = message.toLowerCase().trim();
  let user = null;

  // Extract user context from token if provided
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'edu_od_secret_key_jwt_2026_xyz');
      user = await User.findById(decoded.id);
    } catch (err) {
      // Fail silently and treat as anonymous query
    }
  }

  let reply = "I am the Edu OD Assistant. Ask me queries like 'How do I apply?', 'Check my OD status', or 'Who approves my OD?'";

  if ((query.includes('my status') || query.includes('status of my') || query.includes('check my od')) && user) {
    if (user.role === 'student') {
      const lastRequest = await ODRequest.findOne({ student: user._id }).sort({ createdAt: -1 });
      if (lastRequest) {
        reply = `Hi ${user.name}, your latest On-Duty request for "${lastRequest.event_name}" is currently: **${lastRequest.status}**.`;
        if (lastRequest.status === 'Pending') {
          reply += ` It is awaiting Faculty review.`;
        } else if (lastRequest.status === 'Faculty_Approved') {
          reply += ` It has been recommended by your Faculty advisor and is awaiting HOD final approval.`;
        } else if (lastRequest.status === 'Approved') {
          reply += ` You can print or download your approved letter with the secure QR code!`;
        }
      } else {
        reply = `Hi ${user.name}, you haven't submitted any OD requests yet. You can apply for one in the dashboard!`;
      }
    } else {
      reply = `Hi ${user.name}, since you are a ${user.role}, you can check and approve requests in your list!`;
    }
  } else if (query.includes('how to apply') || query.includes('apply for od') || query.includes('apply od') || query.includes('submit')) {
    reply = "To apply for On-Duty (OD) leave:\n1. Log in to your Student Account.\n2. Click the 'Apply for OD' button on the dashboard.\n3. Fill in the event details and select dates.\n4. Upload a mandatory supporting document (PDF or Image).\n5. Submit! The request will be reviewed by Faculty and HOD.";
  } else if (query.includes('who approves') || query.includes('approval process') || query.includes('multi-level') || query.includes('flow')) {
    reply = "The system follows a multi-level approval flow:\n1. Faculty Approval: Your Faculty advisor reviews and recommends the request.\n2. HOD Approval: The HOD reviews the request for final verification.\n3. Final Status: Once both approve, the request changes to 'Approved' and is verified.";
  } else if (query.includes('qr code') || query.includes('qr') || query.includes('letter') || query.includes('download')) {
    reply = "When your OD is fully 'Approved', a secure QR code is automatically generated on your letter. Faculty can scan this QR code to instantly verify the request authenticity.";
  } else if (query.includes('ai') || query.includes('document verification') || query.includes('risk score') || query.includes('smart')) {
    reply = "Our system performs smart checks on submission. It audits document extensions, date ranges, and monthly frequencies to calculate a Risk Score (0-100), helping faculty and HODs evaluate requests faster.";
  } else if (query.includes('hi') || query.includes('hello') || query.includes('hey') || query.includes('greetings')) {
    if (user) {
      reply = `Hello ${user.name}! I'm your Edu OD Assistant. How can I help you today?`;
    } else {
      reply = "Hello! I am your Edu OD Assistant. Please log in to check your OD applications, or ask me any general FAQs!";
    }
  }

  res.json({ success: true, reply });
});

export default router;
