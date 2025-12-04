const models = require('../models');
const { Ticket, Event, Venue, User, sequelize } = models;
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

const normalizeTypeName = (type) => {
    if (type && typeof type === 'string' && type.trim() !== '') {
        return type.trim();
    }
    return 'General Admission';
};

const buildTicketTypeSummary = (tickets = []) => {
    const typeMap = new Map();

    tickets.forEach(ticket => {
        const type = normalizeTypeName(ticket.sectionName);

        if (!typeMap.has(type)) {
            typeMap.set(type, {
                type,
                available: 0,
                minPrice: Number.POSITIVE_INFINITY,
                maxPrice: Number.NEGATIVE_INFINITY
            });
        }

        const entry = typeMap.get(type);
        entry.available += 1;

        if (typeof ticket.price === 'number') {
            entry.minPrice = Math.min(entry.minPrice, ticket.price);
            entry.maxPrice = Math.max(entry.maxPrice, ticket.price);
        }
    });

    return Array.from(typeMap.values()).map(entry => ({
        type: entry.type,
        available: entry.available,
        minPrice: Number.isFinite(entry.minPrice) ? entry.minPrice : null,
        maxPrice: Number.isFinite(entry.maxPrice) ? entry.maxPrice : null
    }));
};

const adjustEventTicketAvailability = async (eventId, sectionName, delta) => {
    if (!eventId || typeof delta !== 'number' || delta === 0) {
        return;
    }

    const event = await Event.findByPk(eventId);
    if (!event || !Array.isArray(event.tickets) || event.tickets.length === 0) {
        return;
    }

    const type = normalizeTypeName(sectionName);
    let changed = false;

    const updatedTickets = event.tickets.map(ticketType => {
        if (!ticketType?.type) {
            return ticketType;
        }
        const currentTypeName = normalizeTypeName(ticketType.type);
        if (currentTypeName !== type) {
            return ticketType;
        }

        const baseAvailable = typeof ticketType.availableTickets === 'number'
            ? ticketType.availableTickets
            : (typeof ticketType.available === 'number'
                ? ticketType.available
                : (typeof ticketType.quantity === 'number' ? ticketType.quantity : 0));
        const nextAvailable = Math.max(0, baseAvailable + delta);
        changed = changed || nextAvailable !== ticketType.availableTickets;
        return {
            ...ticketType,
            available: nextAvailable,
            availableTickets: nextAvailable
        };
    });

    if (changed) {
        event.tickets = updatedTickets;
        await event.save({ fields: ['tickets'] });
    }
};

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
                where: { eventId, status: 'available' },
                attributes: ['ticket_id', 'sectionName', 'price']
            });

            const ticketTypes = buildTicketTypeSummary(tickets);
            return res.status(200).json({
                message: 'Ticket availability retrieved successfully',
                event: {
                    event_id: event.event_id,
                    title: event.title,
                    date: event.date,
                    venue: event.Venue ? {
                        venue_id: event.Venue.venue_id,
                        name: event.Venue.name,
                        location: event.Venue.location,
                        hasSections: event.Venue.hasSections
                    } : null
                },
                totalAvailable: tickets.length,
                ticketTypes
            });
        } catch (error) {
            console.error('Error fetching available tickets:', error);
            return res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }

    async getAvailabilitySummary(req, res) {
        try {
            const events = await Event.findAll({
                attributes: ['event_id', 'title', 'date', 'venue_id'],
                include: [{ model: Venue, as: 'Venue', attributes: ['venue_id', 'name', 'location', 'hasSections'] }]
            });

            const availabilityIndex = events.reduce((acc, event) => {
                acc[event.event_id] = {
                    event: {
                        event_id: event.event_id,
                        title: event.title,
                        date: event.date,
                        venue: event.Venue ? {
                            venue_id: event.Venue.venue_id,
                            name: event.Venue.name,
                            location: event.Venue.location,
                            hasSections: event.Venue.hasSections
                        } : null
                    },
                    totalAvailable: 0,
                    ticketTypes: []
                };
                return acc;
            }, {});

            const availableTickets = await Ticket.findAll({
                where: { status: 'available' },
                attributes: ['eventId', 'sectionName', 'price']
            });

            const groupedByEvent = {};
            availableTickets.forEach(ticket => {
                if (!groupedByEvent[ticket.eventId]) {
                    groupedByEvent[ticket.eventId] = [];
                }
                groupedByEvent[ticket.eventId].push(ticket);
            });

            Object.entries(groupedByEvent).forEach(([eventId, tickets]) => {
                if (!availabilityIndex[eventId]) {
                    return;
                }
                availabilityIndex[eventId].totalAvailable = tickets.length;
                availabilityIndex[eventId].ticketTypes = buildTicketTypeSummary(tickets);
            });

            const eventsAvailability = Object.values(availabilityIndex).filter(summary => summary.totalAvailable > 0);

            return res.status(200).json({
                message: 'Available tickets per event retrieved successfully',
                events: eventsAvailability
            });
        } catch (error) {
            console.error('Error generating availability summary:', error);
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

            const ticket = await Ticket.findByPk(ticketId, {
                include: [{ model: Event, as: 'Event' }]
            });
            if (!ticket) {
                return res.status(404).json({ error: 'Ticket not found' });
            }

            if (ticket.status !== 'available') {
                return res.status(400).json({ error: 'Ticket is not available' });
            }

            // Check if event end date has passed
            if (ticket.Event && ticket.Event.end_date) {
                const endDate = new Date(ticket.Event.end_date);
                const now = new Date();
                if (endDate < now) {
                    return res.status(400).json({ error: 'Ticket purchasing is no longer available. The event end date has passed.' });
                }
            }

            ticket.attendee_id = attendee_id;
            ticket.status = 'sold';
            await ticket.save();
            await adjustEventTicketAvailability(ticket.eventId, ticket.sectionName, -1);

            try {
                const event = await Event.findByPk(ticket.eventId, {
                    include: [{ model: Venue, as: 'Venue' }, { model: User, as: 'User' }]
                });

                if (event) {
                    await notificationService.createNotification({
                        user_id: attendee_id,
                        type: 'TICKET_BOOKED',
                        title: 'Ticket booked',
                        message: `Your ticket for ${event.title} has been booked.`,
                        data: { ticket_id: ticket.ticket_id, event_id: ticket.eventId, venue_id: ticket.venueId }
                    });

                    if (event.User && event.User.user_id) {
                        await notificationService.createNotification({
                            user_id: event.User.user_id,
                            type: 'TICKET_BOOKED_FOR_EVENT',
                            title: 'Ticket booked for your event',
                            message: `A ticket was booked for your event ${event.title}.`,
                            data: { ticket_id: ticket.ticket_id, event_id: ticket.eventId, attendee_id }
                        });
                    }
                }
            } catch (notifyError) {
                console.error('Failed to create ticket booking notifications:', notifyError);
            }

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

    async purchaseTicket(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const attendee_id = req.user?.user_id;
            const { eventId } = req.params;
            const { ticketType } = req.body || {};

            if (!attendee_id) {
                await transaction.rollback();
                return res.status(401).json({ error: 'Unauthorized: No user ID provided' });
            }

            if (!eventId) {
                await transaction.rollback();
                return res.status(400).json({ error: 'Event ID is required' });
            }

            const event = await Event.findByPk(eventId, {
                include: [{ model: Venue, as: 'Venue' }, { model: User, as: 'User' }]
            });

            if (!event) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Event not found' });
            }

            // Check if event end date has passed
            if (event.end_date) {
                const endDate = new Date(event.end_date);
                const now = new Date();
                if (endDate < now) {
                    await transaction.rollback();
                    return res.status(400).json({ error: 'Ticket purchasing is no longer available. The event end date has passed.' });
                }
            }

            const trimmedType = ticketType && ticketType.trim() !== '' ? ticketType.trim() : null;
            const whereClause = {
                eventId,
                status: 'available'
            };
            if (trimmedType) {
                whereClause.sectionName = trimmedType;
            }

            const ticket = await Ticket.findOne({
                where: whereClause,
                order: [['price', 'ASC']],
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!ticket) {
                await transaction.rollback();
                return res.status(404).json({ error: 'No available tickets for the selected type' });
            }

            ticket.attendee_id = attendee_id;
            ticket.status = 'sold';
            await ticket.save({ transaction });

            await transaction.commit();
            await adjustEventTicketAvailability(ticket.eventId, ticket.sectionName, -1);

            try {
                await notificationService.createNotification({
                    user_id: attendee_id,
                    type: 'TICKET_BOOKED',
                    title: 'Ticket booked',
                    message: `Your ticket for ${event.title} has been booked.`,
                    data: { ticket_id: ticket.ticket_id, event_id: ticket.eventId, venue_id: ticket.venueId }
                });

                if (event.User && event.User.user_id) {
                    await notificationService.createNotification({
                        user_id: event.User.user_id,
                        type: 'TICKET_BOOKED_FOR_EVENT',
                        title: 'Ticket booked for your event',
                        message: `A ticket was booked for your event ${event.title}.`,
                        data: { ticket_id: ticket.ticket_id, event_id: ticket.eventId, attendee_id }
                    });
                }
            } catch (notifyError) {
                console.error('Failed to create ticket booking notifications:', notifyError);
            }

            return res.status(200).json({
                message: 'Ticket purchased successfully',
                ticket: {
                    ticket_id: ticket.ticket_id,
                    eventId: ticket.eventId,
                    venueId: ticket.venueId,
                    sectionName: ticket.sectionName || 'General Admission',
                    price: ticket.price,
                    status: ticket.status,
                    qrCodeUrl: ticket.qrCodeUrl
                }
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error purchasing ticket:', error);
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
            await adjustEventTicketAvailability(ticket.eventId, ticket.sectionName, 1);

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