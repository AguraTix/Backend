const ticketService = require('../services/ticketService');

// Purchase tickets
exports.purchaseTickets = async (req, res) => {
    try {
        const { categoryId, seatIds } = req.body;
        const attendeeId = req.user.user_id;

        const tickets = await ticketService.purchaseTickets({
            categoryId,
            seatIds
        }, attendeeId);

        res.status(201).json({
            message: 'Tickets purchased successfully',
            tickets
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

// Get user's tickets
exports.getUserTickets = async (req, res) => {
    try {
        const attendeeId = req.user.user_id;
        const tickets = await ticketService.getUserTickets(attendeeId);
        
        res.status(200).json({
            message: 'Tickets retrieved successfully',
            tickets
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

// Get ticket by ID
exports.getTicketById = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const attendeeId = req.user.user_id;
        const ticket = await ticketService.getTicketById(ticketId, attendeeId);
        
        res.status(200).json({
            message: 'Ticket retrieved successfully',
            ticket
        });
    } catch (error) {
        res.status(404).json({
            error: error.message
        });
    }
};

// Validate ticket (for entry)
exports.validateTicket = async (req, res) => {
    try {
        const { qrCode } = req.params;
        const ticket = await ticketService.validateTicket(qrCode);
        
        res.status(200).json({
            message: 'Ticket is valid',
            ticket
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

// Use ticket (mark as used)
exports.useTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const ticket = await ticketService.useTicket(ticketId);
        
        res.status(200).json({
            message: 'Ticket marked as used',
            ticket
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

// Refund ticket
exports.refundTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const attendeeId = req.user.user_id;
        const ticket = await ticketService.refundTicket(ticketId, attendeeId);
        
        res.status(200).json({
            message: 'Ticket refunded successfully',
            ticket
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

// Get available seats for a ticket category
exports.getAvailableSeatsForCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const seats = await ticketService.getAvailableSeatsForCategory(categoryId);
        
        res.status(200).json({
            message: 'Available seats retrieved successfully',
            seats
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}; 