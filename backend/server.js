const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']); 

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
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

// frontend files 
const frontendViewsPath = path.join(__dirname, '../frontend/views');
const frontendCssPath = path.join(__dirname, '../frontend/css');
const frontendJsPath = path.join(__dirname, '../frontend/js');

console.log('Looking for frontend files in:', frontendViewsPath);

// Serve static files from the correct directories
app.use(express.static(frontendViewsPath));
app.use('/css', express.static(frontendCssPath));
app.use('/js', express.static(frontendJsPath));

// Root route - serve frontend HTML
app.get("/", (req, res) => {
    const indexPath = path.join(frontendViewsPath, 'index.html');
    console.log('Attempting to serve:', indexPath);
    res.sendFile(indexPath);
});

// Debug route 
app.get('/debug-watchlist-raw', async (req, res) => {
  try {
    // Check if DB is initialized
    try {
      const db = mongodb.getDb();
    } catch (err) {
      return res.status(500).json({ error: 'Database not initialized yet' });
    }
    
    const db = mongodb.getDb();
    const watchlistItems = await db
      .collection('watchlist')
      .find({})
      .toArray();
    
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

// Start server - connect to DB FIRST, THEN load routes
mongodb
  .initDb()
  .then(() => {
    console.log('Database connected, now loading routes...');
    
    // Load routes ONLY after DB is connected
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
    
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Frontend: http://localhost:${PORT}`);
        console.log(`API endpoints:`);
        console.log(`  - http://localhost:${PORT}/movies`);
        console.log(`  - http://localhost:${PORT}/users`);
        console.log(`  - http://localhost:${PORT}/watchlist`);
        console.log(`  - http://localhost:${PORT}/awards`);
        console.log(`  - http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  });