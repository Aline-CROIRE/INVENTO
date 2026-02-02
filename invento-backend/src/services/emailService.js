const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    // .trim() removes any accidental spaces from the .env file
    user: process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '',
    pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : ''
  }
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.log("--- ❌ SMTP CONNECTION ERROR ---");
    console.error(error.message); 
    console.log("Check if EMAIL_USER and EMAIL_PASS are correct in .env");
    console.log("---------------------------------");
  } else {
    console.log("--- ✅ SMTP SERVER IS READY ---");
  }
});

exports.sendSetupEmail = async (email, token) => {
  const url = `${process.env.FRONTEND_URL}/setup-password?token=${token}`;
  
  const mailOptions = {
    from: `"Invento System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Complete Your Invento Account Setup',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #28A745;">Welcome to Invento</h2>
        <p>Please click the button below to set up your password.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #007BFF; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Set Up Password</a>
        </div>
      </div>`
  };

  return transporter.sendMail(mailOptions);
};