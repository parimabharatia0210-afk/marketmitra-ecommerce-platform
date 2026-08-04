const nodemailer = require('nodemailer');
const path = require('path');

// Fallback password if EMAIL_PASS is not provided.
// In reality, if it's not provided, authentication will fail unless EMAIL_PASS is set in the environment.
const EMAIL_USER = process.env.EMAIL_USER || 'marketmitrasuport@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'bmldnhhfntinbdwk'; 

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

const sendOtpEmail = async (toEmail, otpCode) => {
  const mailOptions = {
    from: `"MarketMitra Support" <${EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your MarketMitra Verification Code',
    text: `Your OTP for MarketMitra registration is: ${otpCode}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 30px; color: #333; text-align: center; background-color: #0f172a; border-radius: 10px; max-width: 500px; margin: 0 auto;">
        <img src="cid:marketmitra_logo" alt="MarketMitra" style="max-width: 250px; margin-bottom: 20px;" />
        <h2 style="color: #22c55e; margin-bottom: 5px;">Verification</h2>
        <p style="color: #e5e7eb; font-size: 16px;">Your One-Time Password (OTP) for verification is:</p>
        <h1 style="background: #1e293b; color: #4ade80; padding: 15px 30px; display: inline-block; letter-spacing: 4px; border-radius: 8px; border: 1px solid #334155;">${otpCode}</h1>
        <p style="color: #9ca3af; font-size: 14px; margin-top: 20px;">This code will expire in 10 minutes.</p>
        <p style="font-size: 12px; color: #64748b; margin-top: 30px;">If you did not request this code, please ignore this email.</p>
      </div>
    `,
    attachments: [
      {
        filename: 'email-logo.png',
        path: path.join(__dirname, '../uploads/email-logo.png'),
        cid: 'marketmitra_logo' // same cid value as in the html img src
      }
    ]
  };

  if (!EMAIL_PASS) {
    console.log(`[DEV MODE] EMAIL_PASS not set. Skipping real email send.`);
    console.log(`[DEV MODE] Simulated email to ${toEmail} with OTP: ${otpCode}`);
    return Promise.resolve(true); // Pretend it succeeded
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

module.exports = {
  sendOtpEmail,
};
