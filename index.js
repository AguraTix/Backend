const express = require('express');
const {Sequelize} = require('sequelize');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const userRoutes = require('./routes/userRoutes');
const { sequelize } = require('./models');

require('dotenv').config();

const app = express();
app.use(express.json());

sequelize.authenticate()
   .then(()=>console.log('Database connected successfully'))
   .catch(err => console.log('Database connection failed',err));

sequelize.sync()
  .then(() => console.log('All models were synchronized successfully.'))
  .catch(err => console.error('Failed to sync models:', err));

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

app.use((err,req,res, next)=>{
    console.error('Error:', err.stack);
    res.status(500).json({error:'Internal server error'});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));