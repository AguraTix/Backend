const { Event, Venue, User } = require('../models');

// Create a new event (Admin only)
exports.createEvent = async (eventData, adminId) => {
    const admin = await User.findByPk(adminId);
    if (!admin || admin.role !== 'Admin') {
        throw new Error('Only admins can create events');
    }

    // Check if venue exists
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

// Get all events
exports.getAllEvents = async () => {
    const events = await Event.findAll({
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

// Get event by ID
exports.getEventById = async (eventId) => {
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
    
    return event;
};

// Update event (Admin only - must be the event's admin)
exports.updateEvent = async (eventId, updateData, adminId) => {
    const event = await Event.findByPk(eventId);
    if (!event) {
        throw new Error('Event not found');
    }

    if (event.admin_id !== adminId) {
        throw new Error('Only the event admin can update this event');
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

// Delete event (Admin only - must be the event's admin)
exports.deleteEvent = async (eventId, adminId) => {
    const event = await Event.findByPk(eventId);
    if (!event) {
        throw new Error('Event not found');
    }

    if (event.admin_id !== adminId) {
        throw new Error('Only the event admin can delete this event');
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