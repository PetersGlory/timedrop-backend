const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const swaggerSpec = require('./swagger');

module.exports = (app) => {
  // Serve Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true
    }
  }));
};