const router = require('express').Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const mongodb = require('../db/connect');
const { ObjectId } = require('mongodb');
const keys = require('../config/keys');
const { isAuthenticated } = require('../middleware/auth');

// @desc    Auth with Google
// @route   GET /auth/google
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  }),
);

// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/auth/login-failed',
    session: true,
  }),
  (req, res) => {
    // Successful authentication
    console.log('Authentication successful, redirecting to home');

    // Create JWT token
    const token = jwt.sign(
      {
        id: req.user._id,
        email: req.user.email,
        displayName: req.user.displayName,
      },
      process.env.JWT_SECRET || keys.session.SECRET,
      { expiresIn: '24h' },
    );

    // Set cookies for frontend to read
    const cookieOptions = {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: false, // Allow JavaScript to read these
      secure: keys.isProduction,
      sameSite: keys.isProduction ? 'none' : 'lax',
    };

    // Set readable cookies for frontend
    res.cookie('isLoggedIn', 'true', cookieOptions);
    res.cookie('userName', req.user.displayName, cookieOptions);
    res.cookie('userId', req.user._id.toString(), cookieOptions);
    
    // Set secure token cookie (httpOnly for security)
    res.cookie('token', token, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true, // Cannot be accessed by JavaScript
      secure: keys.isProduction,
      sameSite: keys.isProduction ? 'none' : 'lax',
    });

    // Redirect to home page
    res.redirect('/');
  },
);

// @desc    Get current logged in user
// @route   GET /auth/me
router.get('/me', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    res.status(200).json({
      success: true,
      isAuthenticated: true,
      user: {
        _id: req.user._id,
        displayName: req.user.displayName,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        profilePhoto: req.user.profilePhoto,
        createdDate: req.user.createdDate,
      },
    });
  } else {
    // Check for JWT token
    const token = req.cookies.token;
    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || keys.session.SECRET,
        );
        res.status(200).json({
          success: true,
          isAuthenticated: true,
          user: decoded,
        });
      } catch (err) {
        res.status(200).json({
          success: true,
          isAuthenticated: false,
        });
      }
    } else {
      res.status(200).json({
        success: true,
        isAuthenticated: false,
      });
    }
  }
});

// @desc    Logout user
// @route   GET /auth/logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Error logging out' });
    }

    // Clear all auth cookies
    res.clearCookie('isLoggedIn');
    res.clearCookie('userName');
    res.clearCookie('userId');
    res.clearCookie('token');

    // Redirect to home page
    res.redirect('/');
  });
});

// @desc    Login failed page
// @route   GET /auth/login-failed
router.get('/login-failed', (req, res) => {
  res.status(401).send(`
    <html>
      <head>
        <title>Login Failed</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .container { max-width: 500px; margin: 0 auto; }
          h1 { color: #e74c3c; }
          .btn { display: inline-block; padding: 10px 20px; background: #4a90e2; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Login Failed</h1>
          <p>Unable to authenticate with Google. Please try again.</p>
          <a href="/" class="btn">Return to Home</a>
        </div>
      </body>
    </html>
  `);
});

// @desc    Get all users (protected)
// @route   GET /auth/users
router.get('/users', isAuthenticated, async (req, res) => {
  try {
    const db = mongodb.getDb();
    const users = await db.collection('users').find().toArray();

    // Remove sensitive information
    const sanitizedUsers = users.map((user) => ({
      _id: user._id,
      googleId: user.googleId,
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      createdDate: user.createdDate,
      profilePhoto: user.profilePhoto,
      lastLogin: user.lastLogin,
    }));

    res.status(200).json({
      success: true,
      count: sanitizedUsers.length,
      data: sanitizedUsers,
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// @desc    Get user by ID
// @route   GET /auth/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    const userId = new ObjectId(req.params.id);
    const db = mongodb.getDb();
    const user = await db.collection('users').findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// @desc    Verify token
// @route   GET /auth/verify
router.get('/verify', (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || keys.session.SECRET,
    );
    res.status(200).json({
      success: true,
      user: decoded,
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
});

module.exports = router;