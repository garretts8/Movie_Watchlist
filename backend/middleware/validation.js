const { body, param, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: formattedErrors,
    });
  }
  next();
};

// User validation rules
const userValidationRules = {
  create: [
    body('googleId')
      .trim()
      .notEmpty()
      .withMessage('Google ID is required')
      .isLength({ min: 5, max: 100 })
      .withMessage('Google ID must be between 5 and 100 characters'),

    body('displayName')
      .trim()
      .notEmpty()
      .withMessage('Display name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Display name must be between 2 and 100 characters'),

    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s.'-]+$/)
      .withMessage(
        'First name must contain only letters, spaces, periods, apostrophes, and hyphens',
      ),

    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s.'-]+$/)
      .withMessage(
        'Last name must contain only letters, spaces, periods, apostrophes, and hyphens',
      ),

    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail(),

    body('createdDate')
      .trim()
      .notEmpty()
      .withMessage('Created date is required')
      .custom((value) => {
        const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
        if (!dateRegex.test(value)) {
          throw new Error('Must be a valid date (MM/DD/YYYY format)');
        }

        const [month, day, year] = value.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        if (
          date.getFullYear() !== year ||
          date.getMonth() !== month - 1 ||
          date.getDate() !== day
        ) {
          throw new Error('Must be a valid date');
        }

        return true;
      }),

    handleValidationErrors,
  ],

  update: [
    param('id').isMongoId().withMessage('Invalid user ID format'),

    body('googleId')
      .optional()
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Google ID must be between 5 and 100 characters'),

    body('displayName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Display name must be between 2 and 100 characters'),

    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s.'-]+$/)
      .withMessage(
        'First name must contain only letters, spaces, periods, apostrophes, and hyphens',
      ),

    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s.'-]+$/)
      .withMessage(
        'Last name must contain only letters, spaces, periods, apostrophes, and hyphens',
      ),

    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail(),

    body('createdDate')
      .optional()
      .trim()
      .custom((value) => {
        const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
        if (!dateRegex.test(value)) {
          throw new Error('Must be a valid date (MM/DD/YYYY format)');
        }

        const [month, day, year] = value.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        if (
          date.getFullYear() !== year ||
          date.getMonth() !== month - 1 ||
          date.getDate() !== day
        ) {
          throw new Error('Must be a valid date');
        }

        return true;
      }),

    handleValidationErrors,
  ],

  getById: [
    param('id').isMongoId().withMessage('Invalid user ID format'),
    handleValidationErrors,
  ],

  delete: [
    param('id').isMongoId().withMessage('Invalid user ID format'),
    handleValidationErrors,
  ],
};

// Movie validation rules
const movieValidationRules = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),

    body('director')
      .trim()
      .notEmpty()
      .withMessage('Director is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Director name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s.'-]+$/)
      .withMessage(
        'Director name can only contain letters, spaces, periods, apostrophes, and hyphens',
      ),

    body('genre')
      .isArray({ min: 1 })
      .withMessage('Genre must be an array with at least one genre')
      .custom((genres) => {
        return genres.every(g => typeof g === 'string' && g.trim().length > 0);
      })
      .withMessage('All genres must be non-empty strings'),

    body('releaseDate')
      .notEmpty()
      .withMessage('Release date is required')
      .isISO8601()
      .withMessage('Release date must be a valid date (YYYY-MM-DD)'),

    body('runtime')
      .notEmpty()
      .withMessage('Runtime is required')
      .isInt({ min: 1, max: 500 })
      .withMessage('Runtime must be between 1 and 500 minutes'),

    body('rating')
      .notEmpty()
      .withMessage('Rating is required')
      .isIn(['G', 'PG', 'PG-13', 'R'])
      .withMessage('Rating must be one of: G, PG, PG-13, R'),

    body('cast')
      .trim()
      .notEmpty()
      .withMessage('Cast is required')
      .isLength({ min: 2, max: 500 })
      .withMessage('Cast must be between 2 and 500 characters'),

    handleValidationErrors,
  ],

  update: [
    param('id').isMongoId().withMessage('Invalid movie ID format'),

    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),

    body('director')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Director name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s.'-]+$/)
      .withMessage(
        'Director name can only contain letters, spaces, periods, apostrophes, and hyphens',
      ),

    body('genre')
      .optional()
      .isArray()
      .withMessage('Genre must be an array')
      .custom((genres) => {
        return genres.every(g => typeof g === 'string' && g.trim().length > 0);
      })
      .withMessage('All genres must be non-empty strings'),

    body('releaseDate')
      .optional()
      .isISO8601()
      .withMessage('Release date must be a valid date (YYYY-MM-DD)'),

    body('runtime')
      .optional()
      .isInt({ min: 1, max: 500 })
      .withMessage('Runtime must be between 1 and 500 minutes'),

    body('rating')
      .optional()
      .isIn(['G', 'PG', 'PG-13', 'R'])
      .withMessage('Rating must be one of: G, PG, PG-13, R'),

    body('cast')
      .optional()
      .trim()
      .isLength({ min: 2, max: 500 })
      .withMessage('Cast must be between 2 and 500 characters'),

    handleValidationErrors,
  ],

  getById: [
    param('id').isMongoId().withMessage('Invalid movie ID format'),
    handleValidationErrors,
  ],

  delete: [
    param('id').isMongoId().withMessage('Invalid movie ID format'),
    handleValidationErrors,
  ],
};

