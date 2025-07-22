const { Section, Venue, Seat } = require('../models');

// Create a new section
exports.createSection = async (sectionData, adminId) => {
    // Check if venue exists and belongs to admin
    const venue = await Venue.findByPk(sectionData.venue_id);
    if (!venue) {
        throw new Error('Venue not found');
    }
    if (venue.admin_id !== adminId) {
        throw new Error('Only the venue admin can create sections');
    }

    const section = await Section.create(sectionData);
    return section;
};

// Get all sections for a venue
exports.getSectionsByVenue = async (venueId) => {
    const sections = await Section.findAll({
        where: { venue_id: venueId },
        include: [
            {
                model: Section,
                as: 'SubSections',
                attributes: ['section_id', 'name', 'description']
            },
            {
                model: Seat,
                attributes: ['seat_id', 'number', 'status']
            }
        ]
    });
    return sections;
};

// Get section by ID
exports.getSectionById = async (sectionId) => {
    const section = await Section.findByPk(sectionId, {
        include: [
            {
                model: Section,
                as: 'SubSections',
                attributes: ['section_id', 'name', 'description']
            },
            {
                model: Seat,
                attributes: ['seat_id', 'number', 'status']
            }
        ]
    });
    
    if (!section) {
        throw new Error('Section not found');
    }
    
    return section;
};

// Update section
exports.updateSection = async (sectionId, updateData, adminId) => {
    const section = await Section.findByPk(sectionId);
    if (!section) {
        throw new Error('Section not found');
    }

    // Check if venue belongs to admin
    const venue = await Venue.findByPk(section.venue_id);
    if (venue.admin_id !== adminId) {
        throw new Error('Only the venue admin can update this section');
    }

    await section.update(updateData);
    return section;
};

// Delete section
exports.deleteSection = async (sectionId, adminId) => {
    const section = await Section.findByPk(sectionId);
    if (!section) {
        throw new Error('Section not found');
    }

    // Check if venue belongs to admin
    const venue = await Venue.findByPk(section.venue_id);
    if (venue.admin_id !== adminId) {
        throw new Error('Only the venue admin can delete this section');
    }

    await section.destroy();
    return { message: 'Section deleted successfully' };
}; 