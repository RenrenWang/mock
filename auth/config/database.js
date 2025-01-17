// /config/database.js
import mongoose from 'mongoose';

export const connectDatabase = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/mock', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
