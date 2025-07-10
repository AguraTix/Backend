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


  //Relationships
  User.hasMany(Event, { foreignKey: 'admin_id' });
  Event.belongsTo(User, { foreignKey: 'admin_id' });

  User.hasMany(Venue, { foreignKey: 'admin_id' });
  Venue.belongsTo(User, { foreignKey: 'admin_id' });

  Venue.hasMany(Event, { foreignKey: 'venue_id' });
  Event.belongsTo(Venue, { foreignKey: 'venue_id' });


    return {User,Venue,Event};
}