import { query } from '../config/db.js';

export const analyzeODRequest = async (studentId, startDate, reason, file) => {
  let riskScore = 10;
  let recommendation = 'Recommend Approval: Request details appear standard.';
  let docVerified = true;

  // 1. Check if the date is in the past
  const today = new Date();
  const start = new Date(startDate);
  if (start < today) {
    riskScore += 30;
    recommendation = 'Flagged: Event start date is in the past. Verify retrospectively.';
  }

  // 2. Count existing OD requests for this student in the current month
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const mysqlDate = firstDayOfMonth.toISOString().slice(0, 10);
  
  const results = await query(
    'SELECT COUNT(*) as count FROM od_requests WHERE student_id = ? AND created_at >= ?',
    [studentId, mysqlDate]
  );
  const count = results[0]?.count || 0;

  if (count >= 3) {
    riskScore += 40;
    recommendation = `High Frequency Alert: Student has already requested ${count} ODs this month. Verify attendance balance.`;
  }

  // 3. Simple text keywords checking
  const lowerReason = reason.toLowerCase();
  if (lowerReason.includes('hackathon') || lowerReason.includes('seminar') || lowerReason.includes('symposium') || lowerReason.includes('workshop') || lowerReason.includes('sports')) {
    riskScore -= 15;
    if (riskScore < 0) riskScore = 0;
    recommendation = 'Highly Recommended: Co-curricular activity representation.';
  } else if (lowerReason.length < 15) {
    riskScore += 20;
    recommendation = 'Vague Reason: The application reason is too short. Please ask for detail.';
  }

  // 4. File check
  if (file) {
    const ext = file.split('.').pop().toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
      docVerified = false;
      riskScore += 30;
      recommendation = 'Invalid Document: The format does not match verified PDF/Image layouts.';
    }
  } else {
    docVerified = false;
    riskScore += 50;
    recommendation = 'Missing Document: Application requires a valid supporting document.';
  }

  return {
    riskScore: Math.min(100, Math.max(0, riskScore)),
    recommendation,
    docVerified
  };
};
