const { Venue, User } = require('../models');

// Create a new venue (Admin only)
exports.createVenue = async (venueData, adminId) => {
    const admin = await User.findByPk(adminId);
    if (!admin || admin.role !== 'Admin') {
        throw new Error('Only admins can create venues');
    }

    const venue = await Venue.create({
        ...venueData,
        admin_id: adminId
    });

    return venue;
};

// Get all venues
exports.getAllVenues = async () => {
    const venues = await Venue.findAll({
        include: [{
            model: User,
            as: 'User',
            attributes: ['user_id', 'name', 'email']
        }]
    });
    return venues;
};

// Get venue by ID
exports.getVenueById = async (venueId) => {
    const venue = await Venue.findByPk(venueId, {
        include: [{
            model: User,
            as: 'User',
            attributes: ['user_id', 'name', 'email']
        }]
    });
    
    if (!venue) {
        throw new Error('Venue not found');
    }
    
    return venue;
};

// Update venue (Admin only - must be the venue's admin)
exports.updateVenue = async (venueId, updateData, adminId) => {
    const venue = await Venue.findByPk(venueId);
    if (!venue) {
        throw new Error('Venue not found');
    }

    if (venue.admin_id !== adminId) {
        throw new Error('Only the venue admin can update this venue');
    }

    await venue.update(updateData);
    return venue;
};

// Delete venue (Admin only - must be the venue's admin)
exports.deleteVenue = async (venueId, adminId) => {
    const venue = await Venue.findByPk(venueId);
    if (!venue) {
        throw new Error('Venue not found');
    }

    if (venue.admin_id !== adminId) {
        throw new Error('Only the venue admin can delete this venue');
    }

    await venue.destroy();
    return { message: 'Venue deleted successfully' };
}; 