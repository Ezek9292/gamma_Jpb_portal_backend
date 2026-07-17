import { Router } from 'express';
import { getProfile, updateProfile, uploadResume } from '../controllers/profileController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { resumeUpload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { profileSchema } from '../validators/schemas.js';

export const applicantRouter = Router();
applicantRouter.use(authenticate, authorize('applicant'));
applicantRouter.get('/profile', asyncHandler(getProfile));
applicantRouter.put('/profile', validate(profileSchema), asyncHandler(updateProfile));
applicantRouter.post('/profile/resume', resumeUpload.single('resume'), asyncHandler(uploadResume));
