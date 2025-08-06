const eventService = require('../services/eventService');

// Create a new event
exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, venue_id, artist_lineup } = req.body;
        const adminId = req.user.user_id;

        // Handle main event image
        let eventImage = null;
        if (req.files && req.files.event_image && req.files.event_image[0]) {
            const file = req.files.event_image[0];
            eventImage = {
                filename: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                data: file.buffer.toString('base64')
            };
        }

        // Handle additional event images
        let eventImages = null;
        if (req.files && req.files.event_images && req.files.event_images.length > 0) {
            eventImages = req.files.event_images.map(file => ({
                filename: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                data: file.buffer.toString('base64')
            }));
        }

        // Parse artist_lineup if it's a string
        let parsedArtistLineup = artist_lineup;
        if (typeof artist_lineup === 'string') {
            try {
                parsedArtistLineup = JSON.parse(artist_lineup);
            } catch (parseError) {
                parsedArtistLineup = artist_lineup.split(',').map(name => name.trim());
            }
        }

        const event = await eventService.createEvent({
            title,
            description,
            date,
            venue_id,
            artist_lineup: parsedArtistLineup,
            event_images: eventImages,
            image_url: eventImage ? `data:${eventImage.mimetype};base64,${eventImage.data}` : null
        }, adminId);

        res.status(201).json({
            message: 'Event created successfully',
            event: {
                ...event.toJSON(),
                event_images: eventImages ? eventImages.map(img => ({
                    filename: img.filename,
                    mimetype: img.mimetype,
                    size: img.size
                })) : null,
                image_count: eventImages ? eventImages.length : 0
            }
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
        const { title, description, date, venue_id, artist_lineup } = req.body;
        const adminId = req.user.user_id;

        // Handle main event image
        let eventImage = null;
        if (req.files && req.files.event_image && req.files.event_image[0]) {
            const file = req.files.event_image[0];
            eventImage = {
                filename: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                data: file.buffer.toString('base64')
            };
        }

        // Handle additional event images
        let eventImages = null;
        if (req.files && req.files.event_images && req.files.event_images.length > 0) {
            eventImages = req.files.event_images.map(file => ({
                filename: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                data: file.buffer.toString('base64')
            }));
        }

        // Parse artist_lineup if it's a string
        let parsedArtistLineup = artist_lineup;
        if (typeof artist_lineup === 'string') {
            try {
                parsedArtistLineup = JSON.parse(artist_lineup);
            } catch (parseError) {
                parsedArtistLineup = artist_lineup.split(',').map(name => name.trim());
            }
        }

        const updateData = {
            title,
            description,
            date,
            venue_id,
            artist_lineup: parsedArtistLineup,
            event_images: eventImages,
            image_url: eventImage ? `data:${eventImage.mimetype};base64,${eventImage.data}` : undefined
        };

        const event = await eventService.updateEvent(eventId, updateData, adminId);
        
        res.status(200).json({
            message: 'Event updated successfully',
            event: {
                ...event.toJSON(),
                event_images: eventImages ? eventImages.map(img => ({
                    filename: img.filename,
                    mimetype: img.mimetype,
                    size: img.size
                })) : event.event_images,
                image_count: eventImages ? eventImages.length : (event.event_images ? event.event_images.length : 0)
            }
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
        const adminId = req.user.user_id;

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
        
        res.json({
            message: 'Events retrieved successfully',
            events
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

// Get event images by event ID
exports.getEventImages = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await eventService.getEventById(eventId);
        
        if (!event) {
            return res.status(404).json({
                error: 'Event not found'
            });
        }

        res.json({
            message: 'Event images retrieved successfully',
            event_id: eventId,
            event_images: event.event_images || [],
            image_url: event.image_url || null,
            image_count: event.event_images ? event.event_images.length : 0
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};