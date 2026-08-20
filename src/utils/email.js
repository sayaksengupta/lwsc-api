const nodemailer = require('nodemailer');

const sendPasswordResetEmail = async (email, token, isAdmin = false) => {
  const path = isAdmin ? '/admin/reset-password' : '/reset-password';
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}${path}?token=${token}`;
  
  const fromName = process.env.EMAIL_FROM_NAME || 'CSCF Kids';
  const fromEmail = process.env.EMAIL_USER || 'support@cscfkids.org';
  const message = `
    You requested a password reset.
    Click this link to reset your password: ${resetUrl}

    This link will expire in 1 hour.
    If you did not request this, please ignore this email.
  `;

  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333333;">Password Reset Request</h2>
      <p>You requested a password reset for your CSCF Kids account.</p>
      <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #666666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="color: #007bff; word-break: break-all; font-size: 14px;">${resetUrl}</p>
      <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
      <p style="color: #999999; font-size: 12px;">If you did not request a password reset, please ignore this email.</p>
    </div>
  `;

  console.log(`Sending Password Reset Email to ${email} (Admin: ${isAdmin})`);

  if (!process.env.EMAIL_PASS) {
    console.warn('WARNING: EMAIL_PASS is not set in environment variables. Email was NOT sent. Details logged below:');
    console.log('Password Reset Email Mock:\n', { to: email, resetUrl });
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'netsol-smtp-oxcs.hostingplatform.com',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true', // true for port 465, false for 587
      auth: {
        user: fromEmail,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'Reset your CSCF Kids Password',
      text: message,
      html: htmlMessage
    });

    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
};

module.exports = { sendPasswordResetEmail };