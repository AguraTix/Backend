const { TicketCategory, Event, Section, Venue } = require('../models');

// Create a new ticket category
exports.createTicketCategory = async (categoryData, adminId) => {
    // Check if event exists and belongs to admin
    const event = await Event.findByPk(categoryData.event_id);
    if (!event) {
        throw new Error('Event not found');
    }
    if (event.admin_id !== adminId) {
        throw new Error('Only the event admin can create ticket categories');
    }

    // Check if section exists and belongs to the event's venue
    const section = await Section.findByPk(categoryData.section_id);
    if (!section) {
        throw new Error('Section not found');
    }
    if (section.venue_id !== event.venue_id) {
        throw new Error('Section does not belong to the event venue');
    }

    const category = await TicketCategory.create(categoryData);
    return category;
};

// Get all ticket categories for an event
exports.getTicketCategoriesByEvent = async (eventId) => {
    const categories = await TicketCategory.findAll({
        where: { event_id: eventId },
        include: [
            {
                model: Section,
                attributes: ['section_id', 'name', 'description']
            }
        ]
    });
    return categories;
};

// Get ticket category by ID
exports.getTicketCategoryById = async (categoryId) => {
    const category = await TicketCategory.findByPk(categoryId, {
        include: [
            {
                model: Event,
                attributes: ['event_id', 'title', 'date']
            },
            {
                model: Section,
                attributes: ['section_id', 'name', 'description']
            }
        ]
    });
    
    if (!category) {
        throw new Error('Ticket category not found');
    }
    
    return category;
};

// Update ticket category
exports.updateTicketCategory = async (categoryId, updateData, adminId) => {
    const category = await TicketCategory.findByPk(categoryId);
    if (!category) {
        throw new Error('Ticket category not found');
    }

    // Check if event belongs to admin
    const event = await Event.findByPk(category.event_id);
    if (event.admin_id !== adminId) {
        throw new Error('Only the event admin can update this ticket category');
    }

    await category.update(updateData);
    return category;
};

// Delete ticket category
exports.deleteTicketCategory = async (categoryId, adminId) => {
    const category = await TicketCategory.findByPk(categoryId);
    if (!category) {
        throw new Error('Ticket category not found');
    }

    // Check if event belongs to admin
    const event = await Event.findByPk(category.event_id);
    if (event.admin_id !== adminId) {
        throw new Error('Only the event admin can delete this ticket category');
    }

    await category.destroy();
    return { message: 'Ticket category deleted successfully' };
}; 