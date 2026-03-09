const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongodb = require('./db/connect');
const morgan = require('morgan');

dotenv.config({ path: './.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Add this before your routes
app.get('/debug-watchlist-raw', async (req, res) => {
  try {
    const db = mongodb.getDb();
    
    // Get raw watchlist items without any lookup
    const watchlistItems = await db
      .collection('watchlist')
      .find({})
      .toArray();
    
    // Get sample movie to check IDs
    const sampleMovie = await db
      .collection('movies')
      .findOne({});
    
    res.json({
      watchlistCount: watchlistItems.length,
      watchlistItems: watchlistItems.map(item => ({
        id: item._id,
        userId: item.userId,
        movieId: item.movieId,
        status: item.status,
        movieIdType: typeof item.movieId
      })),
      sampleMovie: sampleMovie ? {
        id: sampleMovie._id,
        title: sampleMovie.title,
        idType: typeof sampleMovie._id
      } : null
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Root route
app.get("/", (req, res) => {
    res.send("Movie Watchlist API is running");
});

// API routes
app.use('/', require('./routes/index'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message });
});

// Start server
mongodb
    .initDb()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API endpoints:`);
            console.log(`  - http://localhost:${PORT}/movies`);
            console.log(`  - http://localhost:${PORT}/users`);
            console.log(`  - http://localhost:${PORT}/watchlist`);
            console.log(`  - http://localhost:${PORT}/awards`);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to database:', err);
        process.exit(1);
    });