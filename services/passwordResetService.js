const { User } = require('../models');
const bcrypt = require('bcrypt');
const validator = require('validator');
const { sendPasswordResetEmail } = require('./emailService');

// Generate a 6-digit verification code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Request password reset
exports.requestPasswordReset = async (identifier) => {
    // Check if identifier is email or phone number
    const isEmail = validator.isEmail(identifier);
    
    let user;
    if (isEmail) {
        user = await User.findOne({ where: { email: identifier } });
    } else {
        user = await User.findOne({ where: { phone_number: identifier } });
    }

    if (!user) {
        throw new Error('No account found with this email or phone number');
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    
    // Persist verification code and expiry on the user
    user.verificationCode = verificationCode;
    user.codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    // Send email to the actual user's email
    if (user.email) {
        try {
            const recipient = isEmail ? identifier : user.email;
            await sendPasswordResetEmail(recipient, verificationCode);
        } catch (emailError) {
            // Keep behavior resilient: still return success so user isn't leaked info
            console.error('Failed to send password reset email:', emailError);
        }
    }

    return {
        message: 'Password reset code sent to your email',
        email: user.email
    };
};

// Verify reset code
exports.verifyResetCode = async (identifier, verificationCode) => {
    // Check if identifier is email or phone number
    const isEmail = validator.isEmail(identifier);
    
    let user;
    if (isEmail) {
        user = await User.findOne({ where: { email: identifier } });
    } else {
        user = await User.findOne({ where: { phone_number: identifier } });
    }

    if (!user) {
        throw new Error('No account found with this email or phone number');
    }

    // Check if code exists and is not expired
    if (!user.verificationCode || !user.codeExpiresAt) {
        throw new Error('No verification code found. Please request a new one.');
    }

    if (new Date() > user.codeExpiresAt) {
        throw new Error('Verification code has expired. Please request a new one.');
    }

    if (user.verificationCode !== verificationCode) {
        throw new Error('Invalid verification code');
    }

    return {
        message: 'Verification code is valid',
        user_id: user.user_id
    };
};

// Reset password with verification code
exports.resetPassword = async (identifier, verificationCode, newPassword) => {
    // Validate new password
    if (!newPassword || newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
    }
    if (!/(?=.*[A-Za-z])/.test(newPassword)) {
        throw new Error('Password must contain at least one letter');
    }
    if (!/(?=.*\d)/.test(newPassword)) {
        throw new Error('Password must contain at least one number');
    }
    if (!/(?=.*[@$!%*#?&])/.test(newPassword)) {
        throw new Error('Password must contain at least one special character');
    }

    // Check if identifier is email or phone number
    const isEmail = validator.isEmail(identifier);
    
    let user;
    if (isEmail) {
        user = await User.findOne({ where: { email: identifier } });
    } else {
        user = await User.findOne({ where: { phone_number: identifier } });
    }

    if (!user) {
        throw new Error('No account found with this email or phone number');
    }

    // Verify the code again
    if (!user.verificationCode || !user.codeExpiresAt) {
        throw new Error('No verification code found. Please request a new one.');
    }

    if (new Date() > user.codeExpiresAt) {
        throw new Error('Verification code has expired. Please request a new one.');
    }

    if (user.verificationCode !== verificationCode) {
        throw new Error('Invalid verification code');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear verification code
    await user.update({ 
        password: hashedPassword,
        verificationCode: null,
        codeExpiresAt: null
    });

    return {
        message: 'Password reset successfully'
    };
}; 