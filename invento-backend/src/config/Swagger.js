const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Invento - Universal Shop Inventory Intelligence API',
      version: '1.0.0',
      description: 'Production-ready API for managing shop inventory, profit, and actionable insights.',
    },
    servers: [{ url: 'http://localhost:5000', description: 'Development Server' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);