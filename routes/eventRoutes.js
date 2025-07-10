/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management endpoints
 */
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const isAdmin = require('../middleware/isAdmin');

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               date: { type: string, format: date-time }
 *               venue_id: { type: string }
 *               artist_lineup: { type: array, items: { type: string } }
 *     responses:
 *       201: { description: Event created }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 */
router.post('/', isAdmin, eventController.createEvent);

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     responses:
 *       200: { description: List of events }
 */
router.get('/', eventController.getAllEvents);

/**
 * @swagger
 * /api/events/{eventId}:
 *   get:
 *     summary: Get an event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The event ID
 *     responses:
 *       200: { description: Event found }
 *       404: { description: Event not found }
 */
router.get('/:eventId', eventController.getEventById);

/**
 * @swagger
 * /api/events/{eventId}:
 *   put:
 *     summary: Update an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               date: { type: string, format: date-time }
 *               venue_id: { type: string }
 *               artist_lineup: { type: array, items: { type: string } }
 *     responses:
 *       200: { description: Event updated }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       404: { description: Event not found }
 */
router.put('/:eventId', isAdmin, eventController.updateEvent);

/**
 * @swagger
 * /api/events/{eventId}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The event ID
 *     responses:
 *       200: { description: Event deleted }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       404: { description: Event not found }
 */
router.delete('/:eventId', isAdmin, eventController.deleteEvent);

/**
 * @swagger
 * /api/events/venue/{venueId}:
 *   get:
 *     summary: Get events by venue
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *         description: The venue ID
 *     responses:
 *       200: { description: List of events for the venue }
 *       404: { description: Venue not found }
 */
router.get('/venue/:venueId', eventController.getEventsByVenue);

module.exports = router; 