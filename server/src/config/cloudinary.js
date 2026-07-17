import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';
import { AppError } from '../utils/AppError.js';

if (env.cloudinaryUrl) {
  cloudinary.config(env.cloudinaryUrl);
  cloudinary.config({ secure: true });
} else if (env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
}

export function requireCloudinary() {
  const config = cloudinary.config();
  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    throw new AppError('Cloudinary is not configured. Add CLOUDINARY_URL or the Cloudinary credential variables', 503);
  }
  return cloudinary;
}
