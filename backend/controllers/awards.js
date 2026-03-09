const { ObjectId } = require('mongodb');
const mongodb = require('../db/connect');

// To GET all awards
const getAllAwards = async (req, res) => {
  try {
    const result = await mongodb
      .getDb()
      .collection('awards')
      .aggregate([
        {
          $lookup: {
            from: 'movies',
            let: { movieId: '$movieId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ['$_id', '$$movieId'] },
                      { $eq: [{ $toString: '$_id' }, '$$movieId'] }
                    ]
                  }
                }
              }
            ],
            as: 'movieDetails'
          }
        },
        { 
          $unwind: { 
            path: '$movieDetails', 
            preserveNullAndEmptyArrays: false 
          } 
        }
      ])
      .toArray();

    res.status(200).json(result);
  } catch (err) {
    console.error('Error in getAllAwards:', err);
    res.status(500).json({ message: err.message });
  }
};

// To GET awards by movie id
const getAwardsByMovieId = async (req, res) => {
  try {
    const movieIdParam = req.params.movieId;
    
    const result = await mongodb
      .getDb()
      .collection('awards')
      .aggregate([
        {
          $match: {
            $expr: {
              $or: [
                { $eq: ['$movieId', movieIdParam] },
                { $eq: [{ $toString: '$movieId' }, movieIdParam] }
              ]
            }
          }
        },
        {
          $lookup: {
            from: 'movies',
            let: { movieId: '$movieId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ['$_id', '$$movieId'] },
                      { $eq: [{ $toString: '$_id' }, '$$movieId'] }
                    ]
                  }
                }
              }
            ],
            as: 'movieDetails'
          }
        },
        { $unwind: '$movieDetails' }
      ])
      .toArray();

    res.status(200).json(result);
  } catch (err) {
    console.error('Error in getAwardsByMovieId:', err);
    res.status(500).json({ message: err.message });
  }
};

// GET award by ID
const getAwardById = async (req, res) => {
  try {
    const awardId = req.params.id;
    
    const result = await mongodb
      .getDb()
      .collection('awards')
      .aggregate([
        {
          $match: {
            $expr: {
              $or: [
                { $eq: ['$_id', awardId] },
                { $eq: [{ $toString: '$_id' }, awardId] }
              ]
            }
          }
        },
        {
          $lookup: {
            from: 'movies',
            let: { movieId: '$movieId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ['$_id', '$$movieId'] },
                      { $eq: [{ $toString: '$_id' }, '$$movieId'] }
                    ]
                  }
                }
              }
            ],
            as: 'movieDetails'
          }
        },
        { $unwind: '$movieDetails' }
      ])
      .toArray();

    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Award not found' });
    }

    res.status(200).json(result[0]);
  } catch (err) {
    console.error('Error in getAwardById:', err);
    res.status(500).json({ message: err.message });
  }
};

// Use POST to create award
const createAward = async (req, res) => {
  try {
    const movieId = req.body.movieId; // Keep as string

    // Check if movie exists
    const movie = await mongodb
      .getDb()
      .collection('movies')
      .findOne({ _id: movieId });

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    } 

    const award = {
      movieId: movieId,
      awardName: req.body.awardName,
      category: req.body.category,
      year: req.body.year,
      winner: req.body.winner || false,
      recipient: req.body.recipient,
    };
    
    // Validation
    if (!award.movieId || !award.awardName || !award.category || !award.year || !award.recipient) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (award.year < 1900 || award.year > currentYear + 1) {
      return res.status(400).json({ 
        message: `Year must be between 1900 and ${currentYear + 1}` 
      });
    }

    const response = await mongodb
      .getDb()
      .collection('awards')
      .insertOne(award);

    res.status(201).json({
      message: 'Award created successfully',
      id: response.insertedId,
    });
  } catch (err) {
    console.error('Error in createAward:', err);
    res.status(500).json({ message: err.message });
  }
};

// PUT update award
const updateAward = async (req, res) => {
  try {
    const awardId = req.params.id; // Keep as string

    const award = {
      awardName: req.body.awardName,
      category: req.body.category,
      year: req.body.year,
      winner: req.body.winner,
      recipient: req.body.recipient,
    };

    // Validate year if provided
    if (req.body.year) {
      const currentYear = new Date().getFullYear();
      if (award.year < 1900 || award.year > currentYear + 1) {
        return res.status(400).json({ 
          message: `Year must be between 1900 and ${currentYear + 1}` 
        });
      }
    }

    const response = await mongodb
      .getDb()
      .collection('awards')
      .updateOne({ _id: awardId }, { $set: award });

    if (response.matchedCount === 0) {
      return res.status(404).json({ message: 'Award not found' });
    }

    if (response.modifiedCount === 0) {
      return res
        .status(200)
        .json({ message: 'Award data is already up to date' });
    }

    res.status(200).json({ message: 'Award updated successfully' });
  } catch (err) {
    console.error('Error in updateAward:', err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE award
const deleteAward = async (req, res) => {
  try {
    const awardId = req.params.id; // Keep as string
    
    const response = await mongodb
      .getDb()
      .collection('awards')
      .deleteOne({ _id: awardId });

    if (response.deletedCount === 0) {
      return res.status(404).json({ message: 'Award not found' });
    } else {
      return res.status(200).json({ message: 'Award deleted successfully' });
    }
  } catch (err) {
    console.error('Error in deleteAward:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllAwards,
  getAwardsByMovieId,
  getAwardById,
  createAward,
  updateAward,
  deleteAward,
};