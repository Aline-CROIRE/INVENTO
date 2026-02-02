const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendSetupEmail = async (email, token) => {
  const url = `${process.env.FRONTEND_URL}/setup-password?token=${token}`;
  const mailOptions = {
    from: '"Invento System" <no-reply@invento.com>',
    to: email,
    subject: 'Invento - Set Up Your Account',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #28A745;">Welcome to Invento</h2>
        <p>Your account is ready. Please set your password to begin using the system.</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #007BFF; color: #fff; text-decoration: none; border-radius: 5px;">Set Up Password</a>
        <p style="margin-top: 20px; font-size: 0.8em; color: #666;">This link expires in 24 hours.</p>
      </div>`
  };
  return transporter.sendMail(mailOptions);
};