const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });
const dotenv = require('dotenv');
 
dotenv.config({ path: './.env' });
 
const isProduction = process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';
 
const doc = {
  info: {
    title: 'Movie Watchlist API',
    description: 'Complete Movie Watchlist CRUD API for managing movies, watchlists, users, and awards',
    version: '1.0.0',
    contact: {
      name: 'API Support',
      email: 'support@moviewatchlist.com',
    },
  },
  host: isProduction ? 'your-render-url.onrender.com' : 'localhost:3000',
  basePath: '/',
  schemes: isProduction ? ['https'] : ['http', 'https'],
  consumes: ['application/json'],
  produces: ['application/json'],
 
  // No security definitions since OAuth is not implemented yet
  security: [],
 
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
   
    User: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '69a610d1975615bcb31f4700' },
        googleId: { type: 'string', example: '123456789012345678901' },
        displayName: { type: 'string', example: 'John Smith' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Smith' },
        email: { type: 'string', example: 'john.smith@gmail.com' },
        createdDate: { type: 'string', example: '01/10/2024' },
      },
      required: ['googleId', 'displayName', 'firstName', 'lastName', 'email', 'createdDate'],
    },
   
    WatchlistItem: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '69a612a3975615bcb31f4707' },
        userId: { type: 'string', example: '69a610d1975615bcb31f4700' },
        movieId: { type: 'string', example: '69a60fe0975615bcb31f46f3' },
        addedDate: { type: 'string', example: 'July 21, 2015' },
        status: {
          type: 'string',
          example: 'completed',
          enum: ['plan-to-watch', 'watching', 'completed']
        },
        userRating: { type: 'string', example: '5' },
        reviewText: { type: 'string', example: 'Great movie. Would recommend to Howard' },
        startedWatching: { type: 'string', example: 'July 21, 2015' },
        completedWatching: { type: 'string', example: 'July 21, 2015' },
        rewatchCount: { type: 'integer', example: 3 },
      },
      required: ['userId', 'movieId', 'status'],
    },
   
    Award: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '69a61fcc975615bcb31f4726' },
        movieId: { type: 'string', example: '69a6179f975615bcb31f4720' },
        awardName: { type: 'string', example: 'Academy Awards' },
        category: { type: 'string', example: 'Cinematography, Makeup, Original Score, Visual Effects' },
        year: { type: 'string', example: '2002' },
        winner: { type: 'string', example: 'True' },
        recipient: { type: 'string', example: 'Andrew Lesnie (Cinematography), Peter Owen and Richard Taylor (Makeup)' },
      },
      required: ['movieId', 'awardName', 'category', 'year', 'recipient'],
    },
   
    // Request/Response models for Users
    UserResponse: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User created successfully' },
        id: { type: 'string', example: '69a610d1975615bcb31f4700' },
      },
    },
   
    UserListResponse: {
      type: 'array',
      items: { $ref: '#/definitions/User' },
    },
   
    Error: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Error message description' },
      },
    },
   
    ValidationError: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'All fields are required' },
      },
    },
  },
 
  paths: {
    // User endpoints
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'Get all users',
        description: 'Retrieve a list of all users',
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/UserListResponse' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create a new user',
        description: 'Add a new user to the database',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/definitions/User' },
              examples: {
                user: {
                  value: {
                    googleId: '123456789012345678901',
                    displayName: 'John Smith',
                    firstName: 'John',
                    lastName: 'Smith',
                    email: 'john.smith@gmail.com',
                    createdDate: '01/10/2024',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/UserResponse' },
              },
            },
          },
          400: {
            description: 'Bad request - missing required fields',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/ValidationError' },
              },
            },
          },
          409: {
            description: 'Conflict - user with this email already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
        },
      },
    },
   
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        description: 'Retrieve a specific user by their ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: {
              type: 'string',
              example: '69a610d1975615bcb31f4700',
            },
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/User' },
              },
            },
          },
          404: {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Update a user',
        description: 'Update an existing user by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: {
              type: 'string',
              example: '69a610d1975615bcb31f4700',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/definitions/User' },
              examples: {
                user: {
                  value: {
                    googleId: '123456789012345678901',
                    displayName: 'John Updated',
                    firstName: 'John',
                    lastName: 'Updated',
                    email: 'john.updated@gmail.com',
                    createdDate: '01/10/2024',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'User updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'User updated successfully' },
                  },
                },
              },
            },
          },
          200: {
            description: 'User data is already up to date',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'User data is already up to date' },
                  },
                },
              },
            },
          },
          404: {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          409: {
            description: 'Conflict - email already in use',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete a user',
        description: 'Delete an existing user by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: {
              type: 'string',
              example: '69a610d1975615bcb31f4700',
            },
          },
        ],
        responses: {
          200: {
            description: 'User deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'User deleted successfully' },
                  },
                },
              },
            },
          },
          404: {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
        },
      },
    },
   
    // Movie endpoints
    '/movies': {
      get: {
        tags: ['Movies'],
        summary: 'Get all movies',
        description: 'Retrieve a list of all movies',
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/definitions/Movie' },
                },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Movies'],
        summary: 'Create a new movie',
        description: 'Add a new movie to the database',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/definitions/Movie' },
            },
          },
        },
        responses: {
          201: {
            description: 'Movie created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Movie created successfully' },
                    id: { type: 'string', example: '69a61005975615bcb31f46f5' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Bad request - missing required fields',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          409: {
            description: 'Conflict - movie already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
        },
      },
    },
   
    '/movies/{id}': {
      get: {
        tags: ['Movies'],
        summary: 'Get movie by ID',
        description: 'Retrieve a specific movie by its ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Movie ID',
            schema: {
              type: 'string',
              example: '69a61005975615bcb31f46f5',
            },
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Movie' },
              },
            },
          },
          404: {
            description: 'Movie not found',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Movies'],
        summary: 'Update a movie',
        description: 'Update an existing movie by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Movie ID',
            schema: {
              type: 'string',
              example: '69a61005975615bcb31f46f5',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/definitions/Movie' },
            },
          },
        },
        responses: {
          200: {
            description: 'Movie updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Movie updated successfully' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Movie not found',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          409: {
            description: 'Conflict - duplicate movie',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Movies'],
        summary: 'Delete a movie',
        description: 'Delete an existing movie by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Movie ID',
            schema: {
              type: 'string',
              example: '69a61005975615bcb31f46f5',
            },
          },
        ],
        responses: {
          200: {
            description: 'Movie deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Movie deleted successfully' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Movie not found',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
        },
      },
    },
   
    // Watchlist endpoints
    '/watchlist': {
      get: {
        tags: ['Watchlist'],
        summary: 'Get all watchlist items',
        description: 'Retrieve a list of all watchlist items with movie details',
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/definitions/WatchlistItem' },
                },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Watchlist'],
        summary: 'Add movie to watchlist',
        description: 'Add a movie to a user\'s watchlist',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/definitions/WatchlistItem' },
            },
          },
        },
        responses: {
          201: {
            description: 'Movie added to watchlist successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Movie added to watchlist successfully' },
                    id: { type: 'string', example: '69a612a3975615bcb31f4707' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Bad request - missing required fields',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          404: {
            description: 'Movie not found',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          409: {
            description: 'Conflict - movie already in watchlist',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
        },
      },
    },
   
    '/watchlist/{id}': {
      get: {
        tags: ['Watchlist'],
        summary: 'Get watchlist item by ID',
        description: 'Retrieve a specific watchlist item by its ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Watchlist item ID',
            schema: {
              type: 'string',
              example: '69a612a3975615bcb31f4707',
            },
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/WatchlistItem' },
              },
            },
          },
          404: {
            description: 'Watchlist item not found',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Watchlist'],
        summary: 'Update watchlist item',
        description: 'Update an existing watchlist item by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Watchlist item ID',
            schema: {
              type: 'string',
              example: '69a612a3975615bcb31f4707',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['plan-to-watch', 'watching', 'completed'] },
                  userRating: { type: 'string', example: '5' },
                  reviewText: { type: 'string', example: 'Updated review text' },
                  startedWatching: { type: 'string', example: 'July 21, 2015' },
                  completedWatching: { type: 'string', example: 'July 21, 2015' },
                  rewatchCount: { type: 'integer', example: 4 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Watchlist item updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Watchlist item updated successfully' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Watchlist item not found',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Watchlist'],
        summary: 'Delete watchlist item',
        description: 'Remove a movie from a user\'s watchlist',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Watchlist item ID',
            schema: {
              type: 'string',
              example: '69a612a3975615bcb31f4707',
            },
          },
        ],
        responses: {
          200: {
            description: 'Watchlist item removed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Watchlist item removed successfully' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Watchlist item not found',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
        },
      },
    },
   
    // Awards endpoints
    '/awards': {
      get: {
        tags: ['Awards'],
        summary: 'Get all awards',
        description: 'Retrieve a list of all awards with movie details',
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/definitions/Award' },
                },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Awards'],
        summary: 'Create a new award',
        description: 'Add a new award to the database',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/definitions/Award' },
            },
          },
        },
        responses: {
          201: {
            description: 'Award created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Award created successfully' },
                    id: { type: 'string', example: '69a61fcc975615bcb31f4726' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Bad request - missing required fields',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          404: {
            description: 'Movie not found',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
        },
      },
    },
   
    '/awards/movie/{movieId}': {
      get: {
        tags: ['Awards'],
        summary: 'Get awards by movie ID',
        description: 'Retrieve all awards for a specific movie',
        parameters: [
          {
            name: 'movieId',
            in: 'path',
            required: true,
            description: 'Movie ID',
            schema: {
              type: 'string',
              example: '69a6179f975615bcb31f4720',
            },
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/definitions/Award' },
                },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
        },
      },
    },
   
    '/awards/{id}': {
      get: {
        tags: ['Awards'],
        summary: 'Get award by ID',
        description: 'Retrieve a specific award by its ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Award ID',
            schema: {
              type: 'string',
              example: '69a61fcc975615bcb31f4726',
            },
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Award' },
              },
            },
          },
          404: {
            description: 'Award not found',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Awards'],
        summary: 'Update an award',
        description: 'Update an existing award by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Award ID',
            schema: {
              type: 'string',
              example: '69a61fcc975615bcb31f4726',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  awardName: { type: 'string', example: 'Academy Awards' },
                  category: { type: 'string', example: 'Best Picture' },
                  year: { type: 'string', example: '2002' },
                  winner: { type: 'string', example: 'True' },
                  recipient: { type: 'string', example: 'Peter Jackson' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Award updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Award updated successfully' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Award not found',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Awards'],
        summary: 'Delete an award',
        description: 'Delete an existing award by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Award ID',
            schema: {
              type: 'string',
              example: '69a61fcc975615bcb31f4726',
            },
          },
        ],
        responses: {
          200: {
            description: 'Award deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Award deleted successfully' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Award not found',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/definitions/Error' },
              },
            },
          },
        },
      },
    },
  },
 
  tags: [
    {
      name: 'Users',
      description: 'User management endpoints - Create, read, update, and delete users',
    },
    {
      name: 'Movies',
      description: 'Movie management endpoints - Create, read, update, and delete movies',
    },
    {
      name: 'Watchlist',
      description: 'Watchlist management endpoints - Manage user watchlists',
    },
    {
      name: 'Awards',
      description: 'Awards management endpoints - Track movie awards and nominations',
    },
  ],
};
 
const outputFile = './swagger.json';
const endpointsFiles = [
  './routes/index.js', // This will capture all routes mounted in index
];
 
// Generate swagger.json
swaggerAutogen(outputFile, endpointsFiles, doc)
  .then(() => {
    console.log('Swagger documentation generated successfully');
  })
  .catch((err) => {
    console.error('Error generating swagger:', err);
  });