const routes = require('express').Router();
const awardController = require('../controllers/awards');
const { awardValidationRules } = require('../middleware/validation');
// const { isAuthenticated } = require('../middleware/auth');

// GET all awards
routes.get('/', awardController.getAllAwards);

// GET awards by movie ID
routes.get('/movie/:movieId', awardController.getAwardsByMovieId);

// GET a single award by ID
routes.get(
  '/:id',
  awardValidationRules.getById,
  awardController.getAwardById,
);

// POST to create a new award
routes.post(
  '/',
  awardValidationRules.create,
  awardController.createAward,
);

// PUT to update an award
routes.put(
  '/:id',
  awardValidationRules.update,
  awardController.updateAward,
);

// DELETE to delete an award
routes.delete(
  '/:id',
  awardValidationRules.delete,
  awardController.deleteAward,
);

module.exports = routes;