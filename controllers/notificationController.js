const notificationService = require('../services/notificationService');

exports.getMyNotifications = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { limit, offset } = req.query;
        const result = await notificationService.getNotificationsForUser(user, { limit, offset });

        return res.status(200).json({
            message: 'Notifications retrieved successfully',
            notifications: result.notifications,
            pagination: result.pagination,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;
        const notification = await notificationService.markNotificationAsRead(id, user);

        return res.status(200).json({
            message: 'Notification marked as read',
            notification,
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return res.status(400).json({ error: error.message });
    }
};
