const FoodOrderService = require('../services/foodOrderService');
const { validationResult } = require('express-validator');
const models = require('../models');
const { Food } = models;

// Create a new food order
exports.createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { food_id, quantity, special_instructions } = req.body;
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    if (!food_id) {
      return res.status(400).json({ error: 'Food ID is required' });
    }

    // Derive event_id from the food item so client doesn't need to send it
    const food = await Food.findByPk(food_id);
    if (!food) {
      return res.status(404).json({ error: 'Food item not found' });
    }

    const order = await FoodOrderService.createOrder({
      food_id,
      event_id: food.event_id,
      quantity,
      special_instructions
    }, userId);

    res.status(201).json({
      message: 'Food order created successfully',
      order
    });
  } catch (error) {
    console.error('Error creating food order:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get all orders for the authenticated user
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    const orders = await FoodOrderService.getUserOrders(userId);

    res.status(200).json({
      message: 'User orders retrieved successfully',
      orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get user order history with pagination
exports.getUserOrderHistory = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    const result = await FoodOrderService.getUserOrderHistory(userId, page, limit);

    res.status(200).json({
      message: 'User order history retrieved successfully',
      ...result
    });
  } catch (error) {
    console.error('Error fetching user order history:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all orders for an event (admin only)
exports.getEventOrders = async (req, res) => {
  try {
    const { eventId } = req.params;
    const adminId = req.user?.user_id;
    const { status } = req.query;

    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized: Admin access required' });
    }

    const result = await FoodOrderService.getEventOrders(
      eventId,
      status,
      parseInt(req.query.page) || 1,
      parseInt(req.query.limit) || 10
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching event orders:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.user_id;
    const isAdmin = req.user?.role === 'Admin';

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    const order = await FoodOrderService.getOrderById(orderId, userId, isAdmin);

    res.status(200).json({
      message: 'Order retrieved successfully',
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(400).json({ error: error.message });
  }
};

// Update order status (admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { newStatus } = req.body;
    const adminId = req.user?.user_id;

    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized: Admin access required' });
    }

    if (!newStatus) {
      return res.status(400).json({ error: 'New status is required' });
    }

    const validStatuses = ['Pending', 'Confirmed', 'Cancelled'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
    }

    const order = await FoodOrderService.updateOrderStatus(orderId, newStatus, adminId);

    res.status(200).json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(400).json({ error: error.message });
  }
};

// Cancel order (user can only cancel pending orders)
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    const order = await FoodOrderService.cancelOrder(orderId, userId);

    res.status(200).json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get order statistics for an event (admin only)
exports.getEventOrderStats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const adminId = req.user?.user_id;

    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized: Admin access required' });
    }

    const stats = await FoodOrderService.getEventOrderStats(eventId, adminId);

    res.status(200).json({
      message: 'Event order statistics retrieved successfully',
      eventId,
      ...stats
    });
  } catch (error) {
    console.error('Error fetching event order stats:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get all orders (admin only - for dashboard)
exports.getAllOrders = async (req, res) => {
  try {
    const adminId = req.user?.user_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const eventId = req.query.event_id;

    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized: Admin access required' });
    }

    const { FoodOrder, Food, Event, User } = require('../models');
    
    let whereClause = {};
    if (status) whereClause.order_status = status;
    if (eventId) whereClause.event_id = eventId;

    const { count, rows: orders } = await FoodOrder.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Food,
          as: 'Food',
          attributes: ['food_id', 'foodname', 'foodimage', 'foodprice']
        },
        {
          model: Event,
          as: 'Event',
          attributes: ['event_id', 'title', 'date']
        },
        {
          model: User,
          as: 'User',
          attributes: ['user_id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit
    });

    res.status(200).json({
      message: 'All orders retrieved successfully',
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalOrders: count,
        hasNextPage: page < Math.ceil(count / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all available order statuses (for dropdown)
exports.getOrderStatuses = async (req, res) => {
  try {
    const statuses = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      ready: 'Ready for Pickup',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    
    res.status(200).json(statuses);
  } catch (error) {
    console.error('Error getting order statuses:', error);
    res.status(500).json({ message: 'Failed to retrieve order statuses' });
  }
};

// Get orders by status with pagination
exports.getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const userId = req.user?.user_id;
    const isAdmin = req.user?.role === 'Admin';
    
    // Only pass userId if not admin (admin can see all orders)
    const result = await FoodOrderService.getOrdersByStatus(
      status,
      isAdmin ? null : userId,
      parseInt(req.query.page) || 1,
      parseInt(req.query.limit) || 10
    );

    res.status(200).json(result);
  } catch (error) {
    console.error(`Error getting ${req.params.status} orders:`, error);
    res.status(400).json({ message: error.message || 'Failed to get orders' });
  }
};
