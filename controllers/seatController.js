const seatService = require('../services/seatService');

// Create seats for a section
exports.createSeats = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { startNumber, endNumber } = req.body;
        const adminId = req.user.user_id;

        const seats = await seatService.createSeats(sectionId, {
            startNumber,
            endNumber
        }, adminId);

        res.status(201).json({
            message: 'Seats created successfully',
            seats
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

// Get available seats for a section
exports.getAvailableSeats = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const seats = await seatService.getAvailableSeats(sectionId);
        
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

// Get all seats for a section
exports.getSeatsBySection = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const seats = await seatService.getSeatsBySection(sectionId);
        
        res.status(200).json({
            message: 'Seats retrieved successfully',
            seats
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

// Update seat status
exports.updateSeatStatus = async (req, res) => {
    try {
        const { seatId } = req.params;
        const { status } = req.body;
        const adminId = req.user.user_id;

        const seat = await seatService.updateSeatStatus(seatId, status, adminId);
        
        res.status(200).json({
            message: 'Seat status updated successfully',
            seat
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

// Reserve seats
exports.reserveSeats = async (req, res) => {
    try {
        const { seatIds } = req.body;
        const attendeeId = req.user.user_id;

        const seats = await seatService.reserveSeats(seatIds, attendeeId);
        
        res.status(200).json({
            message: 'Seats reserved successfully',
            seats
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

// Release reserved seats
exports.releaseSeats = async (req, res) => {
    try {
        const { seatIds } = req.body;
        const result = await seatService.releaseSeats(seatIds);
        
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
}; 