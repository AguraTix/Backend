/**
 * @swagger
 * tags:
 *   name: Venues
 *   description: Venue management endpoints
 */
const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venueController');
const isAdmin = require('../middleware/isAdmin');

/**
 * @swagger
 * /api/venues:
 *   post:
 *     summary: Create a new venue
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               location: { type: string }
 *               map_data: { type: object }
 *               capacity: { type: integer }
 *     responses:
 *       201: { description: Venue created }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 */
router.post('/', isAdmin, venueController.createVenue);

/**
 * @swagger
 * /api/venues:
 *   get:
 *     summary: Get all venues
 *     tags: [Venues]
 *     responses:
 *       200: { description: List of venues }
 */
router.get('/', venueController.getAllVenues);

/**
 * @swagger
 * /api/venues/{venueId}:
 *   get:
 *     summary: Get a venue by ID
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *         description: The venue ID
 *     responses:
 *       200: { description: Venue found }
 *       404: { description: Venue not found }
 */
router.get('/:venueId', venueController.getVenueById);

/**
 * @swagger
 * /api/venues/{venueId}:
 *   put:
 *     summary: Update a venue
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *         description: The venue ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               location: { type: string }
 *               map_data: { type: object }
 *               capacity: { type: integer }
 *     responses:
 *       200: { description: Venue updated }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       404: { description: Venue not found }
 */
router.put('/:venueId', isAdmin, venueController.updateVenue);

/**
 * @swagger
 * /api/venues/{venueId}:
 *   delete:
 *     summary: Delete a venue
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *         description: The venue ID
 *     responses:
 *       200: { description: Venue deleted }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       404: { description: Venue not found }
 */
router.delete('/:venueId', isAdmin, venueController.deleteVenue);

module.exports = router; 