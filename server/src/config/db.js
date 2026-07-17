import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDatabase = (uri = env.mongoUri) => mongoose.connect(uri);
export const disconnectDatabase = () => mongoose.disconnect();
