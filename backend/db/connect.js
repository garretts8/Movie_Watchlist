const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');

dotenv.config();

let dbInstance;

const initDb = async () => {
  if (dbInstance) {
    console.log('Db is already initialized!');
    return dbInstance;
  }

  const uri = process.env.MONGO_URL;

  if (!uri) {
    throw new Error('MONGO_URI not defined in .env');
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB successfully!');

    dbInstance = client.db();

    await dbInstance.command({ ping: 1 });
    console.log('MongoDB connection test successful');
    return dbInstance;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    throw err;
  }
};

const getDb = () => {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDb first.');
  }
  return dbInstance;
};

module.exports = {
  initDb,
  getDb,
};