// Watchlist validation rules
const watchlistValidationRules = {
  create: [
    body('movieId')
      .notEmpty()
      .withMessage('Movie ID is required')
      .isMongoId()
      .withMessage('Invalid movie ID format'),

    body('status')
      .optional()
      .isIn(['plan-to-watch', 'watching', 'completed'])
      .withMessage('Status must be one of: plan-to-watch, watching, completed'),

    body('userRating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('User rating must be between 0 and 5'),

    body('reviewText')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Review text cannot exceed 2000 characters'),

    body('startedWatching')
      .optional()
      .isISO8601()
      .withMessage('Started watching must be a valid date'),

    body('completedDate')
      .optional()
      .isISO8601()
      .withMessage('Completed date must be a valid date'),

    body('rewatchCount')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Rewatch count must be a non-negative integer'),

    handleValidationErrors,
  ],

  update: [
    param('id').isMongoId().withMessage('Invalid watchlist item ID format'),

    body('status')
      .optional()
      .isIn(['plan-to-watch', 'watching', 'completed'])
      .withMessage('Status must be one of: plan-to-watch, watching, completed'),

    body('userRating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('User rating must be between 0 and 5'),

    body('reviewText')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Review text cannot exceed 2000 characters'),

    body('startedWatching')
      .optional()
      .isISO8601()
      .withMessage('Started watching must be a valid date'),

    body('completedDate')
      .optional()
      .isISO8601()
      .withMessage('Completed date must be a valid date'),

    body('rewatchCount')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Rewatch count must be a non-negative integer'),

    handleValidationErrors,
  ],

  getById: [
    param('id').isMongoId().withMessage('Invalid watchlist item ID format'),
    handleValidationErrors,
  ],

  delete: [
    param('id').isMongoId().withMessage('Invalid watchlist item ID format'),
    handleValidationErrors,
  ],
};

// Awards validation rules
const awardValidationRules = {
  create: [
    body('movieId')
      .notEmpty()
      .withMessage('Movie ID is required')
      .isMongoId()
      .withMessage('Invalid movie ID format'),

    body('awardName')
      .trim()
      .notEmpty()
      .withMessage('Award name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Award name must be between 2 and 100 characters'),

    body('category')
      .trim()
      .notEmpty()
      .withMessage('Category is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Category must be between 2 and 100 characters'),

    body('year')
      .notEmpty()
      .withMessage('Year is required')
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage(`Year must be between 1900 and ${new Date().getFullYear() + 1}`),

    body('winner')
      .optional()
      .isBoolean()
      .withMessage('Winner must be a boolean value'),

    body('recipient')
      .trim()
      .notEmpty()
      .withMessage('Recipient is required')
      .isLength({ min: 2, max: 200 })
      .withMessage('Recipient must be between 2 and 200 characters'),

    handleValidationErrors,
  ],

  update: [
    param('id').isMongoId().withMessage('Invalid award ID format'),

    body('awardName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Award name must be between 2 and 100 characters'),

    body('category')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Category must be between 2 and 100 characters'),

    body('year')
      .optional()
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage(`Year must be between 1900 and ${new Date().getFullYear() + 1}`),

    body('winner')
      .optional()
      .isBoolean()
      .withMessage('Winner must be a boolean value'),

    body('recipient')
      .optional()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Recipient must be between 2 and 200 characters'),

    handleValidationErrors,
  ],

  getById: [
    param('id').isMongoId().withMessage('Invalid award ID format'),
    handleValidationErrors,
  ],

  delete: [
    param('id').isMongoId().withMessage('Invalid award ID format'),
    handleValidationErrors,
  ],
};

module.exports = {
  userValidationRules,
  movieValidationRules,
  watchlistValidationRules,
  awardValidationRules,
};