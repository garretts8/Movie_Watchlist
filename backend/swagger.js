const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });
const keys = require('./config/keys');

const isProduction = keys.isProduction;

const doc = {
  info: {
    title: 'Movie Watchlist API',
    description: 'Complete Movie Watchlist CRUD API with Google OAuth Authentication',
    version: '1.0.0',
    contact: {
      name: 'API Support',
      email: 'support@moviewatchlist.com',
    },
  },
  host: isProduction ? 'movie-watchlist-1w1x.onrender.com' : 'localhost:3000',
  basePath: '/',
  schemes: isProduction ? ['https'] : ['http', 'https'],
  consumes: ['application/json'],
  produces: ['application/json'],

  securityDefinitions: {
    cookieAuth: {
      type: 'apiKey',
      in: 'cookie',
      name: 'connect.sid',
      description: 'Session cookie for authentication',
    },
    bearerAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'JWT token (format: Bearer <token>)',
    },
  },

  security: [{ cookieAuth: [] }, { bearerAuth: [] }],

  definitions: {
    Movie: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '69a61005975615bcb31f46f5' },
        title: { type: 'string', example: 'Pride and Prejudice' },
        director: { type: 'string', example: 'Joe Wright' },
        genre: { type: 'string', example: 'Drama, Romance' },
        releaseDate: { type: 'string', example: 'February 28, 2006' },
        runtime: { type: 'string', example: '2 hours and 1 minutes' },
        rating: { type: 'string', example: 'PG' },
        cast: { type: 'string', example: 'Keira Knightley, Matthew Macfadyen, Donald Sutherland' },
      },
      required: ['title', 'director', 'genre', 'releaseDate', 'runtime', 'rating', 'cast'],
    },

  },
  tags: [
    {
      name: 'Movies',
      description: 'Movie management endpoints',
    },
    {
      name: 'Users',
      description: 'User management endpoints',
    },
    {
      name: 'Watchlist',
      description: 'Watchlist management endpoints',
    },
    {
      name: 'Awards',
      description: 'Awards management endpoints',
    },
    {
      name: 'Authentication',
      description: 'Google OAuth authentication endpoints',
    },
  ],
};

const outputFile = './swagger.json';
const endpointsFiles = [
  './routes/index.js',
];

// Generate swagger.json
swaggerAutogen(outputFile, endpointsFiles, doc)
  .then(() => {
    console.log('Swagger documentation generated successfully');
  })
  .catch((err) => {
    console.error('Error generating swagger:', err);
  });