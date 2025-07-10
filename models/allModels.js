const {Sequelize, DataTypes} = require('sequelize');

module.exports = (sequelize) => {

    //User model
    const User = sequelize.define('User',{
        user_id:{type:DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey :true},
        email:{type:DataTypes.STRING, allowNull:false, unique:true},
        phone_number: { type: DataTypes.STRING },
        name: { type: DataTypes.STRING, allowNull: false },
        profile_photo: { type: DataTypes.STRING },
        role: {type: DataTypes.STRING,defaultValue: 'Attendee',allowNull: false,
             validate: {
             isIn: [['Attendee', 'Admin']]
            }
        },
        password: { type: DataTypes.STRING, allowNull: false },
        preferences: { type: DataTypes.JSON },

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

    }, { tableName: 'events' });

    //Venue model
    const Venue = sequelize.define('Venue', {
    venue_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    admin_id: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    location: { type: DataTypes.STRING, allowNull: false },
    map_data: { type: DataTypes.JSON },
    capacity: { type: DataTypes.INTEGER, allowNull: false },

    }, { tableName: 'venues' });

    //Section model
    const Section = sequelize.define('Section', {
        section_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        venue_id: { type: DataTypes.UUID, allowNull: false },
        parent_section_id: { type: DataTypes.UUID, allowNull: true },
        name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT },
        seat_map: { type: DataTypes.JSON }
    }, { tableName: 'sections' });

    //Seat model
    const Seat = sequelize.define('Seat', {
        seat_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        section_id: { type: DataTypes.UUID, allowNull: false },
        number: { type: DataTypes.INTEGER, allowNull: false },
        status: { 
            type: DataTypes.ENUM('Available', 'Unavailable', 'Sold Out', 'Selected'),
            defaultValue: 'Available'
        }
    }, { tableName: 'seats' });

    //TicketCategory model
    const TicketCategory = sequelize.define('TicketCategory', {
        category_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        event_id: { type: DataTypes.UUID, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: false },
        price: { type: DataTypes.INTEGER, allowNull: false },
        section_id: { type: DataTypes.UUID, allowNull: false }
    }, { tableName: 'ticket_categories' });

    //Ticket model
    const Ticket = sequelize.define('Ticket', {
        ticket_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        category_id: { type: DataTypes.UUID, allowNull: false },
        attendee_id: { type: DataTypes.UUID, allowNull: false },
        seat_id: { type: DataTypes.UUID, allowNull: false },
        qr_code: { type: DataTypes.STRING, allowNull: false, unique: true },
        status: { 
            type: DataTypes.ENUM('Active', 'Used', 'Refunded'),
            defaultValue: 'Active'
        }
    }, { tableName: 'tickets' });

  //Relationships
  User.hasMany(Event, { foreignKey: 'admin_id' });
  Event.belongsTo(User, { foreignKey: 'admin_id' });

  User.hasMany(Venue, { foreignKey: 'admin_id' });
  Venue.belongsTo(User, { foreignKey: 'admin_id' });

  // New relationships
  Venue.hasMany(Section, { foreignKey: 'venue_id' });
  Section.belongsTo(Venue, { foreignKey: 'venue_id' });

  Section.hasMany(Section, { foreignKey: 'parent_section_id', as: 'SubSections' });
  Section.belongsTo(Section, { foreignKey: 'parent_section_id', as: 'ParentSection' });

  Section.hasMany(Seat, { foreignKey: 'section_id' });
  Seat.belongsTo(Section, { foreignKey: 'section_id' });

  Event.hasMany(TicketCategory, { foreignKey: 'event_id' });
  TicketCategory.belongsTo(Event, { foreignKey: 'event_id' });

  Section.hasMany(TicketCategory, { foreignKey: 'section_id' });
  TicketCategory.belongsTo(Section, { foreignKey: 'section_id' });

  TicketCategory.hasMany(Ticket, { foreignKey: 'category_id' });
  Ticket.belongsTo(TicketCategory, { foreignKey: 'category_id' });

  User.hasMany(Ticket, { foreignKey: 'attendee_id' });
  Ticket.belongsTo(User, { foreignKey: 'attendee_id' });

  Seat.hasMany(Ticket, { foreignKey: 'seat_id' });
  Ticket.belongsTo(Seat, { foreignKey: 'seat_id' });

  return {
    User,
    Event,
    Venue,
    Section,
    Seat,
    TicketCategory,
    Ticket
  };
};