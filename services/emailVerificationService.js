const { User } = require('../models');
const emailService = require('./emailService');

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send email verification code to user
 * @param {string} email - User email
 * @param {string} name - User name
 * @returns {Promise<Object>} Verification code and expiration info
 */
async function sendVerificationEmail(email, name) {
  const user = await User.findOne({ where: { email } });
  
  if (!user) {
    throw new Error('User not found');
  }

  if (user.email_verified) {
    throw new Error('Email is already verified');
  }

  const verificationCode = generateVerificationCode();
  const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Save verification code to user
  user.verificationCode = verificationCode;
  user.codeExpiresAt = codeExpiresAt;
  await user.save();

  // Send verification email
  await emailService.sendEmailVerification({
    email: user.email,
    name: user.name || name,
    verificationCode,
  });

  return {
    message: 'Verification email sent successfully',
    expiresAt: codeExpiresAt,
  };
}

/**
 * Verify email with code
 * @param {string} email - User email
 * @param {string} code - Verification code
 * @returns {Promise<Object>} Verification result
 */
async function verifyEmail(email, code) {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.email_verified) {
    throw new Error('Email is already verified');
  }

  if (!user.verificationCode || !user.codeExpiresAt) {
    throw new Error('No verification code found. Please request a new one.');
  }

  if (new Date() > new Date(user.codeExpiresAt)) {
    throw new Error('Verification code has expired. Please request a new one.');
  }

  if (user.verificationCode !== code) {
    throw new Error('Invalid verification code');
  }

  // Mark email as verified and clear verification code
  user.email_verified = true;
  user.email_verified_at = new Date();
  user.verificationCode = null;
  user.codeExpiresAt = null;
  await user.save();

  return {
    message: 'Email verified successfully',
    email: user.email,
  };
}

/**
 * Resend verification email
 * @param {string} email - User email
 * @returns {Promise<Object>} Resend result
 */
async function resendVerificationEmail(email) {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.email_verified) {
    throw new Error('Email is already verified');
  }

  return await sendVerificationEmail(email, user.name);
}

module.exports = {
  sendVerificationEmail,
  verifyEmail,
  resendVerificationEmail,
  generateVerificationCode,
};

