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

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
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
 * /api/users/login:
 *   post:
 *     summary: User Login
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
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */
router.post('/login', userController.login);

/**
 * @swagger
 * /api/users/{id}/role:
 *   put:
 *     summary: Update a user's role
 *     tags: [Users]
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
 *                 enum: [Admin, Attendee]
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

module.exports = router;