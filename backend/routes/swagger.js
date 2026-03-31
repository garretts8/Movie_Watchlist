const router = require('express').Router();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json');

// Custom swagger options to include credentials
const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    // This interceptor adds credentials to every request
    requestInterceptor: (request) => {
      // Add credentials to include cookies
      request.credentials = 'include';
      
      console.log('Swagger request to:', request.url);
      
      return request;
    },
    // Try to get token from cookie if available
    onComplete: () => {
      console.log('Swagger UI loaded');
    },
  },
};

// Serve swagger UI with custom options
router.use('/', swaggerUi.serve);

router.get('/', (req, res, next) => {
  // Clone the swagger document
  const swaggerCopy = JSON.parse(JSON.stringify(swaggerDocument));

  // Dynamically set the host based on request
  swaggerCopy.host = req.get('host');
  
  // Ensure security requirements are present
  if (!swaggerCopy.security) {
    swaggerCopy.security = [];
  }
  swaggerCopy.security.push({ cookieAuth: [] });
  
  // Add servers with correct protocol
  swaggerCopy.servers = [
    {
      url: `${req.protocol}://${req.get('host')}`,
      description: 'Current server',
    },
  ];

  // Pass modified document to swaggerUi.setup with options
  swaggerUi.setup(swaggerCopy, swaggerOptions)(req, res, next);
});

module.exports = router;