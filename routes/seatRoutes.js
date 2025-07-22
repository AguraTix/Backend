/**
 * @swagger
 * tags:
 *   name: Seats
 *   description: Seat management endpoints
 */
const express = require('express');
const router = express.Router();
const seatController = require('../controllers/seatController');
const isAdmin = require('../middleware/isAdmin');
const authenticate = require('../middleware/authenticate');

/**
 * @swagger
 * /api/sections/{sectionId}/seats:
 *   post:
 *     summary: Create seats for a section
 *     tags: [Seats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The section ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startNumber: { type: integer }
 *               endNumber: { type: integer }
 *     responses:
 *       201: { description: Seats created }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 */
router.post('/:sectionId/seats', isAdmin, seatController.createSeats);

/**
 * @swagger
 * /api/sections/{sectionId}/seats/available:
 *   get:
 *     summary: Get available seats for a section
 *     tags: [Seats]
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The section ID
 *     responses:
 *       200: { description: Available seats for the section }
 *       404: { description: Section not found }
 */
router.get('/:sectionId/seats/available', seatController.getAvailableSeats);

/**
 * @swagger
 * /api/sections/{sectionId}/seats:
 *   get:
 *     summary: Get all seats for a section
 *     tags: [Seats]
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The section ID
 *     responses:
 *       200: { description: All seats for the section }
 *       404: { description: Section not found }
 */
router.get('/:sectionId/seats', seatController.getSeatsBySection);

/**
 * @swagger
 * /api/seats/{seatId}/status:
 *   put:
 *     summary: Update seat status
 *     tags: [Seats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seatId
 *         required: true
 *         schema:
 *           type: string
 *         description: The seat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Available, Unavailable, Sold Out, Selected]
 *     responses:
 *       200: { description: Seat status updated }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       404: { description: Seat not found }
 */
router.put('/:seatId/status', isAdmin, seatController.updateSeatStatus);

/**
 * @swagger
 * /api/seats/reserve:
 *   post:
 *     summary: Reserve seats
 *     tags: [Seats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seatIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200: { description: Seats reserved }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 */
router.post('/reserve', authenticate, seatController.reserveSeats);

/**
 * @swagger
 * /api/seats/release:
 *   post:
 *     summary: Release reserved seats
 *     tags: [Seats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seatIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200: { description: Seats released }
 *       400: { description: Bad request }
 */
router.post('/release', seatController.releaseSeats);

module.exports = router; 