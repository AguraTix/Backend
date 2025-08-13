const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const { uploadFoodImage, handleUploadError } = require('../middleware/foodImageUpload');
const isAdmin = require('../middleware/isAdmin');

/**
 * @swagger
 * tags:
 *   name: Foods
 *   description: Food management endpoints
 */

/**
 * @swagger
 * /api/foods:
 *   post:
 *     summary: Create a new food item
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - foodname
 *               - quantity
 *               - foodprice
 *               - event_id
 *             properties:
 *               foodname: { type: string, example: Chicken Burger }
 *               quantity: { type: integer, example: 50 }
 *               foodprice: { type: number, example: 12.5 }
 *               fooddescription: { type: string, example: Delicious grilled chicken burger }
 *               event_id: { type: string, format: uuid, description: Event ID to link food to (required) }
 *               foodimage: { type: string, format: binary }
 *     responses:
 *       201: { description: Food item created successfully }
 *       400: { description: Invalid input }
 *       401: { description: Unauthorized }
 */
router.post('/', isAdmin, uploadFoodImage, handleUploadError, foodController.createFood);

/**
 * @swagger
 * /api/foods:
 *   get:
 *     summary: Get all food items
 *     tags: [Foods]
 *     responses:
 *       200: { description: List of food items }
 */
router.get('/', foodController.getAllFoods);

/**
 * @swagger
 * /api/foods/event/{eventId}:
 *   get:
 *     summary: Get food items for a specific event (menu items)
 *     tags: [Foods]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: The event ID to get foods for
 *     responses:
 *       200: 
 *         description: Food items for the event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 foods: { type: array, items: { type: object } }
 *                 eventId: { type: string }
 *                 count: { type: integer }
 *       500: { description: Internal server error }
 */
router.get('/event/:eventId', foodController.getFoodsByEvent);

/**
 * @swagger
 * /api/foods/general:
 *   get:
 *     summary: Get foods that are not assigned to any specific event (general menu)
 *     tags: [Foods]
 *     responses:
 *       200: 
 *         description: General foods retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 foods: { type: array, items: { type: object } }
 *                 count: { type: integer }
 *       500: { description: Internal server error }
 */
router.get('/general', foodController.getGeneralFoods);

/**
 * @swagger
 * /api/foods/{id}:
 *   get:
 *     summary: Get a food item by ID
 *     tags: [Foods]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Food item found }
 *       404: { description: Food item not found }
 */
router.get('/:id', foodController.getFoodById);

/**
 * @swagger
 * /api/foods/{id}:
 *   put:
 *     summary: Update a food item
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - foodname
 *               - quantity
 *               - foodprice
 *               - event_id
 *             properties:
 *               foodname: { type: string, example: Chicken Burger }
 *               quantity: { type: integer, example: 50 }
 *               foodprice: { type: number, example: 12.5 }
 *               fooddescription: { type: string }
 *               event_id: { type: string, format: uuid, description: Event ID to link food to (required) }
 *               foodimage: { type: string, format: binary }
 *     responses:
 *       200: { description: Food item updated }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       404: { description: Food item not found }
 */
router.put('/:id', isAdmin, uploadFoodImage, handleUploadError, foodController.updateFood);

/**
 * @swagger
 * /api/foods/{id}:
 *   delete:
 *     summary: Delete a food item
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Food item deleted }
 *       400: { description: Bad request }
 *       401: { description: Unauthorized }
 *       404: { description: Food item not found }
 */
router.delete('/:id', isAdmin, foodController.deleteFood);

module.exports = router;