import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const uploadsRoot = path.join(serverRoot, 'uploads');
const resumeDirectory = path.join(uploadsRoot, 'resumes');
const allowedMimeTypes = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, resumeDirectory),
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${req.user.id}-${Date.now()}${extension}`);
  },
});

export const resumeUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedMimeTypes.has(file.mimetype) || !['.pdf', '.doc', '.docx'].includes(extension)) return callback(new AppError('Only PDF, DOC, and DOCX resumes are allowed', 400));
    callback(null, true);
  },
});

export const applicationDocumentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (file.mimetype !== 'application/pdf' || extension !== '.pdf') return callback(new AppError('CV and cover letter must both be PDF files', 400));
    callback(null, true);
  },
});
