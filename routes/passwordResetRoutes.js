/**
 * @swagger
 * tags:
 *   name: Password Reset
 *   description: Password reset functionality
 */
const express = require('express');
const passwordResetController = require('../controllers/passwordResetController');
const router = express.Router();

/**
 * @swagger
 * /api/password-reset/request:
 *   post:
 *     summary: Request password reset
 *     tags: [Password Reset]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email or phone number
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Reset code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 email: { type: string }
 *       400:
 *         description: Bad request
 */
router.post('/request', passwordResetController.requestPasswordReset);

/**
 * @swagger
 * /api/password-reset/verify:
 *   post:
 *     summary: Verify reset code
 *     tags: [Password Reset]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email or phone number
 *                 example: "user@example.com"
 *               verification_code:
 *                 type: string
 *                 description: 6-digit verification code
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Code verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user_id: { type: string }
 *       400:
 *         description: Invalid or expired code
 */
router.post('/verify', passwordResetController.verifyResetCode);

/**
 * @swagger
 * /api/password-reset/reset:
 *   post:
 *     summary: Reset password with verification code
 *     tags: [Password Reset]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email or phone number
 *                 example: "user@example.com"
 *               verification_code:
 *                 type: string
 *                 description: 6-digit verification code
 *                 example: "123456"
 *               new_password:
 *                 type: string
 *                 description: New password (min 8 chars, must contain letter, number, and special char)
 *                 example: "NewPass123!"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       400:
 *         description: Invalid input or expired code
 */
router.post('/reset', passwordResetController.resetPassword);

module.exports = router; 