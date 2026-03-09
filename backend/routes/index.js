const routes = require('express').Router();
const moviesRoutes = require('./movies');
const userRoutes = require('./user');
const watchlistRoutes = require('./watchlist');
const awardsRoutes = require('./awards');
// const authRoutes = require('./auth');
// const { optionalAuth } = require('../middleware/auth');

// API routes
routes.use('/movies', moviesRoutes);
routes.use('/users', userRoutes);
routes.use('/watchlist', watchlistRoutes);
routes.use('/awards', awardsRoutes);
// routes.use('/auth', authRoutes);

// Swagger documentation
// routes.use('/api-docs', require('./swagger'));

module.exports = routes;