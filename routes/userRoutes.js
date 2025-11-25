/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */
const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin');
const isSuperAdmin = require('../middleware/isSuperAdmin');
const authenticate = require('../middleware/authenticate');

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user(mobile app)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               name: { type: string }
 *               phone_number: { type: string }
 *             
 *     responses:
 *       201: { description: User created }
 *       400: { description: Bad request }
 */
router.post('/register', userController.register);

/**
 * @swagger
 * /api/users/email/verify/send:
 *   post:
 *     summary: Request a verification code
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200: { description: Verification email sent }
 *       400: { description: Bad request }
 */
router.post('/email/verify/send', userController.sendEmailVerification);

/**
 * @swagger
 * /api/users/email/verify/confirm:
 *   post:
 *     summary: Verify an email address with a code
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               code: { type: string }
 *     responses:
 *       200: { description: Email verified }
 *       400: { description: Bad request }
 */
router.post('/email/verify/confirm', userController.verifyEmail);

/**
 * @swagger
 * /api/users/email/verify/resend:
 *   post:
 *     summary: Resend a verification code
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200: { description: Verification email resent }
 *       400: { description: Bad request }
 */
router.post('/email/verify/resend', userController.resendVerificationEmail);


/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: User,admins and super Admins Login (Phone Number or Email)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier: 
 *                 type: string
 *                 description: Phone number or email address
 *               password: { type: string }
 *     responses:
 *       200: 
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 token: { type: string }
 *                 user: 
 *                   type: object
 *                   properties:
 *                     user_id: { type: string }
 *                     email: { type: string }
 *                     name: { type: string }
 *                     role: { type: string }
 *       401: { description: Invalid credentials }
 */
router.post('/login', userController.login);

/**
 * @swagger
 * /api/users/superadmin/create-admin:
 *   post:
 *     summary: SuperAdmin creates a new Admin account
 *     description: SuperAdmin creates an admin account and sends login credentials via email
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - expires_at
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@example.com"
 *               name:
 *                 type: string
 *                 example: "John Admin"
 *               phone_number:
 *                 type: string
 *                 example: "+1234567890"
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-12-31T23:59:59Z"
 *     responses:
 *       201:
 *         description: Admin account created and email sent
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (SuperAdmin only)
 */
router.post('/superadmin/create-admin', isSuperAdmin, userController.createAdminBySuperAdmin);

/**
 * @swagger
 * /api/users/superadmin/my-admins:
 *   get:
 *     summary: Get all admins created by this SuperAdmin
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of admins
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (SuperAdmin only)
 */
router.get('/superadmin/my-admins', isSuperAdmin, userController.getMyAdmins);

/**
 * @swagger
 * /api/users/superadmin/all-admins:
 *   get:
 *     summary: Get all admins in the system
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all admins
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (SuperAdmin only)
 */
router.get('/superadmin/all-admins', isSuperAdmin, userController.getAllAdmins);

/**
 * @swagger
 * /api/users/superadmin/admins/{id}:
 *   put:
 *     summary: Update an admin created by the SuperAdmin
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               name: { type: string }
 *               phone_number: { type: string }
 *               new_password: { type: string }
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200: { description: Admin updated }
 *       400: { description: Invalid input }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (SuperAdmin only) }
 *       404: { description: Admin not found }
 */
router.put('/superadmin/admins/:id', isSuperAdmin, userController.updateAdminBySuperAdmin);

/**
 * @swagger
 * /api/users/{id}/role:
 *   put:
 *     summary: Update a user's role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [Admin, Attendee, SuperAdmin]
 *                 example: Admin
 *     responses:
 *       200:
 *         description: User role updated
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admins only)
 */
router.put('/:id/role', isAdmin, userController.updateUserRole);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update the authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               name: { type: string }
 *               phone_number: { type: string }
 *               new_password: { type: string }
 *     responses:
 *       200: { description: Profile updated }
 *       400: { description: Invalid input }
 *       401: { description: Unauthorized }
 */
router.put('/me', authenticate, userController.updateOwnProfile);

/**
 * @swagger
 * /api/users/superadmin/profile:
 *   put:
 *     summary: Update the SuperAdmin's own profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               name: { type: string }
 *               phone_number: { type: string }
 *               new_password: { type: string }
 *     responses:
 *       200: { description: Profile updated }
 *       400: { description: Invalid input }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (SuperAdmin only) }
 */
router.put('/superadmin/profile', isSuperAdmin, userController.updateSuperAdminProfile);

module.exports = router;