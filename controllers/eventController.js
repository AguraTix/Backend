const eventService = require('../services/eventService');
const path = require('path');

// Create a new event
exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, venue_id, artist_lineup, image_url } = req.body;
        const adminId = req.user.user_id;

        // Handle image - either from file upload or URL
        let finalImageUrl = image_url;
        
        // If a file was uploaded, use the file path instead of URL
        if (req.file) {
            finalImageUrl = `/uploads/events/${req.file.filename}`;
        }

        // Validate image_url if provided and no file uploaded
        if (!req.file && image_url && typeof image_url !== 'string') {
            return res.status(400).json({
                error: 'image_url must be a string if provided'
            });
        } 

        const event = await eventService.createEvent({
            title,
            description,
            date,
            venue_id,
            artist_lineup,
            image_url: finalImageUrl
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

        // Handle image - either from file upload or URL
        if (req.file) {
            updateData.image_url = `/uploads/events/${req.file.filename}`;
        }

        // Validate image_url if provided in update and no file uploaded
        if (!req.file && updateData.image_url && typeof updateData.image_url !== 'string') {
            return res.status(400).json({
                error: 'image_url must be a string if provided'
            });
        }

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