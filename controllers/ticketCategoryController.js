const ticketCategoryService = require('../services/ticketCategoryService');

// Create a new ticket category
exports.createTicketCategory = async (req, res) => {
    try {
        const { name, price, event_id, section_id } = req.body;
        const adminId = req.user.user_id;

        const category = await ticketCategoryService.createTicketCategory({
            name,
            price,
            event_id,
            section_id
        }, adminId);

        res.status(201).json({
            message: 'Ticket category created successfully',
            category
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

// Get ticket categories by event
exports.getTicketCategoriesByEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const categories = await ticketCategoryService.getTicketCategoriesByEvent(eventId);
        
        res.status(200).json({
            message: 'Ticket categories retrieved successfully',
            categories
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

// Get ticket category by ID
exports.getTicketCategoryById = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const category = await ticketCategoryService.getTicketCategoryById(categoryId);
        
        res.status(200).json({
            message: 'Ticket category retrieved successfully',
            category
        });
    } catch (error) {
        res.status(404).json({
            error: error.message
        });
    }
};

// Update ticket category
exports.updateTicketCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const updateData = req.body;
        const adminId = req.user.user_id;

        const category = await ticketCategoryService.updateTicketCategory(categoryId, updateData, adminId);
        
        res.status(200).json({
            message: 'Ticket category updated successfully',
            category
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

// Delete ticket category
exports.deleteTicketCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const adminId = req.user.user_id;

        const result = await ticketCategoryService.deleteTicketCategory(categoryId, adminId);
        
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
}; 