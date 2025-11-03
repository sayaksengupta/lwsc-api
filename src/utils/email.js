const sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    const message = `
      You requested a password reset.
      Click this link to reset: ${resetUrl}
      Link expires in 1 hour.
    `;
  
    // In real app: use nodemailer, SendGrid, etc.
    console.log('Password Reset Email:\n', { to: email, resetUrl, message });
    // await transporter.sendMail({ to: email, subject: 'Reset Password', text: message });
  
    return true;
  };
  
  module.exports = { sendPasswordResetEmail };