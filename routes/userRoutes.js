/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */
const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();

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
 *               role: { type: string, enum: ['Attendee', 'Admin'] }
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

module.exports = router;