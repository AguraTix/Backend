const {Sequelize, DataTypes} = require('sequelize');

module.exports = (sequelize) => {

    //User model
    const User = sequelize.define('User',{
        user_id:{type:DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey :true},
        email:{type:DataTypes.STRING, allowNull:false, unique:true},
        phone_number: { type: DataTypes.STRING },
        name: { type: DataTypes.STRING, allowNull: false },
        profile_photo: { type: DataTypes.STRING },
        role: { type: DataTypes.ENUM('Attendee', 'Admin'), defaultValue: 'Attendee' },
        password: { type: DataTypes.STRING, allowNull: false },
        preferences: { type: DataTypes.JSON },

    },{ tableName: 'users' });

    //Event model
    const Event = sequelize.define('Event', {
    event_id: { type: DataTypes.UUID,defaultValue: DataTypes.UUIDV4,primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    date_time: { type: DataTypes.DATE, allowNull: false },
    category: { type: DataTypes.STRING },
    artist_lineup: { type: DataTypes.JSON },
    promo_video_url: { type: DataTypes.STRING },

    }, { tableName: 'events' });

    //Venue model
    const Venue = sequelize.define('Venue', {
    venue_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    map_data: { type: DataTypes.JSON },
    capacity: { type: DataTypes.INTEGER, allowNull: false },

    }, { tableName: 'venues' });

    // Ticket model
    const Ticket = sequelize.define('Ticket', {
    ticket_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ticket_type: { type: DataTypes.ENUM('Regular', 'VIP', 'VVIP'), allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    seat_info: { type: DataTypes.JSON },
    qr_code: { type: DataTypes.STRING },
    purchase_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.ENUM('Active', 'Used', 'Refunded'), defaultValue: 'Active' },

    }, { tableName: 'tickets' });



  //Relationships
  User.hasMany(Event, { foreignKey: 'admin_id' });
  Event.belongsTo(User, { foreignKey: 'admin_id' });

  User.hasMany(Ticket, { foreignKey: 'attendee_id' });
  Ticket.belongsTo(User, { foreignKey: 'attendee_id' });

  User.hasMany(Ticket, { foreignKey: 'admin_id' });
  Ticket.belongsTo(User, { foreignKey: 'admin_id' });

  Event.hasMany(Ticket, { foreignKey: 'event_id' });
  Ticket.belongsTo(Event, { foreignKey: 'event_id' });

  Venue.hasMany(Event, { foreignKey: 'venue_id' });
  Event.belongsTo(Venue, { foreignKey: 'venue_id' });

    return {User,Venue,Event,Ticket};
}