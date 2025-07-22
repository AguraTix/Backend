/**
 * @swagger
 * tags:
 *   name: Sections
 *   description: Section management endpoints
 */
const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');
const isAdmin = require('../middleware/isAdmin');

/**
 * @swagger
 * /api/sections:
 *   post:
 *     summary: Create a new section
 *     tags: [Sections]
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
 *               description: { type: string }
 *               venue_id: { type: string }
 *               parent_section_id: { type: string }
 *               seat_map: { type: object }
 *     responses:
 *       201: { description: Section created }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 */
router.post('/', isAdmin, sectionController.createSection);

/**
 * @swagger
 * /api/sections/venue/{venueId}:
 *   get:
 *     summary: Get sections by venue
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *         description: The venue ID
 *     responses:
 *       200: { description: List of sections for the venue }
 *       404: { description: Venue not found }
 */
router.get('/venue/:venueId', sectionController.getSectionsByVenue);

/**
 * @swagger
 * /api/sections/{sectionId}:
 *   get:
 *     summary: Get a section by ID
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The section ID
 *     responses:
 *       200: { description: Section found }
 *       404: { description: Section not found }
 */
router.get('/:sectionId', sectionController.getSectionById);

/**
 * @swagger
 * /api/sections/{sectionId}:
 *   put:
 *     summary: Update a section
 *     tags: [Sections]
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
 *               name: { type: string }
 *               description: { type: string }
 *               parent_section_id: { type: string }
 *               seat_map: { type: object }
 *     responses:
 *       200: { description: Section updated }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       404: { description: Section not found }
 */
router.put('/:sectionId', isAdmin, sectionController.updateSection);

/**
 * @swagger
 * /api/sections/{sectionId}:
 *   delete:
 *     summary: Delete a section
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The section ID
 *     responses:
 *       200: { description: Section deleted }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       404: { description: Section not found }
 */
router.delete('/:sectionId', isAdmin, sectionController.deleteSection);

module.exports = router; 