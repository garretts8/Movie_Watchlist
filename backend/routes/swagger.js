const router = require('express').Router();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json');
 
router.use('/', swaggerUi.serve);
 
router.get('/', (req, res, next) => {
  // Clone the swagger document
  const swaggerCopy = JSON.parse(JSON.stringify(swaggerDocument));
 
  // Dynamically set the host based on request
  swaggerCopy.host = req.get('host');
 
  // Swagger UI options
  const swaggerOptions = {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
    },
  };
 
  // Pass modified document to swaggerUi.setup
  swaggerUi.setup(swaggerCopy, swaggerOptions)(req, res, next);
});
 
module.exports = router;