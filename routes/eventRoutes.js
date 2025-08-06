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
const { uploadCombined, handleUploadError } = require('../middleware/imageUpload');

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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, description, date, venue_id]
 *             properties:
 *               title: { type: string, example: "Summer Music Festival" }
 *               description: { type: string, example: "Amazing outdoor music festival" }
 *               date: { type: string, format: date-time, example: "2025-08-06T17:45:26.461Z" }
 *               venue_id: { type: string, example: "123e4567-e89b-12d3-a456-426614174000" }
 *               artist_lineup: { type: string, description: "JSON string or comma-separated values", example: "[\"Artist 1\", \"Artist 2\"]" }
 *               event_image: { type: string, format: binary, description: "Main event image (optional, max 5MB)" }
 *               event_images: { type: array, items: { type: string, format: binary }, description: "Additional event images (optional, max 20 files, 5MB each)" }
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 event:
 *                   type: object
 *                   properties:
 *                     event_id: { type: string }
 *                     title: { type: string }
 *                     description: { type: string }
 *                     date: { type: string }
 *                     venue_id: { type: string }
 *                     artist_lineup: { type: array }
 *                     event_images: { type: array, description: "Image metadata (filename, mimetype, size)" }
 *                     image_count: { type: number }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 */
router.post('/', isAdmin, uploadCombined, handleUploadError, eventController.createEvent);

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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               date: { type: string, format: date-time }
 *               venue_id: { type: string }
 *               artist_lineup: { type: string, description: "JSON string or comma-separated values" }
 *               event_image: { type: string, format: binary, description: "Main event image (optional, max 5MB)" }
 *               event_images: { type: array, items: { type: string, format: binary }, description: "Additional event images (optional, max 20 files, 5MB each)" }
 *     responses:
 *       200: { description: Event updated }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       404: { description: Event not found }
 */
router.put('/:eventId', isAdmin, uploadCombined, handleUploadError, eventController.updateEvent);

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

/**
 * @swagger
 * /api/events/{eventId}/images:
 *   get:
 *     summary: Get event images
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event images retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 event_id: { type: string }
 *                 event_images: { type: array, description: "Array of image objects with base64 data" }
 *                 image_count: { type: number }
 *       404: { description: Event not found }
 *       400: { description: Bad request }
 */
router.get('/:eventId/images', eventController.getEventImages);

module.exports = router;