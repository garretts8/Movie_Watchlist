const routes = require('express').Router();
const movieController = require('../controllers/movies');
const { movieValidationRules } = require('../middleware/validation');
// const { isAuthenticated } = require('..middleware/auth');

// GET all movies
routes.get('/', movieController.getAllMovies );


// GET a single movie by ID
routes.get(
    '/:id', 
    movieValidationRules.getById, 
    movieController.getMovieById 
);

// POST to create a new movie
routes.post(
    '/',
    movieValidationRules.create, 
    movieController.createMovie 
);

// PUT to update a movie
routes.put( 
    '/:id', 
    movieValidationRules.update,
    movieController.updateMovie 
);

// DELETE to delete a movie
routes.delete( 
    '/:id', 
    movieValidationRules.delete,
    movieController.deleteMovie, 
);

module.exports = routes;