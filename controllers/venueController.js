const models = require('../../backend/models/index'); // Import from app.js
const { Venue, User } = models;

class VenueController {
    constructor() {
        if (!Venue || !User) {
            console.error('Venue or User model is undefined. Check model initialization in app.js');
            throw new Error('Venue or User model is not properly initialized');
        }
    }

    async createVenue(req, res) {
        try {
            const { name, location, hasSections, capacity, sections } = req.body;
            const adminId = req.user?.user_id;

            if (!adminId) {
                return res.status(401).json({ error: 'Unauthorized: No user ID provided' });
            }
            if (!name || !location || !capacity) {
                return res.status(400).json({ error: 'Name, location, and capacity are required' });
            }

            console.log('Checking admin with ID:', adminId);
            const admin = await User.findByPk(adminId);
            if (!admin || admin.role !== 'Admin') {
                return res.status(403).json({ error: 'Only admins can create venues' });
            }

            if (hasSections) {
                if (!sections || !Array.isArray(sections) || sections.length === 0) {
                    return res.status(400).json({ error: 'Sections must be provided when hasSections is true' });
                }
                const totalSectionCapacity = sections.reduce((sum, section) => sum + (section.capacity || 0), 0);
                if (totalSectionCapacity !== capacity) {
                    return res.status(400).json({ error: 'Sum of section capacities must equal venue capacity' });
                }
            }

            console.log('Creating venue with data:', { name, location, hasSections, capacity, sections, admin_id: adminId });
            const venue = await Venue.create({
                name,
                location,
                hasSections: hasSections || false,
                capacity,
                sections: hasSections ? sections : [],
                admin_id: adminId
            });

            return res.status(201).json({
                message: 'Venue created successfully',
                venue
            });
        } catch (error) {
            console.error('Error creating venue:', error);
            return res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }

    async getAllVenues(req, res) {
        try {
            const venues = await Venue.findAll({
                include: [
                    {
                        model: User,
                        as: 'User',
                        attributes: ['user_id', 'name', 'email']
                    }
                ]
            });
            return res.status(200).json({
                message: 'Venues retrieved successfully',
                venues
            });
        } catch (error) {
            console.error('Error fetching venues:', error);
            return res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }

    async getVenueById(req, res) {
        try {
            const { venueId } = req.params;
            const venue = await Venue.findByPk(venueId, {
                include: [
                    {
                        model: User,
                        as: 'User',
                        attributes: ['user_id', 'name', 'email']
                    }
                ]
            });
            if (!venue) {
                return res.status(404).json({ error: 'Venue not found' });
            }
            return res.status(200).json({
                message: 'Venue retrieved successfully',
                venue
            });
        } catch (error) {
            console.error('Error fetching venue:', error);
            return res.status(500).json({ error: C });
        }
    }

    async updateVenue(req, res) {
        try {
            const { venueId } = req.params;
            const { name, location, hasSections, capacity, sections } = req.body;
            const adminId = req.user?.user_id;

            if (!adminId) {
                return res.status(401).json({ error: 'Unauthorized: No user ID provided' });
            }

            const venue = await Venue.findByPk(venueId);
            if (!venue) {
                return res.status(404).json({ error: 'Venue not found' });
            }

            if (venue.admin_id !== adminId) {
                return res.status(403).json({ error: 'Only the venue admin can update this venue' });
            }

            if (hasSections) {
                if (!sections || !Array.isArray(sections) || sections.length === 0) {
                    return res.status(400).json({ error: 'Sections must be provided when hasSections is true' });
                }
                const totalSectionCapacity = sections.reduce((sum, section) => sum + (section.capacity || 0), 0);
                if (totalSectionCapacity !== capacity) {
                    return res.status(400).json({ error: 'Sum of section capacities must equal venue capacity' });
                }
            }

            await venue.update({
                name,
                location,
                hasSections: hasSections || false,
                capacity,
                sections: hasSections ? sections : []
            });

            return res.status(200).json({
                message: 'Venue updated successfully',
                venue
            });
        } catch (error) {
            console.error('Error updating venue:', error);
            return res.status(400).json({ error: error.message });
        }
    }

    async deleteVenue(req, res) {
        try {
            const { venueId } = req.params;
            const adminId = req.user?.user_id;

            if (!adminId) {
                return res.status(401).json({ error: 'Unauthorized: No user ID provided' });
            }

            const venue = await Venue.findByPk(venueId);
            if (!venue) {
                return res.status(404).json({ error: 'Venue not found' });
            }

            if (venue.admin_id !== adminId) {
                return res.status(403).json({ error: 'Only the venue admin can delete this venue' });
            }

            await venue.destroy();
            return res.status(200).json({ message: 'Venue deleted successfully' });
        } catch (error) {
            console.error('Error deleting venue:', error);
            return res.status(400).json({ error: error.message });
        }
    }
}

module.exports = new VenueController();