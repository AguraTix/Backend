// Import models lazily to avoid circular dependencies
let FoodOrder, Food, Event, User, sequelize;

// Initialize models when needed
function getModels() {
  if (!FoodOrder) {
    const models = require('../models');
    FoodOrder = models.FoodOrder;
    Food = models.Food;
    Event = models.Event;
    User = models.User;
    sequelize = models.sequelize;
  }
}

// Define order status constants
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

// Define valid status transitions
const STATUS_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.READY]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: []
};

class FoodOrderService {
  /**
   * Get all available order statuses (for dropdown)
   * @returns {Object} Status keys and display names
   */
  static getOrderStatuses() {
    return {
      [ORDER_STATUS.PENDING]: 'Pending',
      [ORDER_STATUS.CONFIRMED]: 'Confirmed',
      [ORDER_STATUS.PREPARING]: 'Preparing',
      [ORDER_STATUS.READY]: 'Ready for Pickup',
      [ORDER_STATUS.DELIVERED]: 'Delivered',
      [ORDER_STATUS.CANCELLED]: 'Cancelled'
    };
  }

  /**
   * Create a new food order
   * @param {Object} orderData - Order details
   * @param {number} userId - ID of the user placing the order
   * @returns {Promise<Object>} Created order
   */
  static async createOrder(orderData, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      getModels();
      const { food_id, event_id, quantity = 1, special_instructions } = orderData;

      // Input validation
      if (!food_id || !event_id) {
        throw new Error('Food ID and Event ID are required');
      }
      if (quantity < 1) {
        throw new Error('Quantity must be at least 1');
      }

      // Validate food exists and belongs to the event with row locking
      const food = await Food.findByPk(food_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
        include: [{
          model: Event,
          as: 'Event',
          where: { event_id },
          required: true,
          attributes: ['event_id', 'title', 'date', 'status']
        }]
      });

      if (!food) {
        throw new Error('Food item not found for this event');
      }

      // Check if event is active
      if (food.Event.status !== 'active') {
        throw new Error('Cannot place order for an inactive event');
      }

      // Check food availability with quantity consideration
      if (food.quantity < quantity) {
        throw new Error(`Only ${food.quantity} items available for ${food.name}`);
      }

      // Calculate total price with potential discounts
      const total_price = this.calculateOrderTotal(food.price, quantity);

      // Create the order
      const order = await FoodOrder.create({
        user_id: userId,
        food_id,
        event_id,
        quantity,
        unit_price: food.price,
        total_price,
        status: ORDER_STATUS.PENDING,
        special_instructions: special_instructions?.substring(0, 500), // Limit length
        order_date: new Date()
      }, { transaction });

      // Update food inventory
      await food.decrement('quantity', { by: quantity, transaction });

      await transaction.commit();
      
