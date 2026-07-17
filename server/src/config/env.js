import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const projectRoot = path.resolve(serverRoot, '..');

// Support running commands from either the repository root or /server.
// Existing process variables always win, which keeps production and tests predictable.
for (const envPath of [path.resolve(process.cwd(), '.env'), path.join(serverRoot, '.env'), path.join(projectRoot, '.env')]) {
  dotenv.config({ path: envPath, override: false, quiet: true });
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/departure_job_portal',
  mongoDbName: process.env.MONGODB_DB_NAME || 'Gamma_job_portal',
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'test' ? 'test-secret-that-is-long-enough' : ''),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173',
  cloudinaryUrl: process.env.CLOUDINARY_URL || '',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
};

if (!env.jwtSecret) throw new Error('JWT_SECRET is required');
if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) throw new Error('PORT must be a valid port number');
if (env.nodeEnv === 'production' && !process.env.MONGODB_URI && !process.env.DATABASE_URL) throw new Error('MONGODB_URI is required in production');
