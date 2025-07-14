const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mobile App API Documentation',
      version: '1.0.0',
      description: 'API documentation for the mobile app shipping and logistics platform',
    },
    servers: [
      {
        url: 'http://localhost:9800/api',
        description: 'Development server',
      },
      {
        url: "https:/live.onrender.com/api",
        description: "Live Server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;