const express = require('express');
const {Sequelize} = require('sequelize');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');  
const session = require('express-session');
const userRoutes = require('./routes/userRoutes');
const venueRoutes = require('./routes/venueRoutes');
const eventRoutes = require('./routes/eventRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const seatRoutes = require('./routes/seatRoutes');
const ticketCategoryRoutes = require('./routes/ticketCategoryRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const cors = require('cors');

const passwordResetRoutes = require('./routes/passwordResetRoutes');
const googleRoutes = require('./routes/googleRoutes');



const passport = require('./middleware/passport');
const { sequelize } = require('./models');

require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Session configuration for Passport
app.use(session({ 
  secret: process.env.SESSION_SECRET || 'your-secret-key', 
  resave: false, 
  saveUninitialized: false 
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AGURA Ticketing App API',
      version: '1.0.0',
      description: 'API for AGURA Ticketing App',
    },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: []
      }
    ],
  },
  apis: ['./routes/*.js'],
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/api/users',userRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/sections', seatRoutes);
app.use('/api/ticket-categories', ticketCategoryRoutes);
app.use('/api/tickets', ticketRoutes);

app.use('/api/sections', sectionRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/ticket-categories', ticketCategoryRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/auth', googleRoutes);


app.use((err,req,res, next)=>{
    console.error('Error:', err.stack);
    res.status(500).json({error:'Internal server error'});
});

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));