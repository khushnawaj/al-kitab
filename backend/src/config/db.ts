import mongoose from 'mongoose';

export const sanitizeMongoUri = (uri: string): string => {
  try {
    // Mask username:password in mongodb:// or mongodb+srv://
    return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  } catch {
    return '[Protected Mongo URI]';
  }
};

export const connectDB = async (): Promise<typeof mongoose> => {
  const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/al_kitab';
  console.log(`Connecting to MongoDB at: ${sanitizeMongoUri(connUri)}`);
  
  const conn = await mongoose.connect(connUri);
  console.log(`MongoDB Connected Successfully: ${conn.connection.host || 'ready'}`);
  return conn;
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
};
