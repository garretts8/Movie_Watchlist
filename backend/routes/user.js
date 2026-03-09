const routes = require('express').Router();
const userController = require('../controllers/user');
const { userValidationRules } = require('../middleware/validation');
// const { isAuthenticated } = require('../middleware/auth');

// GET all users
routes.get('/', userController.getAllUsers);

// GET a single user by ID
routes.get(
  '/:id',
  userValidationRules.getById,
  userController.getUserById,
);

// POST to create a new user
routes.post(
  '/',
  userValidationRules.create,
  userController.createUser,
);

// PUT to update a user
routes.put(
  '/:id',
  userValidationRules.update,
  userController.updateUser,
);

// DELETE to delete a user
routes.delete(
  '/:id',
  userValidationRules.delete,
  userController.deleteUser,
);

module.exports = routes;