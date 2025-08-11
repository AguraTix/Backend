const nodemailer = require('nodemailer');

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('Email transport is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
  }

  const secure = port === 465; // true for 465, false for other ports like 587

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

async function sendEmail({ to, subject, html, text }) {
  const from = process.env.EMAIL_FROM || 'gloriantwari@gmail.com';
  const transporter = createTransport();

  const info = await transporter.sendMail({ from, to, subject, html, text });
  return info;
}

function buildPasswordResetHtml(code) {
  const appName = process.env.APP_NAME || 'GloriaAppPassword';
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111">
      <h2 style="margin-bottom: 8px;">${appName} Password Reset</h2>
      <p>Use the verification code below to reset your password. This code expires in 15 minutes.</p>
      <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 16px 0;">${code}</div>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;
}

async function sendPasswordResetEmail(to, code) {
  const subject = 'Your AGURA password reset code';
  const html = buildPasswordResetHtml(code);
  const text = `Your AGURA password reset code is ${code}. It expires in 15 minutes.`;
  return sendEmail({ to, subject, html, text });
}

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
};


