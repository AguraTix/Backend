const passwordResetService = require('../services/passwordResetService');

// Request password reset
exports.requestPasswordReset = async (req, res) => {
    try {
        const { identifier } = req.body;
        
        if (!identifier) {
            return res.status(400).json({ error: 'Email or phone number is required' });
        }

        const result = await passwordResetService.requestPasswordReset(identifier);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Verify reset code
exports.verifyResetCode = async (req, res) => {
    try {
        const { identifier, verification_code } = req.body;
        
        if (!identifier || !verification_code) {
            return res.status(400).json({ error: 'Email/phone number and verification code are required' });
        }

        const result = await passwordResetService.verifyResetCode(identifier, verification_code);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Reset password
exports.resetPassword = async (req, res) => {
    try {
        const { identifier, verification_code, new_password } = req.body;
        
        if (!identifier || !verification_code || !new_password) {
            return res.status(400).json({ error: 'Email/phone number, verification code, and new password are required' });
        }

        const result = await passwordResetService.resetPassword(identifier, verification_code, new_password);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}; 