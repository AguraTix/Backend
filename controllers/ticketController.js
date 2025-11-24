const models = require('../models');
const { Ticket, Event, Venue, User } = models;
const { Op } = require('sequelize');

class TicketController {
    constructor() {
        if (!Ticket || !Event || !Venue || !User) {
            console.error('One or more models are undefined. Check model initialization in app.js');
            throw new Error('Models not properly initialized');
        }
    }

    async getAvailableTickets(req, res) {
        try {
            const { eventId } = req.params;
            const event = await Event.findByPk(eventId, { include: [{ model: Venue, as: 'Venue' }] });
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            const tickets = await Ticket.findAll({
                where: { eventId, status: 'available' }
            });

            let groupedTickets = [];
            if (event.Venue.hasSections) {
                const sections = {};
                tickets.forEach(ticket => {
                    if (!sections[ticket.sectionName]) {
                        sections[ticket.sectionName] = [];
                    }
                    sections[ticket.sectionName].push(ticket);
                });
                groupedTickets = Object.entries(sections).map(([sectionName, sectionTickets]) => ({
                    sectionName,
                    available: sectionTickets.length,
                    tickets: sectionTickets
                }));
            } else {
                groupedTickets = [{
                    sectionName: 'General Admission',
                    available: tickets.length,
                    tickets
                }];
            }

            return res.status(200).json({
                message: 'Available tickets retrieved successfully',
                groupedTickets
            });
        } catch (error) {
            console.error('Error fetching available tickets:', error);
            return res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }

    async bookTicket(req, res) {
        try {
            const { ticketId } = req.params;
            const attendee_id = req.user?.user_id;
            if (!attendee_id) {
                return res.status(401).json({ error: 'Unauthorized: No user ID provided' });
            }

            const ticket = await Ticket.findByPk(ticketId);
            if (!ticket) {
                return res.status(404).json({ error: 'Ticket not found' });
            }

            if (ticket.status !== 'available') {
                return res.status(400).json({ error: 'Ticket is not available' });
            }

            ticket.attendee_id = attendee_id;
            ticket.status = 'sold';
            await ticket.save();

            return res.status(200).json({
                message: 'Ticket booked successfully',
                ticket: {
                    ticket_id: ticket.ticket_id,
                    eventId: ticket.eventId,
                    venueId: ticket.venueId,
                    sectionName: ticket.sectionName,
                    seatNumber: ticket.seatNumber,
                    price: ticket.price,
                    status: ticket.status,
                    qrCodeUrl: ticket.qrCodeUrl
                }
            });
        } catch (error) {
            console.error('Error booking ticket:', error);
            return res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }

    async getMyTickets(req, res) {
        try {
            const attendee_id = req.user?.user_id;
            if (!attendee_id) {
                return res.status(401).json({ error: 'Unauthorized: No user ID provided' });
            }

            const tickets = await Ticket.findAll({
                where: { attendee_id },
                include: [
                    { model: Event, as: 'Event', attributes: ['event_id', 'title', 'date'] },
                    { model: Venue, as: 'Venue', attributes: ['venue_id', 'name', 'location'] }
                ]
            });

            const processedTickets = tickets.map(ticket => ({
                ...ticket.toJSON(),
                qrCodeUrl: ticket.qrCodeUrl
            }));

            return res.status(200).json({
                message: 'My tickets retrieved successfully',
                tickets: processedTickets
            });
        } catch (error) {
            console.error('Error fetching my tickets:', error);
            return res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }

    async cancelTicket(req, res) {
        try {
            const { ticketId } = req.params;
            const attendee_id = req.user?.user_id;
            if (!attendee_id) {
                return res.status(401).json({ error: 'Unauthorized: No user ID provided' });
            }

            const ticket = await Ticket.findByPk(ticketId);
            if (!ticket) {
                return res.status(404).json({ error: 'Ticket not found' });
            }

            if (ticket.attendee_id !== attendee_id) {
                return res.status(403).json({ error: 'Unauthorized to cancel this ticket' });
            }

            if (ticket.status !== 'sold') {
                return res.status(400).json({ error: 'Ticket cannot be cancelled' });
            }

            ticket.attendee_id = null;
            ticket.status = 'available';
            ticket.qrCode = null;
            ticket.purchaseDate = null;
            await ticket.save();

            return res.status(200).json({
                message: 'Ticket cancelled successfully'
            });
        } catch (error) {
            console.error('Error cancelling ticket:', error);
            return res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }

    async getAllBookedTickets(req, res) {
        try {
            const { status = 'sold', limit = 50, offset = 0 } = req.query;
            const userId = req.user?.user_id;
            const userRole = req.user?.role;

            const parsedLimit = Math.min(parseInt(limit, 10) || 50, 200);
            const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

            let statuses = ['sold'];
            if (status && typeof status === 'string') {
                if (status.toLowerCase() === 'all') {
                    statuses = ['reserved', 'sold', 'used'];
                } else {
                    statuses = status.split(',').map(s => s.trim()).filter(Boolean);
                }
            }

            // Build where clause - filter by admin's events if Admin (not SuperAdmin)
            let whereClause = { status: { [Op.in]: statuses } };
            let eventInclude = {
                model: Event,
                as: 'Event',
                attributes: ['event_id', 'title', 'date', 'admin_id']
            };

            // If user is Admin (not SuperAdmin), only show tickets for their events
            if (userRole === 'Admin' && userId) {
                eventInclude.where = { admin_id: userId };
            }
            // SuperAdmin sees all tickets (no filter)

            const tickets = await Ticket.findAll({
                where: whereClause,
                include: [
                    eventInclude,
                    { model: Venue, as: 'Venue', attributes: ['venue_id', 'name', 'location', 'hasSections'] },
                    { model: User, as: 'User', attributes: ['user_id', 'name', 'email'] }
                ],
                order: [['purchaseDate', 'DESC']],
                limit: parsedLimit,
                offset: parsedOffset
            });

            // Count with same filter
            let countWhere = { status: { [Op.in]: statuses } };
            if (userRole === 'Admin' && userId) {
                // For count, we need to join with events to filter by admin_id
                const adminEvents = await Event.findAll({ where: { admin_id: userId }, attributes: ['event_id'] });
                const eventIds = adminEvents.map(e => e.event_id);
                countWhere.eventId = { [Op.in]: eventIds };
            }
            const count = await Ticket.count({ where: countWhere });

            const processedTickets = tickets.map(ticket => ({
                ...ticket.toJSON(),
                qrCodeUrl: ticket.qrCodeUrl
            }));

            return res.status(200).json({
                message: 'Booked tickets retrieved successfully',
                total: count,
                limit: parsedLimit,
                offset: parsedOffset,
                tickets: processedTickets,
                filter: userRole === 'Admin' ? 'Your events only' : 'All events'
            });
        } catch (error) {
            console.error('Error fetching booked tickets (admin):', error);
            return res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }
}

module.exports = new TicketController();