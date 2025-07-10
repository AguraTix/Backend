const venueService = require('../services/venueService');

// Create a new venue
exports.createVenue = async (req, res) => {
    try {
        const { name, location, map_data,} = req.body;
        const adminId = req.user.user_id; 

        const venue = await venueService.createVenue({
            name,
            location,
            map_data,
            capacity: req.body.capacity || 0
        }, adminId);

        res.status(201).json({
            message: 'Venue created successfully',
            venue
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

// Get all venues
exports.getAllVenues = async (req, res) => {
    try {
        const venues = await venueService.getAllVenues();
        res.status(200).json({
            message: 'Venues retrieved successfully',
            venues
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

// Get venue by ID
exports.getVenueById = async (req, res) => {
    try {
        const { venueId } = req.params;
        const venue = await venueService.getVenueById(venueId);
        
        res.status(200).json({
            message: 'Venue retrieved successfully',
            venue
        });
    } catch (error) {
        res.status(404).json({
            error: error.message
        });
    }
};

// Update venue
exports.updateVenue = async (req, res) => {
    try {
        const { venueId } = req.params;
        const updateData = req.body;
        const adminId = req.user.user_id; 

        const venue = await venueService.updateVenue(venueId, updateData, adminId);
        
        res.status(200).json({
            message: 'Venue updated successfully',
            venue
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

// Delete venue
exports.deleteVenue = async (req, res) => {
    try {
        const { venueId } = req.params;
        const adminId = req.user.user_id; // From JWT token

        const result = await venueService.deleteVenue(venueId, adminId);
        
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
}; 