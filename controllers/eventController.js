const eventService = require('../services/eventService');
const { Event, Venue, User, Ticket } = require('../models');
const { v4: uuidv4 } = require('uuid');
const cloudinaryService = require('../services/cloudinaryService');
const notificationService = require('../services/notificationService');

async function uploadEventAsset(file, folder) {
  if (!file) return null;
  const uploadResult = await cloudinaryService.uploadToCloudinary(file.path, folder);
  cloudinaryService.deleteLocalFile(file.path);
  return {
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: uploadResult.secure_url,
    public_id: uploadResult.public_id,
    width: uploadResult.width,
    height: uploadResult.height,
  };
}

async function uploadGallery(files, folder) {
  if (!files || !files.length) return [];
  const uploads = await Promise.all(files.map(file => uploadEventAsset(file, folder)));
  return uploads.filter(Boolean);
}

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, end_date, venue_id, artist_lineup, tickets } = req.body;
    const eventImage = req.files?.event_image?.[0];
    const eventImages = req.files?.event_images || [];

    // Validate required fields
    if (!title || !date || !end_date || !venue_id) {
      return res.status(400).json({ error: 'Title, date, end_date, and venue_id are required' });
    }

    // Validate that end_date is after the event date
    const eventDate = new Date(date);
    const eventEndDate = new Date(end_date);
    if (eventEndDate <= eventDate) {
      return res.status(400).json({ error: 'End date must be after the event start date' });
    }

    // Validate venue_id
    const venue = await Venue.findByPk(venue_id);
    if (!venue) {
      return res.status(400).json({ error: 'Invalid venue_id' });
    }

    // Validate venue sections structure if venue has sections
    if (venue.hasSections) {
      if (!venue.sections || !Array.isArray(venue.sections) || venue.sections.length === 0) {
        return res.status(400).json({ error: 'Venue has sections enabled but no sections are defined' });
      }
      
      for (const section of venue.sections) {
        if (!section.name || !section.capacity) {
          return res.status(400).json({ error: 'Each venue section must have a name and capacity' });
        }
        if (typeof section.capacity !== 'number' || section.capacity <= 0) {
          return res.status(400).json({ error: 'Section capacity must be a positive number' });
        }
      }
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

    parsedTickets = parsedTickets.map(ticket => {
      const price = Number(ticket.price);
      const quantity = Number.isInteger(ticket.quantity) ? ticket.quantity : parseInt(ticket.quantity, 10);
      const safeQuantity = Number.isInteger(quantity) && quantity > 0 ? quantity : 0;

      const rawAvailable = typeof ticket.availableTickets === 'number'
        ? ticket.availableTickets
        : (typeof ticket.available === 'number' ? ticket.available : safeQuantity);

      const safeAvailable = Math.min(Math.max(rawAvailable, 0), safeQuantity);

      return {
        type: ticket.type?.trim(),
        price: Number.isFinite(price) ? price : 0,
        quantity: safeQuantity,
        available: safeAvailable,
        availableTickets: safeAvailable
      };
    });

    // Validate tickets based on venue configuration
    if (venue.hasSections) {
      // For venues with sections, validate that ticket types match section names
      const sectionNames = venue.sections.map(section => section.name);
      const ticketTypeNames = parsedTickets.map(ticket => ticket.type);
      
      // Check if all ticket types correspond to existing sections
      for (const ticket of parsedTickets) {
        if (!sectionNames.includes(ticket.type)) {
          return res.status(400).json({ 
            error: `Invalid ticket type: ${ticket.type}. Must match one of the venue sections: ${sectionNames.join(', ')}` 
          });
        }
      }
      
      // Check if all sections have corresponding ticket types
      for (const sectionName of sectionNames) {
        if (!ticketTypeNames.includes(sectionName)) {
          return res.status(400).json({ 
            error: `Missing ticket type for section: ${sectionName}. All venue sections must have corresponding ticket types.` 
          });
        }
      }
      
      // Validate ticket quantities against section capacities
      for (const ticket of parsedTickets) {
        const correspondingSection = venue.sections.find(section => section.name === ticket.type);
        if (ticket.quantity > correspondingSection.capacity) {
          return res.status(400).json({ 
            error: `Ticket quantity (${ticket.quantity}) for ${ticket.type} exceeds section capacity (${correspondingSection.capacity})` 
          });
        }
        if (typeof ticket.price !== 'number' || ticket.price < 0) {
          return res.status(400).json({ error: 'Ticket price must be a non-negative number' });
        }
        if (typeof ticket.quantity !== 'number' || ticket.quantity < 0 || !Number.isInteger(ticket.quantity)) {
          return res.status(400).json({ error: 'Ticket quantity must be a non-negative integer' });
        }
      }
    } else {
      // For venues without sections, allow flexible ticket naming but validate constraints
      for (const ticket of parsedTickets) {
        if (!ticket.type) {
          return res.status(400).json({ error: 'Each ticket must include a type name' });
        }
        if (typeof ticket.price !== 'number' || ticket.price < 0) {
          return res.status(400).json({ error: 'Ticket price must be a non-negative number' });
        }
        if (typeof ticket.quantity !== 'number' || ticket.quantity < 0 || !Number.isInteger(ticket.quantity)) {
          return res.status(400).json({ error: 'Ticket quantity must be a non-negative integer' });
        }

        const rawAvailable = typeof ticket.availableTickets === 'number'
          ? ticket.availableTickets
          : (typeof ticket.available === 'number' ? ticket.available : ticket.quantity);
        const safeAvailable = Math.min(Math.max(rawAvailable, 0), ticket.quantity);

        ticket.available = safeAvailable;
        ticket.availableTickets = safeAvailable;
      }

      const totalTickets = parsedTickets.reduce((sum, t) => sum + t.quantity, 0);
      if (totalTickets > venue.capacity) {
        return res.status(400).json({ 
          error: `Total ticket quantity (${totalTickets}) exceeds venue capacity (${venue.capacity})` 
        });
      }
    }

    // Process event_image
    const uploadedMainImage = await uploadEventAsset(eventImage, 'agura/events/main');
    const imageUrl = uploadedMainImage ? uploadedMainImage.path : null;

    // Process event_images
    const eventImagesData = await uploadGallery(eventImages, 'agura/events/gallery');

    // Create event
    const event = await Event.create({
      title,
      description,
      date,
      end_date,
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

    try {
      await notificationService.createNotification({
        user_id: req.user.user_id,
        type: 'EVENT_CREATED',
        title: 'Event created',
        message: `You created event ${event.title} at ${venue.name}.`,
        data: { event_id: event.event_id, venue_id: venue.venue_id }
      });
    } catch (notifyError) {
      console.error('Failed to create event notification:', notifyError);
    }

    // Prepare response (include image paths for frontend)
    const responseEvent = {
      event_id: event.event_id,
      title: event.title,
      description: event.description,
      date: event.date,
      end_date: event.end_date,
      venue_id: event.venue_id,
      artist_lineup: event.artist_lineup,
      event_images: event.event_images.map(img => ({
        filename: img.filename,
        originalname: img.originalname,
        mimetype: img.mimetype,
        size: img.size,
        path: img.path && !img.path.startsWith('http')
          ? `${req.protocol}://${req.get('host')}${img.path}`
          : img.path
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
      const sectionTicketType = ticketTypes.find(t => t.type === section.name);
      if (!sectionTicketType) {
        console.warn(`No ticket type found for section: ${section.name}`);
        continue;
      }

      // Generate tickets up to the specified quantity, but not exceeding section capacity
      const ticketsToGenerate = Math.min(sectionTicketType.quantity, section.capacity);
      
      for (let i = 1; i <= ticketsToGenerate; i++) {
        tickets.push({
          ticket_id: uuidv4(),
          eventId: event.event_id,
          venueId: venue.venue_id,
          sectionName: section.name,
          seatNumber: `${section.name}-${i}`,
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
          sectionName: ticketType.type || null,
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
        const userId = req.user?.user_id;
        const userRole = req.user?.role;
        const events = await eventService.getAllEvents(userId, userRole);
        
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
        const userId = req.user?.user_id;
        const userRole = req.user?.role;
        const event = await eventService.getEventById(eventId, userId, userRole);
        
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
        const { title, description, date, end_date, venue_id, artist_lineup } = req.body;
        const adminId = req.user.user_id;

        // Validate end_date if provided
        if (end_date) {
            const eventDate = date ? new Date(date) : null;
            const eventEndDate = new Date(end_date);
            
            // If both date and end_date are provided, validate end_date is after date
            if (eventDate && eventEndDate <= eventDate) {
                return res.status(400).json({ error: 'End date must be after the event start date' });
            }
            
            // If only end_date is provided, check against existing event date
            if (!eventDate) {
                const existingEvent = await Event.findByPk(eventId);
                if (existingEvent && eventEndDate <= new Date(existingEvent.date)) {
                    return res.status(400).json({ error: 'End date must be after the event start date' });
                }
            }
        }

        // Handle main event image
        let uploadedMainImageUrl;
        if (req.files && req.files.event_image && req.files.event_image[0]) {
            const uploadedMain = await uploadEventAsset(req.files.event_image[0], 'agura/events/main');
            uploadedMainImageUrl = uploadedMain ? uploadedMain.path : null;
        }

        // Handle additional event images
        let uploadedEventImages;
        if (req.files && req.files.event_images && req.files.event_images.length > 0) {
            uploadedEventImages = await uploadGallery(req.files.event_images, 'agura/events/gallery');
        }

        // Parse artist_lineup if it's a string
        let parsedArtistLineup = artist_lineup;
        if (typeof artist_lineup === 'string') {
            try {
                parsedArtistLineup = JSON.parse(artist_lineup);
            } catch (parseError) {
                parsedArtistLineup = artist_lineup
                .split(',')
                .map(name => name.trim());
            }
        }

        const updateData = {
            title,
            description,
            date,
            venue_id,
        };

        if (end_date !== undefined) {
            updateData.end_date = end_date;
        }

        if (parsedArtistLineup !== undefined) {
            updateData.artist_lineup = parsedArtistLineup;
        }
        if (uploadedEventImages) {
            updateData.event_images = uploadedEventImages;
        }
        if (uploadedMainImageUrl !== undefined) {
            updateData.image_url = uploadedMainImageUrl;
        }

        const event = await eventService.updateEvent(eventId, updateData, adminId);
        
        res.status(200).json({
            message: 'Event updated successfully',
            event: {
                ...event.toJSON(),
                event_images: uploadedEventImages ? uploadedEventImages.map(img => ({
                    ...img,
                    path: img.path && !img.path.startsWith('http') 
                        ? `${req.protocol}://${req.get('host')}${img.path}` 
                        : img.path
                })) : (event.event_images ? event.event_images.map(img => ({
                    ...img,
                    path: img.path && !img.path.startsWith('http') 
                        ? `${req.protocol}://${req.get('host')}${img.path}` 
                        : img.path
                })) : []),
                image_url: uploadedMainImageUrl !== undefined
                    ? (uploadedMainImageUrl && !uploadedMainImageUrl.startsWith('http')
                        ? `${req.protocol}://${req.get('host')}${uploadedMainImageUrl}`
                        : uploadedMainImageUrl)
                    : (event.image_url && !event.image_url.startsWith('http') 
                        ? `${req.protocol}://${req.get('host')}${event.image_url}` 
                        : event.image_url),
                image_count: uploadedEventImages ? uploadedEventImages.length : (event.event_images ? event.event_images.length : 0)
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