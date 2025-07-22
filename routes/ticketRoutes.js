/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket management endpoints
 */
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authenticate = require('../middleware/authenticate');

/**
 * @swagger
 * /api/tickets/purchase:
 *   post:
 *     summary: Purchase tickets
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId: { type: string }
 *               seatIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201: { description: Tickets purchased successfully }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 */
router.post('/purchase', authenticate, ticketController.purchaseTickets);

/**
 * @swagger
 * /api/tickets/my-tickets:
 *   get:
 *     summary: Get user's tickets
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: User's tickets retrieved }
 *       401: { description: Unauthorized }
 */
router.get('/my-tickets', authenticate, ticketController.getUserTickets);

/**
 * @swagger
 * /api/tickets/{ticketId}:
 *   get:
 *     summary: Get ticket by ID
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ticket ID
 *     responses:
 *       200: { description: Ticket found }
 *       401: { description: Unauthorized }
 *       404: { description: Ticket not found }
 */
router.get('/:ticketId', authenticate, ticketController.getTicketById);

/**
 * @swagger
 * /api/tickets/validate/{qrCode}:
 *   get:
 *     summary: Validate ticket by QR code
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: qrCode
 *         required: true
 *         schema:
 *           type: string
 *         description: The ticket QR code
 *     responses:
 *       200: { description: Ticket is valid }
 *       400: { description: Invalid ticket }
 */
router.get('/validate/:qrCode', ticketController.validateTicket);

/**
 * @swagger
 * /api/tickets/{ticketId}/use:
 *   put:
 *     summary: Mark ticket as used
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ticket ID
 *     responses:
 *       200: { description: Ticket marked as used }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       404: { description: Ticket not found }
 */
router.put('/:ticketId/use', authenticate, ticketController.useTicket);

/**
 * @swagger
 * /api/tickets/{ticketId}/refund:
 *   put:
 *     summary: Refund ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ticket ID
 *     responses:
 *       200: { description: Ticket refunded successfully }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       404: { description: Ticket not found }
 */
router.put('/:ticketId/refund', authenticate, ticketController.refundTicket);

/**
 * @swagger
 * /api/ticket-categories/{categoryId}/available-seats:
 *   get:
 *     summary: Get available seats for a ticket category
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ticket category ID
 *     responses:
 *       200: { description: Available seats for the category }
 *       404: { description: Ticket category not found }
 */
router.get('/categories/:categoryId/available-seats', ticketController.getAvailableSeatsForCategory);

module.exports = router; 