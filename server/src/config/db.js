import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase(uri = env.mongoUri) {
  const connection = await mongoose.connect(uri, {
    dbName: env.mongoDbName,
    serverSelectionTimeoutMS: 10000,
  });
  if (env.nodeEnv !== 'test') console.log(`MongoDB connected: ${connection.connection.name}`);
  return connection;
}

export const disconnectDatabase = () => mongoose.disconnect();
