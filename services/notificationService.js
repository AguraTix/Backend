const { Notification, Event, Venue, User, Ticket } = require('../models');

const createNotification = async ({ user_id, type, title, message, data = {} }) => {
    if (!user_id) {
        throw new Error('user_id is required to create a notification');
    }

    const notification = await Notification.create({
        user_id,
        type,
        title,
        message,
        data,
    });

    return notification;
};

const getNotificationsForUser = async (user, { limit = 50, offset = 0 } = {}) => {
    const where = {};

    if (!user) {
        throw new Error('User context is required');
    }

    if (user.role === 'SuperAdmin') {
        // SuperAdmin can see all notifications
    } else {
        // Normal user / admin: only their own
        where.user_id = user.user_id;
    }

    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 200);
    const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

    const { rows: notifications, count } = await Notification.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parsedLimit,
        offset: parsedOffset,
    });

    return {
        notifications,
        pagination: {
            total: count,
            limit: parsedLimit,
            offset: parsedOffset,
            hasMore: parsedOffset + parsedLimit < count,
        },
    };
};

const markNotificationAsRead = async (notificationId, user) => {
    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
        throw new Error('Notification not found');
    }

    // Only owner or SuperAdmin can mark as read
    if (user.role !== 'SuperAdmin' && notification.user_id !== user.user_id) {
        throw new Error('Not authorized to modify this notification');
    }

    if (!notification.is_read) {
        notification.is_read = true;
        await notification.save();
    }

    return notification;
};

module.exports = {
    createNotification,
    getNotificationsForUser,
    markNotificationAsRead,
};
