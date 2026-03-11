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
    res.status(500).json({ message: err.message });
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

// Use POST to create a movie
const createMovie = async (req, res) => {
  try {
    const movie = {
      title: req.body.title,
      director: req.body.director,
      genre: req.body.genre, 
      releaseDate: req.body.releaseDate, 
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
    const validRatings = ['G', 'PG', 'PG-13', 'R', 'NR', 'TV-MA', 'TV-14', 'TV-PG'];
    if (!validRatings.includes(movie.rating)) {
      return res.status(400).json({ 
        message: 'Rating must be one of: G, PG, PG-13, R, NR, TV-MA, TV-14, TV-PG' 
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

    // Build update object dynamically to only include fields that are provided
    const updateFields = {};
    
    if (req.body.title !== undefined) updateFields.title = req.body.title;
    if (req.body.director !== undefined) updateFields.director = req.body.director;
    if (req.body.genre !== undefined) updateFields.genre = req.body.genre; 
    if (req.body.releaseDate !== undefined) updateFields.releaseDate = req.body.releaseDate; 
    if (req.body.runtime !== undefined) updateFields.runtime = req.body.runtime; 
    if (req.body.rating !== undefined) updateFields.rating = req.body.rating;
    if (req.body.cast !== undefined) updateFields.cast = req.body.cast;

    // Validate rating if provided
    if (req.body.rating) {
      const validRatings = ['G', 'PG', 'PG-13', 'R', 'NR', 'TV-MA', 'TV-14', 'TV-PG'];
      if (!validRatings.includes(req.body.rating)) {
        return res.status(400).json({ 
          message: 'Rating must be one of: G, PG, PG-13, R, NR, TV-MA, TV-14, TV-PG' 
        });
      }
    }

    // Check for duplicate movie (excluding current) if title, director, or releaseDate is being updated
    if (req.body.title || req.body.director || req.body.releaseDate) {
      const existingMovie = await mongodb
        .getDb()
        .collection('movies')
        .findOne({
          title: req.body.title || { $exists: true }, 
          director: req.body.director || { $exists: true }, 
          releaseDate: req.body.releaseDate || { $exists: true }, 
          _id: { $ne: movieId },
        });

      if (existingMovie) {
        return res.status(409).json({
          message: 'Movie with this title, director, and release date already exists.',
        });
      }
    }

    // Only proceed with update if there are fields to update
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const response = await mongodb
      .getDb()
      .collection('movies')
      .updateOne({ _id: movieId }, { $set: updateFields });

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

// Use DELETE to delete a movie
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