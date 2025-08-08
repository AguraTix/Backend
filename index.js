const express = require('express');
const {Sequelize} = require('sequelize');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');  
const session = require('express-session');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const venueRoutes = require('./routes/venueRoutes');
const eventRoutes = require('./routes/eventRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const seatRoutes = require('./routes/seatRoutes');
const ticketCategoryRoutes = require('./routes/ticketCategoryRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');
const foodRoutes = require('./routes/foodRoutes');

const passport = require('./middleware/passport');
const { sequelize } = require('./models');

require('dotenv').config();

const app = express();
app.use(express.json());

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// CORS configuration for development
const corsOptions = {
  origin: function (origin, callback) {
    console.log('CORS request from origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('Allowing request with no origin');
      return callback(null, true);
    }
    
    // Allow localhost origins for development
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:5173',
      'http://localhost:4173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:4173',
      'http://localhost:8080',
      'http://127.0.0.1:8080'
    ];
    
    if (allowedOrigins.includes(origin)) {
      console.log('Origin allowed:', origin);
      return callback(null, true);
    }
    
    // For development, allow all origins (remove this in production)
    console.log('Allowing all origins for development');
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  preflightContinue: false,
  maxAge: 86400 // Cache preflight response for 24 hours
};
app.use(cors(corsOptions));
// Note: Avoid app.options('*', ...) on Express 5; global CORS middleware handles preflight.

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
app.use('/api/seats', seatRoutes);
app.use('/api/ticket-categories', ticketCategoryRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/foods', foodRoutes);

app.use((err,req,res, next)=>{
    console.error('Error:', err.stack);
    res.status(500).json({error:'Internal server error'});
});

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));