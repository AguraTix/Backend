const {Sequelize, DataTypes} = require('sequelize');
const QRCode = require('qrcode');

module.exports = (sequelize) => {

    //User model
    const User = sequelize.define('User',{
        user_id:{type:DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey :true},
        email:{type:DataTypes.STRING, allowNull:false, unique:true},
        phone_number: { type: DataTypes.STRING, unique: true },
        name: { type: DataTypes.STRING, allowNull: false },
        profile_photo: { type: DataTypes.STRING },
        email_verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        email_verified_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        role: {type: DataTypes.STRING,defaultValue: 'Attendee',allowNull: false,
             validate: {
             isIn: [['Attendee', 'Admin', 'SuperAdmin']]
            }
        },
        password: { 
            type: DataTypes.STRING, 
            allowNull: false
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        created_by: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'users',
                key: 'user_id'
            }
        },
        preferences: { type: DataTypes.JSON },
        verificationCode: { 
            type: DataTypes.STRING, 
            allowNull: true 
        },
        codeExpiresAt: { 
            type: DataTypes.DATE, 
            allowNull: true 
        }

    },{ tableName: 'users' });

    //Event model
    const Event = sequelize.define('Event', {
    event_id: { type: DataTypes.UUID,defaultValue: DataTypes.UUIDV4,primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    date: { type: DataTypes.DATE, allowNull: false },
    venue_id: { type: DataTypes.UUID, allowNull: false },
    admin_id: { type: DataTypes.UUID, allowNull: false },
    artist_lineup: { type: DataTypes.JSON },
    event_images: { type: DataTypes.JSON, allowNull: true }, // Store event image data
    image_url: { type: DataTypes.TEXT, allowNull: true },
    tickets: {type: DataTypes.JSONB,allowNull: true
    }

    }, { tableName: 'events' });

    //Venue model
    const Venue = sequelize.define('Venue', {
        venue_id: { 
            type: DataTypes.UUID, 
            defaultValue: DataTypes.UUIDV4, 
            primaryKey: true 
        },
        name: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },
        location: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },
        hasSections: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        capacity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1
            }
        },
        sections: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
            validate: {
                isValidSections(value) {
                    if (this.hasSections && (!value || !Array.isArray(value) || value.length === 0)) {
                        throw new Error('Sections must be provided when hasSections is true');
                    }
                    if (this.hasSections) {
                        const totalSectionCapacity = value.reduce((sum, section) => sum + (section.capacity || 0), 0);
                        if (totalSectionCapacity !== this.capacity) {
                            throw new Error('Sum of section capacities must equal venue capacity');
                        }
                    }
                }
            }
        },
        admin_id: { 
            type: DataTypes.UUID, 
            allowNull: false,
            references: {
                model: 'users',
                key: 'user_id'
            }
        }
    }, { 
        tableName: 'venues',
        timestamps: true,
        underscored: true
    });



    //Ticket model
     // Ticket model (unchanged)
    const Ticket = sequelize.define('Ticket', {
        ticket_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        eventId: { 
            type: DataTypes.UUID, 
            allowNull: false,
            references: {
                model: 'events',
                key: 'event_id'
            }
        },
        venueId: { 
            type: DataTypes.UUID, 
            allowNull: false,
            references: {
                model: 'venues',
                key: 'venue_id'
            }
        },
        sectionName: { 
            type: DataTypes.STRING, 
            allowNull: true 
        },
        seatNumber: { 
            type: DataTypes.STRING, 
            allowNull: true 
        },
        price: { 
            type: DataTypes.FLOAT, 
            allowNull: false,
            validate: { min: 0 }
        },
        status: { 
            type: DataTypes.ENUM('available', 'reserved', 'sold', 'used', 'cancelled'),
            defaultValue: 'available'
        },
        attendee_id: { 
            type: DataTypes.UUID, 
            allowNull: true,
            references: { model: 'users', key: 'user_id' }
        },
        qrCode: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        purchaseDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        qrCodeUrl: {
            type: DataTypes.VIRTUAL,
            get() {
                if (!this.qrCode) return null;
                return `/api/tickets/${this.ticket_id}/qrcode`;
            }
        }
    }, { 
        tableName: 'tickets',
        hooks: {
            beforeCreate: async (ticket) => {
                if (ticket.status === 'sold' && !ticket.qrCode) {
                    await ticket.generateQRCode();
                }
            },
            beforeUpdate: async (ticket, { fields }) => {
                if (fields.includes('status') && ticket.status === 'sold' && !ticket.qrCode) {
                    await ticket.generateQRCode();
                }
            }
        }
    });

    Ticket.prototype.generateQRCode = async function() {
        try {
            const qrData = {
                ticketId: this.ticket_id,
                eventId: this.eventId,
                venueId: this.venueId,
                section: this.sectionName,
                seat: this.seatNumber,
                price: this.price,
                purchaseDate: new Date().toISOString()
            };

            const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
                errorCorrectionLevel: 'H',
                type: 'image/png',
                margin: 2,
                scale: 8
            });

            this.qrCode = qrCodeDataUrl;
            this.purchaseDate = new Date();
            
            return qrCodeDataUrl;
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw new Error('Failed to generate QR code');
        }
    };

    const Food = sequelize.define('Food', {
        food_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        foodname: {
            type: DataTypes.STRING,
            allowNull: false
        },
        foodimage: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        foodprice: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0.0
        },
        fooddescription: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        event_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        admin_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'user_id'
            }
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'createdat'
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'updatedat'
        }
    }, {
        tableName: 'foods'
    });

    // New FoodOrder model for food ordering system
    const FoodOrder = sequelize.define('FoodOrder', {
        order_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        user_id: { 
            type: DataTypes.UUID, 
            allowNull: false,
            references: {
                model: 'users',
                key: 'user_id'
            }
        },
        food_id: { 
            type: DataTypes.UUID, 
            allowNull: false,
            references: {
                model: 'foods',
                key: 'food_id'
            }
        },
        event_id: { 
            type: DataTypes.UUID, 
            allowNull: false,
            references: {
                model: 'events',
                key: 'event_id'
            }
        },
        order_status: { 
            type: DataTypes.ENUM('Pending', 'Confirmed','Cancelled'),
            defaultValue: 'Pending'
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'createdat'
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'updatedat'
        }
    }, { 
        tableName: 'food_orders',
        indexes: [
            {
                fields: ['user_id']
            },
            {
                fields: ['event_id']
            },
            {
                fields: ['order_status']
            },
            {
                fields: ['createdAt']
            }
        ]
    });

    // Self-referencing association for User (SuperAdmin creates Admins)
    User.hasMany(User, { foreignKey: 'created_by', as: 'CreatedAdmins' });
    User.belongsTo(User, { foreignKey: 'created_by', as: 'Creator' });

    User.hasMany(Event, { foreignKey: 'admin_id' });
    Event.belongsTo(User, { foreignKey: 'admin_id', as: 'User' });

    User.hasMany(Venue, { foreignKey: 'admin_id' });
    Venue.belongsTo(User, { foreignKey: 'admin_id', as: 'User' });

    User.hasMany(Food,{foreignKey: 'admin_id'});
    Food.belongsTo(User, { foreignKey: 'admin_id', as: 'User'});

    // Add association between Food and Event
    Event.hasMany(Food, { foreignKey: 'event_id', as: 'Foods' });
    Food.belongsTo(Event, { foreignKey: 'event_id', as: 'Event' });

    // New associations for FoodOrder
    User.hasMany(FoodOrder, { foreignKey: 'user_id', as: 'FoodOrders' });
    FoodOrder.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
    
    Food.hasMany(FoodOrder, { foreignKey: 'food_id', as: 'FoodOrders' });
    FoodOrder.belongsTo(Food, { foreignKey: 'food_id', as: 'Food' });
    
    Event.hasMany(FoodOrder, { foreignKey: 'event_id', as: 'FoodOrders' });
    FoodOrder.belongsTo(Event, { foreignKey: 'event_id', as: 'Event' });

    Venue.hasMany(Event, { foreignKey: 'venue_id' });
    Event.belongsTo(Venue, { foreignKey: 'venue_id', as: 'Venue' });


    Event.hasMany(Ticket, { foreignKey: 'eventId' });
    Ticket.belongsTo(Event, { foreignKey: 'eventId' });

    Venue.hasMany(Ticket, { foreignKey: 'venueId' });
    Ticket.belongsTo(Venue, { foreignKey: 'venueId' });

    User.hasMany(Ticket, { foreignKey: 'attendee_id' });
    Ticket.belongsTo(User, { foreignKey: 'attendee_id', as: 'User' });

    // Notification model
    const Notification = sequelize.define('Notification', {
        notification_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'user_id'
            }
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        data: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        is_read: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        tableName: 'notifications',
        timestamps: true
    });

    User.hasMany(Notification, { foreignKey: 'user_id', as: 'Notifications' });
    Notification.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

    return {
        User,
        Event,
        Venue,
        Ticket,
        Food,
        FoodOrder,
        Notification
    };

};