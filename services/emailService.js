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
  const appName = process.env.APP_NAME || 'AGURA Ticketing';
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

function formatExpiration(expiresAt) {
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toUTCString();
}

function buildAdminCreationHtml({ name, email, verificationCode, tempPassword, expiresAt }) {
  const appName = process.env.APP_NAME || 'AGURA Ticketing';
  const baseUrl = process.env.BASE_URL || 'https://agura-ticketing-backend.onrender.com';
  const expirationLabel = formatExpiration(expiresAt);
  
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50; margin-bottom: 20px;">Welcome to ${appName}!</h2>
      
      <p>Hello ${name},</p>
      
      <p>Your admin account has been created successfully. You can now log in to the ${appName} admin panel.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Your Login Credentials:</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> <code style="background-color: #fff; padding: 5px 10px; border-radius: 3px;">${tempPassword}</code></p>
        <p><strong>Verification Code:</strong> <code style="background-color: #fff; padding: 5px 10px; border-radius: 3px; font-size: 18px; letter-spacing: 2px;">${verificationCode}</code></p>
        ${expirationLabel ? `<p><strong>Account Expires On:</strong> ${expirationLabel}</p>` : ''}
      </div>
      
      <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
        <p style="margin: 0;"><strong>⚠️ Important Security Notice:</strong></p>
        <p style="margin: 5px 0 0 0;">Please change your password immediately after your first login for security purposes.</p>
      </div>
      
      <p><strong>How to Login:</strong></p>
      <ol>
        <li>Go to the admin login page</li>
        <li>Enter your email: <strong>${email}</strong></li>
        <li>Enter the temporary password provided above</li>
        <li>You may Change your password after logging in </li>
        ${expirationLabel ? `<li>Make sure to use the account before <strong>${expirationLabel}</strong></li>` : ''}
      </ol>
      
      <p>If you have any questions or need assistance, please contact the super administrator.</p>
      
      <p style="margin-top: 30px;">Best regards,<br>${appName} Team</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      <p style="font-size: 12px; color: #666;">This is an automated email. Please do not reply to this message.</p>
    </div>
  `;
}

async function sendAdminCreationEmail({ email, name, verificationCode, tempPassword, expiresAt }) {
  const expirationLabel = formatExpiration(expiresAt);
  const subject = 'Your AGURA Admin Account Has Been Created';
  const html = buildAdminCreationHtml({ name, email, verificationCode, tempPassword, expiresAt });
  const text = `Hello ${name},\n\nYour admin account has been created.\n\nEmail: ${email}\nTemporary Password: ${tempPassword}\nVerification Code: ${verificationCode}${expirationLabel ? `\nAccount Expires On: ${expirationLabel}` : ''}\n\nPlease change your password after your first login.\n\nBest regards,\nAGURA Team`;
  return sendEmail({ to: email, subject, html, text });
}

function buildEmailVerificationHtml({ name, email, verificationCode }) {
  const appName = process.env.APP_NAME || 'AGURA Ticketing';
  const baseUrl = process.env.BASE_URL || 'https://agura-ticketing-backend.onrender.com';
  
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50; margin-bottom: 20px;">Welcome to ${appName}!</h2>
      
      <p>Hello ${name},</p>
      
      <p>Thank you for registering with ${appName}. Please verify your email address to complete your registration.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
        <h3 style="margin-top: 0;">Your Verification Code:</h3>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; color: #4CAF50;">
          ${verificationCode}
        </div>
        <p style="color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
      </div>
      
      <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
        <p style="margin: 0;"><strong>📧 How to Verify:</strong></p>
        <ol style="margin: 5px 0 0 20px; padding-left: 0;">
          <li>Copy the verification code above</li>
          <li>Go to the verification page in the app</li>
          <li>Enter your email: <strong>${email}</strong></li>
          <li>Enter the verification code</li>
        </ol>
      </div>
      
      <p>If you didn't create an account with ${appName}, please ignore this email.</p>
      
      <p style="margin-top: 30px;">Best regards,<br>${appName} Team</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      <p style="font-size: 12px; color: #666;">This is an automated email. Please do not reply to this message.</p>
    </div>
  `;
}

async function sendEmailVerification({ email, name, verificationCode }) {
  const subject = 'Verify Your Email Address - AGURA Ticketing';
  const html = buildEmailVerificationHtml({ name, email, verificationCode });
  const text = `Hello ${name},\n\nThank you for registering with AGURA Ticketing.\n\nYour email verification code is: ${verificationCode}\n\nThis code will expire in 15 minutes.\n\nIf you didn't create an account, please ignore this email.\n\nBest regards,\nAGURA Team`;
  return sendEmail({ to: email, subject, html, text });
}

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendAdminCreationEmail,
  sendEmailVerification,
};


