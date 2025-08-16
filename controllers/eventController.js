const eventService = require('../services/eventService');
const { Event, Venue, User, Ticket } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, venue_id, artist_lineup, tickets } = req.body;
    const eventImage = req.files?.event_image?.[0];
    const eventImages = req.files?.event_images || [];

    // Validate required fields
    if (!title || !date || !venue_id) {
      return res.status(400).json({ error: 'Title, date, and venue_id are required' });
    }

    // Validate venue_id
    const venue = await Venue.findByPk(venue_id);
    if (!venue) {
      return res.status(400).json({ error: 'Invalid venue_id' });
    }

    // Parse artist_lineup
    let parsedArtistLineup = artist_lineup;
    if (typeof artist_lineup === 'string') {
      try {
        parsedArtistLineup = JSON.parse(artist_lineup);
      } catch (error) {
        parsedArtistLineup = artist_lineup.split(',').map(item => item.trim());
      }
    }

    // Parse tickets
    let parsedTickets = [];
    if (typeof tickets === 'string') {
      try {
        parsedTickets = JSON.parse(tickets);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid tickets format' });
      }
    } else if (Array.isArray(tickets)) {
      parsedTickets = tickets;
    }

    // Validate tickets
    const validTicketTypes = ['Regular', 'VIP', 'VVIP'];
    for (const ticket of parsedTickets) {
      if (!validTicketTypes.includes(ticket.type)) {
        return res.status(400).json({ error: `Invalid ticket type: ${ticket.type}. Must be Regular, VIP, or VVIP` });
      }
      if (typeof ticket.price !== 'number' || ticket.price < 0) {
        return res.status(400).json({ error: 'Ticket price must be a non-negative number' });
      }
      if (typeof ticket.quantity !== 'number' || ticket.quantity < 0 || !Number.isInteger(ticket.quantity)) {
        return res.status(400).json({ error: 'Ticket quantity must be a non-negative integer' });
      }
    }

    // Process event_image
    let imageUrl = null;
    if (eventImage) {
      imageUrl = `/uploads/events/${eventImage.filename}`;
    }

    // Process event_images
    const eventImagesData = eventImages.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/events/${file.filename}`
    }));

    // Create event
    const event = await Event.create({
      title,
      description,
      date,
      venue_id,
      admin_id: req.user.user_id,
      artist_lineup: parsedArtistLineup,
      event_images: eventImagesData,
      image_url: imageUrl,
      tickets: parsedTickets
    });

    // Generate physical tickets based on venue configuration and ticket types
    const generatedTickets = await generatePhysicalTickets(event, venue, parsedTickets);
    await Ticket.bulkCreate(generatedTickets);

    // Prepare response (include image paths for frontend)
    const responseEvent = {
      event_id: event.event_id,
      title: event.title,
      description: event.description,
      date: event.date,
      venue_id: event.venue_id,
      artist_lineup: event.artist_lineup,
      event_images: event.event_images.map(img => ({
        filename: img.filename,
        originalname: img.originalname,
        mimetype: img.mimetype,
        size: img.size,
        path: `${req.protocol}://${req.get('host')}${img.path}`
      })),
      image_count: event.event_images.length,
      image_url: event.image_url ? `${req.protocol}://${req.get('host')}${event.image_url}` : null,
      tickets: event.tickets,
      ticketsCreated: generatedTickets.length
    };

    res.status(201).json({
      message: 'Event created successfully',
      event: responseEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to generate physical tickets
async function generatePhysicalTickets(event, venue, ticketTypes) {
  const tickets = [];

  if (venue.hasSections) {
    // Generate tickets for each section based on ticket types
    for (const section of venue.sections) {
      const sectionTicketType = ticketTypes.find(t => t.type.toLowerCase() === section.name.toLowerCase());
      if (!sectionTicketType) continue; // Skip if no matching ticket type

      for (let i = 1; i <= sectionTicketType.quantity; i++) {
        if (i > section.capacity) break; // Respect section capacity
        tickets.push({
          ticket_id: uuidv4(),
          eventId: event.event_id,
          venueId: venue.venue_id,
          sectionName: section.name,
          seatNumber: `S${i}`,
          price: sectionTicketType.price,
          status: 'available'
        });
      }
    }
  } else {
    // Generate general admission tickets based on ticket types
    for (const ticketType of ticketTypes) {
      for (let i = 1; i <= ticketType.quantity; i++) {
        if (i > venue.capacity) break; // Respect venue capacity
        tickets.push({
          ticket_id: uuidv4(),
          eventId: event.event_id,
          venueId: venue.venue_id,
          sectionName: null,
          seatNumber: null,
          price: ticketType.price,
          status: 'available'
        });
      }
    }
  }

  return tickets;
}

// Get all events
exports.getAllEvents = async (req, res) => {
    try {
        const events = await eventService.getAllEvents();
        
        // Process events to ensure proper image URLs
        const processedEvents = events.map(event => {
            const eventData = event.toJSON();
            
            // Ensure image_url has full path if it exists
            if (eventData.image_url && !eventData.image_url.startsWith('http')) {
                eventData.image_url = `${req.protocol}://${req.get('host')}${eventData.image_url}`;
            }
            
            // Process event_images array
            if (eventData.event_images && Array.isArray(eventData.event_images)) {
                eventData.event_images = eventData.event_images.map(img => ({
                    ...img,
                    path: img.path && !img.path.startsWith('http') 
                        ? `${req.protocol}://${req.get('host')}${img.path}` 
                        : img.path
                }));
            }
            
            return eventData;
        });
        
        res.status(200).json({
            message: 'Events retrieved successfully',
            events: processedEvents
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

// Get recent events with pagination and filtering
exports.getRecentEvents = async (req, res) => {
    try {
        const { limit = 10, offset = 0, upcomingOnly = 'true' } = req.query;
        
        // Validate query parameters
        const parsedLimit = Math.min(parseInt(limit), 50); // Max 50 events per request
        const parsedOffset = Math.max(parseInt(offset), 0);
        const parsedUpcomingOnly = upcomingOnly === 'true';
        
        const result = await eventService.getRecentEvents(parsedLimit, parsedOffset, parsedUpcomingOnly);
        
        // Process events to ensure proper image URLs
        const processedEvents = result.events.map(event => {
            const eventData = event.toJSON();
            
            // Ensure image_url has full path if it exists
            if (eventData.image_url && !eventData.image_url.startsWith('http')) {
                eventData.image_url = `${req.protocol}://${req.get('host')}${eventData.image_url}`;
            }
            
            // Process event_images array
            if (eventData.event_images && Array.isArray(eventData.event_images)) {
                eventData.event_images = eventData.event_images.map(img => ({
                    ...img,
                    path: img.path && !img.path.startsWith('http') 
                        ? `${req.protocol}://${req.get('host')}${img.path}` 
                        : img.path
                }));
            }
            
            return eventData;
        });
        
        res.status(200).json({
            message: 'Recent events retrieved successfully',
            events: processedEvents,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Error fetching recent events:', error);
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
        
        // Process event to ensure proper image URLs
        const eventData = event.toJSON();
        
        // Ensure image_url has full path if it exists
        if (eventData.image_url && !eventData.image_url.startsWith('http')) {
            eventData.image_url = `${req.protocol}://${req.get('host')}${eventData.image_url}`;
        }
        
        // Process event_images array
        if (eventData.event_images && Array.isArray(eventData.event_images)) {
            eventData.event_images = eventData.event_images.map(img => ({
                ...img,
                path: img.path && !img.path.startsWith('http') 
                    ? `${req.protocol}://${req.get('host')}${img.path}` 
                    : img.path
            }));
        }
        
        res.status(200).json({
            message: 'Event retrieved successfully',
            event: eventData
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
                filename: file.filename,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                path: `/uploads/events/${file.filename}`
            };
        }

        // Handle additional event images
        let eventImages = null;
        if (req.files && req.files.event_images && req.files.event_images.length > 0) {
            eventImages = req.files.event_images.map(file => ({
                filename: file.filename,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                path: `/uploads/events/${file.filename}`
            }));
        }

        // Parse artist_lineup if it's a string
        let parsedArtistLineup = artist_lineup;
        if (typeof artist_lineup === 'string') {
            try {
                parsedArtistLineup = JSON.parse(artist_lineup);
            } catch (parseError) {
                parsedArtistLineup = artist_lineupffee
                .split(',')
                .map(name => name.trim());
            }
        }

        const updateData = {
            title,
            description,
            date,
            venue_id,
            artist_lineup: parsedArtistLineup,
            event_images: eventImages,
            image_url: eventImage ? eventImage.path : undefined
        };

        const event = await eventService.updateEvent(eventId, updateData, adminId);
        
        res.status(200).json({
            message: 'Event updated successfully',
            event: {
                ...event.toJSON(),
                event_images: eventImages ? eventImages.map(img => ({
                    filename: img.filename,
                    originalname: img.originalname,
                    mimetype: img.mimetype,
                    size: img.size,
                    path: `${req.protocol}://${req.get('host')}${img.path}`
                })) : (event.event_images ? event.event_images.map(img => ({
                    ...img,
                    path: img.path && !img.path.startsWith('http') 
                        ? `${req.protocol}://${req.get('host')}${img.path}` 
                        : img.path
                })) : []),
                image_url: eventImage ? `${req.protocol}://${req.get('host')}${eventImage.path}` : 
                    (event.image_url && !event.image_url.startsWith('http') 
                        ? `${req.protocol}://${req.get('host')}${event.image_url}` 
                        : event.image_url),
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
        
        // Process events to ensure proper image URLs
        const processedEvents = events.map(event => {
            const eventData = event.toJSON();
            
            // Ensure image_url has full path if it exists
            if (eventData.image_url && !eventData.image_url.startsWith('http')) {
                eventData.image_url = `${req.protocol}://${req.get('host')}${eventData.image_url}`;
            }
            
            // Process event_images array
            if (eventData.event_images && Array.isArray(eventData.event_images)) {
                eventData.event_images = eventData.event_images.map(img => ({
                    ...img,
                    path: img.path && !img.path.startsWith('http') 
                        ? `${req.protocol}://${req.get('host')}${img.path}` 
                        : img.path
                }));
            }
            
            return eventData;
        });
        
        res.json({
            message: 'Events retrieved successfully',
            events: processedEvents
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

        // Process event images to ensure proper URLs
        let processedEventImages = [];
        if (event.event_images && Array.isArray(event.event_images)) {
            processedEventImages = event.event_images.map(img => ({
                ...img,
                path: img.path && !img.path.startsWith('http') 
                    ? `${req.protocol}://${req.get('host')}${img.path}` 
                    : img.path
            }));
        }

        let processedImageUrl = event.image_url;
        if (processedImageUrl && !processedImageUrl.startsWith('http')) {
            processedImageUrl = `${req.protocol}://${req.get('host')}${processedImageUrl}`;
        }

        res.json({
            message: 'Event images retrieved successfully',
            event_id: eventId,
            event_images: processedEventImages,
            image_url: processedImageUrl,
            image_count: processedEventImages.length
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};