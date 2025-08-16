const express = require('express');
const router = express.Router();
const foodOrderController = require('../controllers/foodOrderController');
const isAdmin  = require('../middleware/isAdmin');
const authenticate = require('../middleware/authenticate');

/**
 * @swagger
 * tags:
 *   name: Food Orders
 *   description: Food order management
 */

// Get available order statuses (for dropdown)
/**
 * @swagger
 * /api/food-orders/statuses:
 *   get:
 *     summary: Get all available order statuses
 *     tags: [Food Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available statuses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OrderStatus'
 */
router.get('/statuses', authenticate, foodOrderController.getOrderStatuses);

// Create a new food order
/**
 * @swagger
 * /api/food-orders:
 *   post:
 *     summary: Create a new food order
 *     tags: [Food Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - food_id
 *               - event_id
 *               - quantity
 *             properties:
 *               food_id:
 *                 type: integer
 *               event_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               special_instructions:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FoodOrder'
 */
router.post('/', authenticate, foodOrderController.createOrder);

// Get order by ID
/**
 * @swagger
 * /api/food-orders/{orderId}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Food Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the order to get
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FoodOrder'
 */
router.get('/:orderId', authenticate, foodOrderController.getOrderById);

// Get orders by status with filtering
/**
 * @swagger
 * /api/food-orders/status/{status}:
 *   get:
 *     summary: Get orders by status
 *     tags: [Food Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/OrderStatus'
 *         description: Status to filter orders by
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of orders with the specified status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FoodOrder'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalOrders:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 */
router.get('/status/:status', authenticate, foodOrderController.getOrdersByStatus);

// Update order status
/**
 * @swagger
 * /api/food-orders/{orderId}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Food Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the order to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StatusUpdate'
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FoodOrder'
 */
router.patch('/:orderId/status', authenticate, foodOrderController.updateOrderStatus);

// Cancel order
/**
 * @swagger
 * /api/food-orders/{orderId}/cancel:
 *   post:
 *     summary: Cancel an order
 *     tags: [Food Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the order to cancel
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FoodOrder'
 */
router.post('/:orderId/cancel', authenticate, foodOrderController.cancelOrder);

// Get orders by event ID (Admin only)
/**
 * @swagger
 * /api/food-orders/event/{eventId}:
 *   get:
 *     summary: Get all orders for an event (Admin only)
 *     tags: [Food Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the event
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/OrderStatus'
 *         description: Filter orders by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of orders for the event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FoodOrder'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalOrders:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 */
router.get('/event/:eventId', authenticate, isAdmin, foodOrderController.getEventOrders);

module.exports = router;