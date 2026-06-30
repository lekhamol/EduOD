import nodemailer from 'nodemailer';

export const sendStatusEmail = async (studentEmail, studentName, odRequest) => {
  try {
    let testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });

    const info = await transporter.sendMail({
      from: '"Edu OD System" <noreply@edu-od.com>',
      to: studentEmail,
      subject: `On-Duty Request Update: ${odRequest.status}`,
      text: `Hello ${studentName},\n\nYour OD Request for the event "${odRequest.event_name}" has been updated to: ${odRequest.status}.\n\nBest regards,\nCollege Administration`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #4F46E5;">Edu OD System Notification</h2>
          <p>Hello <strong>${studentName}</strong>,</p>
          <p>Your On-Duty (OD) request for the event <strong>"${odRequest.event_name}"</strong> has been updated.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 1.1rem;">Current Status: <span style="font-weight: bold; color: ${odRequest.status === 'Approved' ? '#10B981' : odRequest.status === 'Rejected' ? '#EF4444' : '#F59E0B'};">${odRequest.status}</span></p>
          ${odRequest.comments.length > 0 ? `<p><strong>Latest Comment:</strong> "${odRequest.comments[odRequest.comments.length - 1].text}"</p>` : ''}
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 0.9rem; color: #777;">This is an automated notification. Please log in to your dashboard to view more details.</p>
        </div>
      `
    });

    console.log("Email Notification sent successfully!");
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    return nodemailer.getTestMessageUrl(info);
  } catch (error) {
    console.error('Email sending failed, falling back to console log:', error.message);
    console.log(`[Notification Fallback] Email to ${studentEmail}: OD status is now ${odRequest.status}`);
    return null;
  }
};
