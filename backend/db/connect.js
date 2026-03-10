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
    throw new Error('MONGO_URL not defined in .env');
  }

  console.log('Connecting to MongoDB...');

  try {
    // IMPORTANT: Add the family: 4 option and timeout
    const client = new MongoClient(uri, {
      family: 4,              // Force IPv4 - THIS IS CRITICAL
      connectTimeoutMS: 10000, // 10 second timeout
      serverSelectionTimeoutMS: 10000
    });
    
    await client.connect();
    console.log('Connected to MongoDB successfully!');

    dbInstance = client.db();

    await dbInstance.command({ ping: 1 });
    console.log('MongoDB connection test successful');
    return dbInstance;
  } catch (err) {
    console.error('Failed to connect to MongoDB:');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    if (err.code) console.error('Error code:', err.code);
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