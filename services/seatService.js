const { Seat, Section, Venue } = require('../models');

// Create multiple seats for a section
exports.createSeats = async (sectionId, seatData, adminId) => {
    // Check if section exists and belongs to admin's venue
    const section = await Section.findByPk(sectionId);
    if (!section) {
        throw new Error('Section not found');
    }

    const venue = await Venue.findByPk(section.venue_id);
    if (venue.admin_id !== adminId) {
        throw new Error('Only the venue admin can create seats');
    }

    const { startNumber, endNumber } = seatData;
    const seats = [];

    for (let i = startNumber; i <= endNumber; i++) {
        seats.push({
            section_id: sectionId,
            number: i,
            status: 'Available'
        });
    }

    const createdSeats = await Seat.bulkCreate(seats);
    return createdSeats;
};

// Get available seats for a section
exports.getAvailableSeats = async (sectionId) => {
    const seats = await Seat.findAll({
        where: { 
            section_id: sectionId,
            status: 'Available'
        },
        order: [['number', 'ASC']]
    });
    return seats;
};

// Get all seats for a section
exports.getSeatsBySection = async (sectionId) => {
    const seats = await Seat.findAll({
        where: { section_id: sectionId },
        order: [['number', 'ASC']]
    });
    return seats;
};

// Update seat status
exports.updateSeatStatus = async (seatId, status, adminId) => {
    const seat = await Seat.findByPk(seatId, {
        include: [{
            model: Section,
            include: [{
                model: Venue
            }]
        }]
    });

    if (!seat) {
        throw new Error('Seat not found');
    }

    if (seat.Section.Venue.admin_id !== adminId) {
        throw new Error('Only the venue admin can update seat status');
    }

    await seat.update({ status });
    return seat;
};

// Reserve seats (temporarily mark as selected)
exports.reserveSeats = async (seatIds, attendeeId) => {
    const seats = await Seat.findAll({
        where: { 
            seat_id: seatIds,
            status: 'Available'
        }
    });

    if (seats.length !== seatIds.length) {
        throw new Error('Some seats are not available');
    }

    // Update seats to selected status
    await Seat.update(
        { status: 'Selected' },
        { where: { seat_id: seatIds } }
    );

    return seats;
};

// Release reserved seats
exports.releaseSeats = async (seatIds) => {
    await Seat.update(
        { status: 'Available' },
        { where: { seat_id: seatIds } }
    );
    return { message: 'Seats released successfully' };
}; 