const eventService = require('../services/eventService');

// Create a new event
exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, venue_id, artist_lineup } = req.body;
        const adminId = req.user.user_id; 

        const event = await eventService.createEvent({
            title,
            description,
            date,
            venue_id,
            artist_lineup
        }, adminId);

        res.status(201).json({
            message: 'Event created successfully',
            event
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

// Get all events
exports.getAllEvents = async (req, res) => {
    try {
        const events = await eventService.getAllEvents();
        res.status(200).json({
            message: 'Events retrieved successfully',
            events
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

// Get event by ID
exports.getEventById = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await eventService.getEventById(eventId);
        
        res.status(200).json({
            message: 'Event retrieved successfully',
            event
        });
    } catch (error) {
        res.status(404).json({
            error: error.message
        });
    }
};

// Update event
exports.updateEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const updateData = req.body;
        const adminId = req.user.user_id; // From JWT token

        const event = await eventService.updateEvent(eventId, updateData, adminId);
        
        res.status(200).json({
            message: 'Event updated successfully',
            event
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

// Delete event
exports.deleteEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const adminId = req.user.user_id; // From JWT token

        const result = await eventService.deleteEvent(eventId, adminId);
        
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

// Get events by venue
exports.getEventsByVenue = async (req, res) => {
    try {
        const { venueId } = req.params;
        const events = await eventService.getEventsByVenue(venueId);
        
        res.status(200).json({
            message: 'Events retrieved successfully',
            events
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}; 