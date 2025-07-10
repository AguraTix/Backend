const { Ticket, TicketCategory, User, Seat, Section, Event } = require('../models');
const crypto = require('crypto');

// Generate QR code
const generateQRCode = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Purchase tickets
exports.purchaseTickets = async (purchaseData, attendeeId) => {
    const { categoryId, seatIds } = purchaseData;

    // Check if user is an attendee (not admin)
    const user = await User.findByPk(attendeeId);
    if (!user) {
        throw new Error('User not found');
    }
    if (user.role !== 'Attendee') {
        throw new Error('Only attendees can purchase tickets. Admins cannot purchase tickets.');
    }

    // Check if category exists
    const category = await TicketCategory.findByPk(categoryId);
    if (!category) {
        throw new Error('Ticket category not found');
    }

    // Check if seats are available
    const seats = await Seat.findAll({
        where: { 
            seat_id: seatIds,
            status: 'Available'
        }
    });

    if (seats.length !== seatIds.length) {
        throw new Error('Some seats are not available');
    }

    // Check if seats belong to the category's section
    const categorySectionId = category.section_id;
    const invalidSeats = seats.filter(seat => seat.section_id !== categorySectionId);
    if (invalidSeats.length > 0) {
        throw new Error('Some seats do not belong to the selected category section');
    }

    // Create tickets
    const tickets = [];
    for (const seat of seats) {
        const ticket = await Ticket.create({
            category_id: categoryId,
            attendee_id: attendeeId,
            seat_id: seat.seat_id,
            qr_code: generateQRCode(),
            status: 'Active'
        });
        tickets.push(ticket);

        // Update seat status to sold out
        await seat.update({ status: 'Sold Out' });
    }

    return tickets;
};

// Get user's tickets
exports.getUserTickets = async (attendeeId) => {
    const tickets = await Ticket.findAll({
        where: { attendee_id: attendeeId },
        include: [
            {
                model: TicketCategory,
                include: [
                    {
                        model: Event,
                        attributes: ['event_id', 'title', 'date', 'description']
                    },
                    {
                        model: Section,
                        attributes: ['section_id', 'name']
                    }
                ]
            },
            {
                model: Seat,
                attributes: ['seat_id', 'number']
            }
        ],
        order: [['createdAt', 'DESC']]
    });
    return tickets;
};

// Get ticket by ID
exports.getTicketById = async (ticketId, attendeeId) => {
    const ticket = await Ticket.findOne({
        where: { 
            ticket_id: ticketId,
            attendee_id: attendeeId
        },
        include: [
            {
                model: TicketCategory,
                include: [
                    {
                        model: Event,
                        attributes: ['event_id', 'title', 'date', 'description']
                    },
                    {
                        model: Section,
                        attributes: ['section_id', 'name']
                    }
                ]
            },
            {
                model: Seat,
                attributes: ['seat_id', 'number']
            }
        ]
    });

    if (!ticket) {
        throw new Error('Ticket not found');
    }

    return ticket;
};

// Validate ticket (for entry)
exports.validateTicket = async (qrCode) => {
    const ticket = await Ticket.findOne({
        where: { qr_code: qrCode },
        include: [
            {
                model: TicketCategory,
                include: [
                    {
                        model: Event,
                        attributes: ['event_id', 'title', 'date']
                    }
                ]
            },
            {
                model: User,
                attributes: ['user_id', 'name', 'email']
            }
        ]
    });

    if (!ticket) {
        throw new Error('Invalid ticket');
    }

    if (ticket.status !== 'Active') {
        throw new Error(`Ticket is ${ticket.status.toLowerCase()}`);
    }

    // Check if event date is today or in the future
    const eventDate = new Date(ticket.TicketCategory.Event.date);
    const today = new Date();
    if (eventDate < today) {
        throw new Error('Event has already passed');
    }

    return ticket;
};

// Use ticket (mark as used)
exports.useTicket = async (ticketId) => {
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) {
        throw new Error('Ticket not found');
    }

    if (ticket.status !== 'Active') {
        throw new Error(`Ticket is ${ticket.status.toLowerCase()}`);
    }

    await ticket.update({ status: 'Used' });
    return ticket;
};

// Refund ticket
exports.refundTicket = async (ticketId, attendeeId) => {
    const ticket = await Ticket.findOne({
        where: { 
            ticket_id: ticketId,
            attendee_id: attendeeId
        }
    });

    if (!ticket) {
        throw new Error('Ticket not found');
    }

    if (ticket.status !== 'Active') {
        throw new Error(`Ticket is ${ticket.status.toLowerCase()}`);
    }

    // Update ticket status
    await ticket.update({ status: 'Refunded' });

    // Make seat available again
    await Seat.update(
        { status: 'Available' },
        { where: { seat_id: ticket.seat_id } }
    );

    return ticket;
};

// Get available seats for a ticket category
exports.getAvailableSeatsForCategory = async (categoryId) => {
    const category = await TicketCategory.findByPk(categoryId);
    if (!category) {
        throw new Error('Ticket category not found');
    }

    const seats = await Seat.findAll({
        where: { 
            section_id: category.section_id,
            status: 'Available'
        },
        order: [['number', 'ASC']]
    });

    return seats;
}; 