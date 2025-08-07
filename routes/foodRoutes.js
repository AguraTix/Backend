const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController.js');
const { uploadCombined, handleUploadError } = require('../middleware/imageUpload');
const isAdmin = require('../middleware/isAdmin.js');

/**
 * @swagger
 * /api/foods:
 *   post:
 *     summary: Create a new food item
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               FoodName:
 *                 type: string
 *                 description: Name of the food item
 *                 example: Chicken Burger
 *               Quantity:
 *                 type: integer
 *                 description: Available quantity
 *                 example: 50
 *               FoodPrice:
 *                 type: number
 *                 description: Price of the food item
 *                 example: 12.50
 *               FoodDescription:
 *                 type: string
 *                 description: Description of the food item
 *                 example: Delicious grilled chicken burger
 *               food_image:
 *                 type: string
 *                 format: binary
 *                 description: Food image (max 2MB)
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
 *                 food:
 *                   type: object
 *                   properties:
 *                     food_id: { type: string, format: uuid }
 *                     FoodName: { type: string }
 *                     FoodImage: { type: string }
 *                     Quantity: { type: integer }
 *                     FoodPrice: { type: number }
 *                     FoodDescription: { type: string }
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get all food items
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
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
 *                     type: object
 *                     properties:
 *                       food_id: { type: string, format: uuid }
 *                       FoodName: { type: string }
 *                       FoodImage: { type: string }
 *                       Quantity: { type: integer }
 *                       FoodPrice: { type: number }
 *                       FoodDescription: { type: string }
 *       500:
 *         description: Internal server error
 * /api/foods/{id}:
 *   get:
 *     summary: Get a food item by ID
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Food item details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 food:
 *                   type: object
 *                   properties:
 *                     food_id: { type: string, format: uuid }
 *                     FoodName: { type: string }
 *                     FoodImage: { type: string }
 *                     Quantity: { type: integer }
 *                     FoodPrice: { type: number }
 *                     FoodDescription: { type: string }
 *       404:
 *         description: Food item not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update a food item
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               FoodName:
 *                 type: string
 *                 description: Name of the food item
 *                 example: Chicken Burger
 *               Quantity:
 *                 type: integer
 *                 description: Available quantity
 *                 example: 50
 *               FoodPrice:
 *                 type: number
 *                 description: Price of the food item
 *                 example: 12.50
 *               FoodDescription:
 *                 type: string
 *                 description: Description of the food item
 *                 example: Delicious grilled chicken burger
 *               food_image:
 *                 type: string
 *                 format: binary
 *                 description: New food image (max 2MB)
 *     responses:
 *       200:
 *         description: Food item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 food:
 *                   type: object
 *                   properties:
 *                     food_id: { type: string, format: uuid }
 *                     FoodName: { type: string }
 *                     FoodImage: { type: string }
 *                     Quantity: { type: integer }
 *                     FoodPrice: { type: number }
 *                     FoodDescription: { type: string }
 *       404:
 *         description: Food item not found
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete a food item
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Food item deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Food item not found
 *       401:
 *         description: Unauthorized
 */

router.post('/', isAdmin, uploadCombined, handleUploadError, foodController.createFood);
router.get('/', isAdmin, foodController.getAllFoods);
router.get('/:id', isAdmin, foodController.getFoodById);
router.put('/:id', isAdmin, uploadCombined, handleUploadError, foodController.updateFood);
router.delete('/:id', isAdmin, foodController.deleteFood);

module.exports = router;