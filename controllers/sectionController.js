const sectionService = require('../services/sectionService');

// Create a new section
exports.createSection = async (req, res) => {
    try {
        const { name, description, venue_id, parent_section_id, seat_map } = req.body;
        const adminId = req.user.user_id;

        const section = await sectionService.createSection({
            name,
            description,
            venue_id,
            parent_section_id,
            seat_map
        }, adminId);

        res.status(201).json({
            message: 'Section created successfully',
            section
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

// Get sections by venue
exports.getSectionsByVenue = async (req, res) => {
    try {
        const { venueId } = req.params;
        const sections = await sectionService.getSectionsByVenue(venueId);
        
        res.status(200).json({
            message: 'Sections retrieved successfully',
            sections
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

// Get section by ID
exports.getSectionById = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const section = await sectionService.getSectionById(sectionId);
        
        res.status(200).json({
            message: 'Section retrieved successfully',
            section
        });
    } catch (error) {
        res.status(404).json({
            error: error.message
        });
    }
};

// Update section
exports.updateSection = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const updateData = req.body;
        const adminId = req.user.user_id;

        const section = await sectionService.updateSection(sectionId, updateData, adminId);
        
        res.status(200).json({
            message: 'Section updated successfully',
            section
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

// Delete section
exports.deleteSection = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const adminId = req.user.user_id;

        const result = await sectionService.deleteSection(sectionId, adminId);
        
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
}; 