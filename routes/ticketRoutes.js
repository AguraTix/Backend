/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket management endpoints for users
 */
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const isAuthenticated = require('../middleware/authenticate'); 
const isAdmin = require('../middleware/isAdmin');
const { Ticket } = require('../models');

/**
 * @swagger
 * /api/tickets/event/{eventId}:
 *   get:
 *     summary: Get available tickets for an event
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The event ID
 *     responses:
 *       200:
 *         description: Available tickets retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 totalAvailable: { type: integer }
 *                 ticketTypes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type: { type: string }
 *                       available: { type: integer }
 *                       minPrice: { type: number, nullable: true }
 *                       maxPrice: { type: number, nullable: true }
 *       404: { description: Event not found }
 *       500: { description: Internal server error }
 */
router.get('/event/:eventId', ticketController.getAvailableTickets);

/**
 * @swagger
 * /api/tickets/availability/summary:
 *   get:
 *     summary: Get total available tickets per event
 *     tags: [Tickets]
 *     responses:
 *       200:
 *         description: Events ticket availability
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       event:
 *                         type: object
 *                         properties:
 *                           event_id: { type: string }
 *                           title: { type: string }
 *                           date: { type: string, format: date-time }
 *                           venue:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               venue_id: { type: string }
 *                               name: { type: string }
 *                               location: { type: string }
 *                               hasSections: { type: boolean }
 *                       totalAvailable: { type: integer }
 *                       ticketTypes:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             type: { type: string }
 *                             available: { type: integer }
 *                             minPrice: { type: number, nullable: true }
 *                             maxPrice: { type: number, nullable: true }
 *       500: { description: Internal server error }
 */
router.get('/availability/summary', ticketController.getAvailabilitySummary);

/**
 * @swagger
 * /api/tickets/{ticketId}/book:
 *   post:
 *     summary: Book a ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ticket ID to book
 *     responses:
 *       200:
 *         description: Ticket booked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 ticket:
 *                   type: object
 *                   properties:
 *                     ticket_id: { type: string }
 *                     eventId: { type: string }
 *                     venueId: { type: string }
 *                     sectionName: { type: string }
 *                     seatNumber: { type: string }
 *                     price: { type: number }
 *                     status: { type: string }
 *                     qrCodeUrl: { type: string }
 *       400: { description: Ticket not available }
 *       401: { description: Unauthorized }
 *       404: { description: Ticket not found }
 *       500: { description: Internal server error }
 */
router.post('/:ticketId/book', isAuthenticated, ticketController.bookTicket);

/**
 * @swagger
 * /api/tickets/event/{eventId}/purchase:
 *   post:
 *     summary: Purchase a ticket for an event by ticket type
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The event ID to purchase a ticket for
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ticketType:
 *                 type: string
 *                 description: Section or type of ticket (defaults to General Admission)
 *     responses:
 *       200:
 *         description: Ticket purchased successfully
 *       400: { description: Invalid request }
 *       401: { description: Unauthorized }
 *       404: { description: Event or tickets not found }
 *       500: { description: Internal server error }
 */
router.post('/event/:eventId/purchase', isAuthenticated, ticketController.purchaseTicket);

/**
 * @swagger
 * /api/tickets/my:
 *   get:
 *     summary: Get my booked tickets
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: My tickets retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 tickets:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticket_id: { type: string }
 *                       eventId: { type: string }
 *                       venueId: { type: string }
 *                       sectionName: { type: string }
 *                       seatNumber: { type: string }
 *                       price: { type: number }
 *                       status: { type: string }
 *                       qrCodeUrl: { type: string }
 *                       Event: { type: object }
 *                       Venue: { type: object }
 *       401: { description: Unauthorized }
 *       500: { description: Internal server error }
 */
router.get('/my', isAuthenticated, ticketController.getMyTickets);

/**
 * @swagger
 * /api/tickets/{ticketId}/cancel:
 *   post:
 *     summary: Cancel a booked ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ticket ID to cancel
 *     responses:
 *       200: { description: Ticket cancelled successfully }
 *       400: { description: Ticket cannot be cancelled }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Ticket not found }
 *       500: { description: Internal server error }
 */
router.post('/:ticketId/cancel', isAuthenticated, ticketController.cancelTicket);

/**
 * @swagger
 * /api/tickets/admin/booked:
 *   get:
 *     summary: Get all purchased tickets (admin only)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Tickets with status booked
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Booked tickets retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admins only
 *       500:
 *         description: Internal server error
 */
router.get('/admin/booked', isAdmin, ticketController.getAllBookedTickets);

/**
 * @swagger
 * /api/tickets/{ticketId}/qrcode:
 *   get:
 *     summary: Get QR code for a ticket
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ticket ID
 *     responses:
 *       200: { description: QR code image }
 *       404: { description: Ticket not found or QR not available }
 *       500: { description: Failed to serve QR code }
 */
router.get('/:ticketId/qrcode', async (req, res) => {
    try {
        const { ticketId } = req.params;
        
        const ticket = await Ticket.findByPk(ticketId, {
            attributes: ['ticket_id', 'qrCode', 'status']
        });

        if (!ticket || !ticket.qrCode) {
            return res.status(404).json({ error: 'QR code not available' });
        }

        const base64Data = ticket.qrCode.split(';base64,').pop();
        const img = Buffer.from(base64Data, 'base64');

        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': img.length
        });
        
        res.end(img);
    } catch (error) {
        console.error('Error serving QR code:', error);
        res.status(500).json({ error: 'Failed to serve QR code' });
    }
});

module.exports = router;