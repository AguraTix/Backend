const { Event, Venue, User } = require('../models');


exports.createEvent = async (eventData, adminId) => {
    const admin = await User.findByPk(adminId);
    if (!admin || admin.role !== 'Admin') {
        throw new Error('Only admins can create events');
    }


    const venue = await Venue.findByPk(eventData.venue_id);
    if (!venue) {
        throw new Error('Venue not found');
    }

    const event = await Event.create({
        ...eventData,
        admin_id: adminId
    });

    return event;
};

// Get all events (filtered by role)
exports.getAllEvents = async (userId, userRole) => {
    let whereClause = {};
    
    // If user is Admin (not SuperAdmin), only show their events
    if (userRole === 'Admin') {
        whereClause.admin_id = userId;
    }
    // SuperAdmin sees all events (no filter)

    const events = await Event.findAll({
        where: whereClause,
        include: [
            {
                model: User,
                as: 'User',
                attributes: ['user_id', 'name', 'email']
            },
            {
                model: Venue,
                as: 'Venue',
                attributes: ['venue_id', 'name', 'location', 'capacity']
            }
        ]
    });
    return events;
};

// Get event by ID (with ownership check)
exports.getEventById = async (eventId, userId = null, userRole = null) => {
    const event = await Event.findByPk(eventId, {
        include: [
            {
                model: User,
                as: 'User',
                attributes: ['user_id', 'name', 'email']
            },
            {
                model: Venue,
                as: 'Venue',
                attributes: ['venue_id', 'name', 'location', 'capacity']
            }
        ]
    });
    
    if (!event) {
        throw new Error('Event not found');
    }

    // If user is Admin (not SuperAdmin), only allow access to their own events
    if (userRole === 'Admin' && userId && event.admin_id !== userId) {
        throw new Error('Access denied. You can only view your own events.');
    }
    // SuperAdmin can view any event, or if no user context (public access)
    
    return event;
};

// Update event (Admin only - must be the event's admin, or SuperAdmin)
exports.updateEvent = async (eventId, updateData, adminId) => {
    const event = await Event.findByPk(eventId);
    if (!event) {
        throw new Error('Event not found');
    }

    const admin = await User.findByPk(adminId);
    // SuperAdmin can update any event, regular Admin can only update their own
    if (admin.role !== 'SuperAdmin' && event.admin_id !== adminId) {
        throw new Error('Only the event admin or SuperAdmin can update this event');
    }

    // If venue_id is being updated, check if new venue exists
    if (updateData.venue_id) {
        const venue = await Venue.findByPk(updateData.venue_id);
        if (!venue) {
            throw new Error('Venue not found');
        }
    }

    await event.update(updateData);
    return event;
};

// Delete event (Admin only - must be the event's admin, or SuperAdmin)
exports.deleteEvent = async (eventId, adminId) => {
    const event = await Event.findByPk(eventId);
    if (!event) {
        throw new Error('Event not found');
    }

    const admin = await User.findByPk(adminId);
    // SuperAdmin can delete any event, regular Admin can only delete their own
    if (admin.role !== 'SuperAdmin' && event.admin_id !== adminId) {
        throw new Error('Only the event admin or SuperAdmin can delete this event');
    }

    await event.destroy();
    return { message: 'Event deleted successfully' };
};

// Get events by venue
exports.getEventsByVenue = async (venueId) => {
    const events = await Event.findAll({
        where: { venue_id: venueId },
        include: [
            {
                model: User,
                as: 'User',
                attributes: ['user_id', 'name', 'email']
            },
            {
                model: Venue,
                as: 'Venue',
                attributes: ['venue_id', 'name', 'location', 'capacity']
            }
        ]
    });
    return events;
};

// Get recent events with pagination and filtering
exports.getRecentEvents = async (limit = 10, offset = 0, upcomingOnly = true) => {
    const whereClause = {};
    
    // If upcomingOnly is true, only get events that haven't happened yet
    if (upcomingOnly) {
        whereClause.date = {
            [require('sequelize').Op.gte]: new Date()
        };
    }
    
    const events = await Event.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']], // Most recently created first
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
            {
                model: User,
                as: 'User',
                attributes: ['user_id', 'name', 'email']
            },
            {
                model: Venue,
                as: 'Venue',
                attributes: ['venue_id', 'name', 'location', 'capacity']
            }
        ]
    });
    
    // Get total count for pagination
    const totalCount = await Event.count({ where: whereClause });
    
    return {
        events,
        pagination: {
            total: totalCount,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
        }
    };
}; 