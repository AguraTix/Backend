/**
 * @swagger
 * tags:
 *   name: TicketCategories
 *   description: Ticket category management endpoints
 */
const express = require('express');
const router = express.Router();
const ticketCategoryController = require('../controllers/ticketCategoryController');
const isAdmin = require('../middleware/isAdmin');

/**
 * @swagger
 * /api/ticket-categories:
 *   post:
 *     summary: Create a new ticket category
 *     tags: [TicketCategories]
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
 *               price: { type: integer }
 *               event_id: { type: string }
 *               section_id: { type: string }
 *     responses:
 *       201: { description: Ticket category created }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 */
router.post('/', isAdmin, ticketCategoryController.createTicketCategory);

/**
 * @swagger
 * /api/ticket-categories/event/{eventId}:
 *   get:
 *     summary: Get ticket categories by event
 *     tags: [TicketCategories]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The event ID
 *     responses:
 *       200: { description: List of ticket categories for the event }
 *       404: { description: Event not found }
 */
router.get('/event/:eventId', ticketCategoryController.getTicketCategoriesByEvent);

/**
 * @swagger
 * /api/ticket-categories/{categoryId}:
 *   get:
 *     summary: Get a ticket category by ID
 *     tags: [TicketCategories]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ticket category ID
 *     responses:
 *       200: { description: Ticket category found }
 *       404: { description: Ticket category not found }
 */
router.get('/:categoryId', ticketCategoryController.getTicketCategoryById);

/**
 * @swagger
 * /api/ticket-categories/{categoryId}:
 *   put:
 *     summary: Update a ticket category
 *     tags: [TicketCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ticket category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               price: { type: integer }
 *               section_id: { type: string }
 *     responses:
 *       200: { description: Ticket category updated }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       404: { description: Ticket category not found }
 */
router.put('/:categoryId', isAdmin, ticketCategoryController.updateTicketCategory);

/**
 * @swagger
 * /api/ticket-categories/{categoryId}:
 *   delete:
 *     summary: Delete a ticket category
 *     tags: [TicketCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ticket category ID
 *     responses:
 *       200: { description: Ticket category deleted }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       404: { description: Ticket category not found }
 */
router.delete('/:categoryId', isAdmin, ticketCategoryController.deleteTicketCategory);

module.exports = router; 