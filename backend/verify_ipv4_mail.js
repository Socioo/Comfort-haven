const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

async function verifyBrandedMail() {
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS ? process.env.MAIL_PASS.replace(/\"/g, '') : '';
  
  console.log('Verifying Branded SMTP for:', user);
  
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587'),
    secure: process.env.MAIL_SECURE === 'true',
    auth: { user, pass },
    family: 4
  });

  const logoPath = path.join(process.cwd(), '..', 'frontend', 'assets', 'images', 'icon.png');

  const mailOptions = {
    from: process.env.MAIL_FROM || user,
    to: user,
    subject: 'Comfort Haven - Proper IPv4 Verification',
    html: `<h1>Success!</h1><p>This email confirms that the IPv4 force is working correctly.</p>`,
  };

  try {
    console.log('Sending branded test mail (Proper IPv4 Forced)...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Success! Branded message sent:', info.messageId);
  } catch (err) {
    console.error('Branded Mail Verification Failed:', err.message);
  }
}

verifyBrandedMail();
