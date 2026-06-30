import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  author: { type: String, required: true },
  role: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const odRequestSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    student_name: { type: String, required: true },
    reg_no: { type: String, required: true },
    department: { type: String, required: true },
    event_name: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    reason: { type: String, required: true },
    attachment: { type: String, required: true }, // Mandatory file upload as requested
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Faculty_Approved', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    comments: [commentSchema],
    qr_code_data: { type: String }, // Base64 data of QR Code
    ai_analysis: {
      recommendation: { type: String, default: 'Low risk request' },
      riskScore: { type: Number, default: 0 },
      docVerified: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

const ODRequest = mongoose.model('ODRequest', odRequestSchema);
export default ODRequest;
