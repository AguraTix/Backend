const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const { uploadFoodImage, handleUploadError } = require('../middleware/foodImageUpload');
const isAdmin = require('../middleware/isAdmin');

/**
 * @swagger
 * components:
 *   schemas:
 *     Food:
 *       type: object
 *       properties:
 *         food_id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the food item
 *           example: 123e4567-e89b-12d3-a456-426614174000
 *         foodname:
 *           type: string
 *           description: Name of the food item
 *           example: Chicken Burger
 *         foodimage:
 *           type: string
 *           description: URL of the food item image
 *           example: /uploads/b70307c9106f944af4c11f32033e1704.jpg
 *         quantity:
 *           type: integer
 *           description: Available quantity of the food item
 *           example: 50
 *         foodprice:
 *           type: number
 *           description: Price of the food item
 *           example: 12.5
 *         fooddescription:
 *           type: string
 *           description: Description of the food item
 *           example: Delicious grilled chicken burger
 *         admin_id:
 *           type: string
 *           format: uuid
 *           description: ID of the admin who created the food item
 *           example: 987e6543-e21b-12d3-a456-426614174000
 *         createdat:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           example: 2025-08-07T19:28:00Z
 *         updatedat:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: 2025-08-07T19:28:00Z
 *       required:
 *         - foodname
 *         - quantity
 *         - foodprice
 *         - admin_id
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
 *             properties:
 *               foodname:
 *                 type: string
 *                 description: Name of the food item
 *                 example: Chicken Burger
 *               quantity:
 *                 type: integer
 *                 description: Available quantity
 *                 example: 50
 *               foodprice:
 *                 type: number
 *                 description: Price of the food item
 *                 example: 12.5
 *               fooddescription:
 *                 type: string
 *                 description: Description of the food item
 *                 example: Delicious grilled chicken burger
 *               foodimage:
 *                 type: string
 *                 format: binary
 *                 description: Food item image (max 2MB)
 *               admin_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the admin creating the food item
 *                 example: 987e6543-e21b-12d3-a456-426614174000
 *             required:
 *               - foodname
 *               - quantity
 *               - foodprice
 *               - admin_id
 *     responses:
 *       201:
 *         description: Food item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Food item created
 *                 food:
 *                   $ref: '#/components/schemas/Food'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Valid food name is required
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', isAdmin, uploadFoodImage, handleUploadError, foodController.createFood);

/**
 * @swagger
 * /api/foods:
 *   get:
 *     summary: Get all food items
 *     tags: [Foods]
 *     responses:
 *       200:
 *         description: List of food items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 foods:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Food'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to fetch food items
 */
router.get('/', foodController.getAllFoods);

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
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The food item ID
 *     responses:
 *       200:
 *         description: Food item found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Food'
 *       404:
 *         description: Food item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Food item not found
 *       500:
 *         description: Server error
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
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The food item ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               foodname:
 *                 type: string
 *                 description: Name of the food item
 *                 example: Chicken Burger
 *               quantity:
 *                 type: integer
 *                 description: Available quantity
 *                 example: 50
 *               foodprice:
 *                 type: number
 *                 description: Price of the food item
 *                 example: 12.5
 *               fooddescription:
 *                 type: string
 *                 description: Description of the food item
 *                 example: Delicious grilled chicken burger
 *               foodimage:
 *                 type: string
 *                 format: binary
 *                 description: Food item image (optional, max 2MB)
 *               admin_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the admin updating the food item
 *                 example: 987e6543-e21b-12d3-a456-426614174000
 *             required:
 *               - foodname
 *               - quantity
 *               - foodprice
 *               - admin_id
 *     responses:
 *       200:
 *         description: Food item updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Food'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Valid food name is required
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: Food item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Food item not found
 *       500:
 *         description: Server error
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
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The food item ID
 *     responses:
 *       200:
 *         description: Food item deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Food item deleted
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid food ID
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: Food item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Food item not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', isAdmin, foodController.deleteFood);

module.exports = router;