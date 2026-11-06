import 'dotenv/config.js';
import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDb() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 10,
  });
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
