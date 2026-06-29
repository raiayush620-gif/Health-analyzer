import mongoose from 'mongoose';

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  // Skip connection attempt entirely if it's a placeholder
  if (!mongoUri || mongoUri.includes('example.mongodb.net') || mongoUri.includes('placeholder')) {
    console.warn(`\n⚠️  WARNING: No real MONGO_URI configured in server/.env.`);
    console.warn(`⚠️  Falling back to local file-based mock storage for development testing.\n`);
    global.isMockDB = true;
    global.mockUsers = global.mockUsers || [];
    global.mockRecords = global.mockRecords || [];
    return;
  }

  try {
    // Handle async connection errors to prevent process crashes
    mongoose.connection.on('error', async (err) => {
      console.warn(`\n⚠️  MongoDB connection error: ${err.message}`);
      console.warn(`⚠️  Switching session to mock storage.\n`);
      global.isMockDB = true;
      try {
        await mongoose.connection.close();
      } catch (closeError) {
        // Ignore close errors
      }
    });

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000 // Fast timeout (5 seconds)
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    global.isMockDB = false;
  } catch (error) {
    console.warn(`\n⚠️  WARNING: Could not connect to MongoDB (${error.message}).`);
    console.warn(`⚠️  Falling back to local file-based mock storage for development testing.\n`);
    global.isMockDB = true;
    global.mockUsers = global.mockUsers || [];
    global.mockRecords = global.mockRecords || [];

    // Clean up connection attempts completely
    try {
      await mongoose.connection.close();
    } catch (closeError) {
      // Ignore close errors
    }
  }
};

export default connectDB;
