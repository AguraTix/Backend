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
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Event title
 *                 example: Summer Music Festival
 *               description:
 *                 type: string
 *                 description: Event description
 *                 example: Amazing outdoor music festival
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Event date and time
 *                 example: 2025-08-06T21:00:00.000Z
 *               venue_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the venue
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               artist_lineup:
 *                 type: string
 *                 description: JSON string or comma-separated list of artists
 *                 example: '["Artist 1", "Artist 2"]'
 *               tickets:
 *                 type: string
 *                 description: |
 *                   JSON string of ticket array, e.g.:
 *                   [
 *                     {"type": "Regular", "price": 50, "quantity": 100},
 *                     {"type": "VIP", "price": 100, "quantity": 50},
 *                     {"type": "VVIP", "price": 150, "quantity": 25}
 *                   ]
 *                 example: '[{"type": "Regular", "price": 50, "quantity": 100}, {"type": "VIP", "price": 100, "quantity": 50}, {"type": "VVIP", "price": 150, "quantity": 25}]'
 *               event_image:
 *                 type: string
 *                 format: binary
 *                 description: Main event image (max 2MB)
 *               event_images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Additional event images (max 20, each 2MB)
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 event:
 *                   type: object
 *                   properties:
 *                     event_id: { type: string, format: uuid }
 *                     title: { type: string }
 *                     description: { type: string }
 *                     date: { type: string, format: date-time }
 *                     venue_id: { type: string, format: uuid }
 *                     artist_lineup: { type: array, items: { type: string } }
 *                     event_images:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           filename: { type: string }
 *                           mimetype: { type: string }
 *                           size: { type: integer }
 *                     image_count: { type: integer }
 *                     image_url: { type: string }
 *                     tickets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type: { type: string, enum: ['Regular', 'VIP', 'VVIP'] }
 *                           price: { type: number }
 *                           quantity: { type: integer }
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
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
 * /api/events/recent:
 *   get:
 *     summary: Get recent events with pagination and filtering
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Number of events to return (max 50)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of events to skip for pagination
 *       - in: query
 *         name: upcomingOnly
 *         schema:
 *           type: boolean
 *           default: true
 *         description: If true, only return upcoming events (date >= current date)
 *     responses:
 *       200:
 *         description: Recent events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       event_id: { type: string, format: uuid }
 *                       title: { type: string }
 *                       description: { type: string }
 *                       date: { type: string, format: date-time }
 *                       venue_id: { type: string, format: uuid }
 *                       artist_lineup: { type: array, items: { type: string } }
 *                       image_url: { type: string }
 *                       tickets: { type: array }
 *                       User: { type: object }
 *                       Venue: { type: object }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total: { type: integer }
 *                     limit: { type: integer }
 *                     offset: { type: integer }
 *                     hasMore: { type: boolean }
 *       500:
 *         description: Internal server error
 */
router.get('/recent', eventController.getRecentEvents);

/**
 * @swagger
 * /api/events/upcoming:
 *   get:
 *     summary: Get upcoming events (events with date >= current date)
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Number of events to return (max 50)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of events to skip for pagination
 *     responses:
 *       200:
 *         description: Upcoming events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       event_id: { type: string, format: uuid }
 *                       title: { type: string }
 *                       description: { type: string }
 *                       date: { type: string, format: date-time }
 *                       venue_id: { type: string, format: uuid }
 *                       artist_lineup: { type: array, items: { type: string } }
 *                       image_url: { type: string }
 *                       tickets: { type: array }
 *                       User: { type: object }
 *                       Venue: { type: object }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total: { type: integer }
 *                     limit: { type: integer }
 *                     offset: { type: integer }
 *                     hasMore: { type: boolean }
 *       500:
 *         description: Internal server error
 */
router.get('/upcoming', eventController.getRecentEvents);

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