      // Return populated order data
      return this.getOrderById(order.order_id, userId, false);
    } catch (error) {
      await transaction.rollback();
      console.error('Order creation failed:', error);
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  /**
   * Calculate order total with potential discounts
   * @private
   */
  static calculateOrderTotal(unitPrice, quantity) {
    // Apply bulk discount if applicable
    const subtotal = unitPrice * quantity;
    
    // Example: 10% discount for 5+ items
    const discount = quantity >= 5 ? subtotal * 0.1 : 0;
    
    return subtotal - discount;
  }

  /**
   * Get order by ID with proper authorization
   * @param {number} orderId - ID of the order to retrieve
   * @param {number} userId - ID of the requesting user
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {Promise<Object>} Order details
   */
  static async getOrderById(orderId, userId, isAdmin = false) {
    try {
      getModels();
      
      if (!orderId) throw new Error('Order ID is required');
      
      const order = await FoodOrder.findByPk(orderId, {
        include: [
          {
            model: Food,
            as: 'Food',
            attributes: ['food_id', 'name', 'description', 'price', 'image_url']
          },
          {
            model: Event,
            as: 'Event',
            attributes: ['event_id', 'title', 'date', 'venue_id']
          },
          {
            model: User,
            as: 'User',
            attributes: ['user_id', 'name', 'email', 'phone_number']
          }
        ]
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Authorization check
      if (!isAdmin && order.user_id !== userId) {
        throw new Error('Unauthorized to view this order');
      }

      return order;
    } catch (error) {
      console.error(`Error retrieving order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Get orders by status with pagination
   * @param {string} status - Status to filter by
   * @param {number|null} userId - Optional user ID to filter by
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of items per page
   * @returns {Promise<Object>} Paginated orders and pagination info
   */
  static async getOrdersByStatus(status, userId = null, page = 1, limit = 10) {
    try {
      getModels();
      
      // Validate status
      if (!Object.values(ORDER_STATUS).includes(status)) {
        throw new Error('Invalid status provided');
      }

      const whereClause = { status };
      if (userId) {
        whereClause.user_id = userId; // Non-admins can only see their own orders
      }

      const { count, rows } = await FoodOrder.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Food,
            as: 'Food',
            attributes: ['food_id', 'name', 'price', 'image_url']
          },
          {
            model: Event,
            as: 'Event',
            attributes: ['event_id', 'title', 'date']
          },
          {
            model: User,
            as: 'User',
            attributes: ['user_id', 'name']
          }
        ],
        order: [['order_date', 'DESC']],
        limit,
        offset: (page - 1) * limit
      });

      return {
        orders: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalOrders: count,
          hasNextPage: page < Math.ceil(count / limit),
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      console.error(`Error getting ${status} orders:`, error);
      throw error;
    }
  }

  /**
   * Update order status with validation
   * @param {number} orderId - ID of the order to update
   * @param {string} newStatus - New status to set
   * @param {number} userId - ID of the user making the request
   * @returns {Promise<Object>} Updated order
   */
  static async updateOrderStatus(orderId, newStatus, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      getModels();
      
      // Input validation
      if (!orderId || !newStatus) {
        throw new Error('Order ID and status are required');
      }
      
      if (!Object.values(ORDER_STATUS).includes(newStatus)) {
        throw new Error('Invalid status provided');
      }

      // Get order with row locking
      const order = await FoodOrder.findByPk(orderId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
        include: [{
          model: Food,
          as: 'Food',
          attributes: ['food_id', 'quantity']
        }]
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Check permissions (admin or event organizer)
      const isAuthorized = await this.isAdmin(userId) || 
                         (await this.isEventOrganizer(userId, order.event_id));
      
      if (!isAuthorized) {
        throw new Error('Unauthorized to update this order');
      }

      // Validate status transition
      if (!this.isValidStatusTransition(order.status, newStatus)) {
        throw new Error(`Cannot change status from ${order.status} to ${newStatus}`);
      }

      // Special handling for cancellation
      if (newStatus === ORDER_STATUS.CANCELLED) {
        await this.handleOrderCancellation(order, transaction);
      }

      // Update status
      order.status = newStatus;
      order.updated_at = new Date();
      
      if (newStatus === ORDER_STATUS.DELIVERED) {
        order.delivered_at = new Date();
      }

      await order.save({ transaction });
      await transaction.commit();

      return this.getOrderById(orderId, userId, true);
    } catch (error) {
      await transaction.rollback();
      console.error(`Error updating order ${orderId} status:`, error);
      throw error;
    }
  }

  /**
   * Cancel an order (user can only cancel their own pending orders)
   * @param {number} orderId - ID of the order to cancel
   * @param {number} userId - ID of the user making the request
   * @returns {Promise<Object>} Cancelled order
   */
  static async cancelOrder(orderId, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      getModels();
      
      // Get order with row locking
      const order = await FoodOrder.findByPk(orderId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
        include: [{
          model: Food,
          as: 'Food',
          attributes: ['food_id', 'quantity']
        }]
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Check if user is the owner of the order
      if (order.user_id !== userId) {
        throw new Error('You can only cancel your own orders');
      }

      // Check if order can be cancelled
      if (order.status !== ORDER_STATUS.PENDING) {
        throw new Error('Only pending orders can be cancelled');
      }

      // Handle cancellation
      await this.handleOrderCancellation(order, transaction);
      order.status = ORDER_STATUS.CANCELLED;
      order.updated_at = new Date();
      await order.save({ transaction });
      
      await transaction.commit();
      return this.getOrderById(orderId, userId, false);
    } catch (error) {
      await transaction.rollback();
      console.error(`Error cancelling order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Get all orders for an event with optional status filter (Admin only)
   * @param {number} eventId - ID of the event
   * @param {string|null} status - Optional status filter
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of items per page
   * @returns {Promise<Object>} Paginated orders and pagination info
   */
  static async getEventOrders(eventId, status = null, page = 1, limit = 10) {
    try {
      getModels();
      
      const whereClause = { event_id: eventId };
      
      // Add status filter if provided
      if (status && Object.values(ORDER_STATUS).includes(status)) {
        whereClause.status = status;
      }

      const { count, rows } = await FoodOrder.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Food,
            as: 'Food',
            attributes: ['food_id', 'name', 'price', 'image_url']
          },
          {
            model: User,
            as: 'User',
            attributes: ['user_id', 'name', 'email']
          },
          {
            model: Event,
            as: 'Event',
            attributes: ['event_id', 'title', 'date']
          }
        ],
        order: [['order_date', 'DESC']],
        limit,
        offset: (page - 1) * limit
      });

      return {
        orders: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalOrders: count,
          hasNextPage: page < Math.ceil(count / limit),
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      console.error(`Error getting orders for event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Handle order cancellation with inventory restoration
   * @private
   */
  static async handleOrderCancellation(order, transaction) {
    // Only restore inventory if order wasn't already cancelled and has associated food
    if (order.status !== ORDER_STATUS.CANCELLED && order.Food) {
      await order.Food.increment('quantity', {
        by: order.quantity,
        transaction
      });
    }
    
    order.cancelled_at = new Date();
  }

  /**
   * Check if a status transition is valid
   * @private
   */
  static isValidStatusTransition(fromStatus, toStatus) {
    return STATUS_TRANSITIONS[fromStatus].includes(toStatus);
  }

  /**
   * Check if user is admin
   * @private
   */
  static async isAdmin(userId) {
    try {
      getModels();
      const user = await User.findByPk(userId, {
        attributes: ['role']
      });
      return user?.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Check if user is the organizer of an event
   * @private
   */
  static async isEventOrganizer(userId, eventId) {
    try {
      getModels();
      const event = await Event.findByPk(eventId, {
        attributes: ['admin_id']
      });
      return event?.admin_id === userId;
    } catch (error) {
      console.error('Error checking event organizer status:', error);
      return false;
    }
  }
}

module.exports = FoodOrderService;
