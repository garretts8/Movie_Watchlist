const { ObjectId } = require('mongodb');
const mongodb = require('../db/connect');

// To GET all movies
const getAllMovies = async (req, res) => {
  try {
    // now _db is already the 'test' database
    const result = await mongodb
      .getDb()
      .collection('movies')
      .find()
      .toArray();

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'err.message' });
  }
};

// To GET movie by ID
const getMovieById = async (req, res) => {
  try {
    const movieId = new ObjectId(req.params.id);

    const result = await mongodb
      .getDb()
      .collection('movies')
      .findOne({ _id: movieId });

    if (!result) {
      res.status(404).json({ message: 'Movie not found' });
    } else {
      res.status(200).json(result);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// const getMovieById = async (req, res) => {
//   try {
//     const id = req.params.id;
//     console.log('Searching for movie with ID:', id);
//     console.log('ID type:', typeof id);
    
//     // Try searching as string first (without converting to ObjectId)
//     const result = await mongodb
//       .getDb()
//       .collection('movies')
//       .findOne({ _id: id });  // Search as string
    
//     console.log('Result as string search:', result ? 'Found' : 'Not found');
    
//     if (!result) {
//       // If not found as string, try as ObjectId
//       try {
//         const objectId = new ObjectId(id);
//         console.log('Trying as ObjectId:', objectId);
        
//         const result2 = await mongodb
//           .getDb()
//           .collection('movies')
//           .findOne({ _id: objectId });
        
//         console.log('Result as ObjectId search:', result2 ? 'Found' : 'Not found');
        
//         if (!result2) {
//           return res.status(404).json({ message: 'Movie not found' });
//         }
//         return res.status(200).json(result2);
//       } catch (objectIdError) {
//         console.log('Invalid ObjectId format:', objectIdError.message);
//         return res.status(404).json({ message: 'Movie not found' });
//       }
//     }
    
//     res.status(200).json(result);
//   } catch (err) {
//     console.error('Error in getMovieById:', err);
//     res.status(500).json({ message: err.message });
//   }
// };

// Use POST to create a contact
const createMovie = async (req, res) => {
  try {
    const movie = {
      title: req.body.title,
      director: req.body.director,
      genre: req.body.genre,
      releaseDate: req.body.releaseDate ? new Date(req.body.releaseDate) : null,
      runtime: req.body.runtime,
      rating: req.body.rating,
      cast: req.body.cast,
    };

    // Check if movie with same title and director already exists
    const existingMovie = await mongodb
      .getDb()
      .collection('movies')
      .findOne({ 
        title: movie.title, 
        director: movie.director,
        releaseDate: movie.releaseDate 
      });

    if (existingMovie) {
      return res.status(409).json({
        message: 'Movie with this title, director, and release date already exists.',
      });
    }

    // Validation
    if (
      !movie.title ||
      !movie.director ||
      !movie.genre ||
      !movie.releaseDate ||
      !movie.runtime ||
      !movie.rating ||
      !movie.cast
    ) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate rating
    const validRatings = ['G', 'PG', 'PG-13', 'R'];
    if (!validRatings.includes(movie.rating)) {
      return res.status(400).json({ 
        message: 'Rating must be one of: G, PG, PG-13, R' 
      });
    }

    // Validate runtime is positive
    if (movie.runtime <= 0) {
      return res.status(400).json({ 
        message: 'Runtime must be a positive number' 
      });
    }

    const response = await mongodb
      .getDb()
      .collection('movies')
      .insertOne(movie);

    res.status(201).json({ 
        message: 'Movie created successfully',
        id: response.insertedId,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Use PUT to update a movie
const updateMovie = async (req, res) => {
  try {
    const movieId = new ObjectId(req.params.id);

    const movie = {
      title: req.body.title,
      director: req.body.director,
      genre: req.body.genre,
      releaseDate: req.body.releaseDate ? new Date(req.body.releaseDate) : null,
      runtime: req.body.runtime,
      rating: req.body.rating,
      cast: req.body.cast,
    };

    // Validate rating if provided
    if (req.body.rating) {
      const validRatings = ['G', 'PG', 'PG-13', 'R'];
      if (!validRatings.includes(movie.rating)) {
        return res.status(400).json({ 
          message: 'Rating must be one of: G, PG, PG-13, R' 
        });
      }
    }

    // Validate runtime if provided
    if (req.body.runtime && movie.runtime <= 0) {
      return res.status(400).json({ 
        message: 'Runtime must be a positive number' 
      });
    }

    // Check for duplicate movie (excluding current)
    if (req.body.title || req.body.director || req.body.releaseDate) {
      const existingMovie = await mongodb
        .getDb()
        .collection('movies')
        .findOne({
          title: movie.title,
          director: movie.director,
          releaseDate: movie.releaseDate,
          _id: { $ne: movieId },
        });

      if (existingMovie) {
        return res.status(409).json({
          message: 'Movie with this title, director, and release date already exists.',
        });
      }
    }

    const response = await mongodb
      .getDb()
      .collection('movies')
      .replaceOne({ _id: movieId }, { $set: movie });

    if (response.matchedCount === 0) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    if (response.modifiedCount === 0) {
      return res
        .status(200)
        .json({ message: 'Movie data is already up to date' });
    }

    res.status(200).json({ message: 'Movie updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Use DELETE to delete a contact
const deleteMovie = async (req, res) => {
  try {
    const movieId = new ObjectId(req.params.id);

    const response = await mongodb
      .getDb()
      .collection('movies')
      .deleteOne({ _id: movieId });

    if (response.deletedCount === 0) {
      res.status(404).json({ message: 'Movie not found' });
    } else {
      res.status(200).json({ message: 'Movie deleted successfully' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
};