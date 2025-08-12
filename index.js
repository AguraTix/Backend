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
const path = require('path');
const fs = require('fs');

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
    
    // Allow localhost origins for development and production frontend
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
      'http://127.0.0.1:8080',
      'https://agura-web-v-1.vercel.app',
      'https://agura-web-v-1.vercel.app/'
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
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400
};
app.use(cors(corsOptions));

// Session configuration for Passport
app.use(session({ 
  secret: process.env.SESSION_SECRET || 'your-secret-key', 
  resave: false, 
  saveUninitialized: false 
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath, stat) => {
    // Set CORS headers for static files
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, HEAD');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // Set cache headers for images
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.png') || filePath.endsWith('.gif') || filePath.endsWith('.webp')) {
      res.set('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

// Add specific route for image retrieval with better error handling
app.get('/uploads/:type/:filename', (req, res) => {
  const { type, filename } = req.params;
  const filePath = path.join(__dirname, 'uploads', type, filename);
  
  // Log image requests for debugging
  console.log(`Image request: ${type}/${filename}`);
  console.log(`Full path: ${filePath}`);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`Image not found: ${filePath}`);
    return res.status(404).json({ 
      error: 'Image not found',
      path: `${type}/${filename}`,
      message: 'The requested image could not be found on the server'
    });
  }
  
  // Set proper headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, HEAD');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Send the file
  res.sendFile(filePath);
});

// Test endpoint to verify image serving
app.get('/test-images', (req, res) => {
  const uploadsDir = path.join(__dirname, 'uploads');
  const eventsDir = path.join(uploadsDir, 'events');
  const foodsDir = path.join(uploadsDir, 'foods');
  
  try {
    const events = fs.readdirSync(eventsDir);
    const foods = fs.readdirSync(foodsDir);
    
    res.json({
      message: 'Image directories status',
      uploads: {
        exists: fs.existsSync(uploadsDir),
        path: uploadsDir
      },
      events: {
        exists: fs.existsSync(eventsDir),
        path: eventsDir,
        files: events.slice(0, 5)
      },
      foods: {
        exists: fs.existsSync(foodsDir),
        path: foodsDir,
        files: foods.slice(0, 5)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error reading uploads directory',
      message: error.message
    });
  }
});

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

// Safe config log to verify .env is loaded (no secrets printed)
console.log('Configuration loaded:', {
  appName: process.env.APP_NAME || 'GloriaAppPassword',
  port: process.env.PORT || 3000,
  smtpHost: process.env.SMTP_HOST ? 'set' : 'not set',
  smtpPort: process.env.SMTP_PORT || 'default 587',
  emailFrom: process.env.EMAIL_FROM || 'gloriantwari@gmail.com',
  resetCodeSendTo: process.env.RESET_CODE_SEND_TO || 'not set',
});

app.use('/api/users', userRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/ticket-categories', ticketCategoryRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/foods', foodRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));