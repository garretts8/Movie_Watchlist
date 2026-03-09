const routes = require('express').Router();
const watchlistController = require('../controllers/watchlist');
const { watchlistValidationRules } = require('../middleware/validation');
// const { isAuthenticated } = require('../middleware/auth');

// GET all watchlist items for current user
routes.get('/', watchlistController.getUserWatchlist);

// GET a single watchlist item by ID
routes.get(
    '/:id', 
    watchlistValidationRules.getById,
    watchlistController.getWatchlistItemById 
);

// POST to add movie to watchlist
routes.post( 
    '/', 
    watchlistValidationRules.create,
    watchlistController.addToWatchlist 
);

// PUT to update a watchlist item
routes.put( 
    '/:id', 
     watchlistValidationRules.update,
    watchlistController.updateWatchlistItem 
);

// DELETE to remove a watchlist item
routes.delete( 
    '/:id', 
    watchlistValidationRules.delete,
    watchlistController.deleteWatchlistItem 
);

module.exports = routes;