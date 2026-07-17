import { Router } from 'express';
import { jobApplications, myApplications, updateApplicationStatus } from '../controllers/applicationController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { applicationStatusSchema } from '../validators/schemas.js';

export const applicationRouter = Router();
applicationRouter.get('/applications/me', authenticate, authorize('applicant'), asyncHandler(myApplications));
applicationRouter.get('/jobs/:id/applications', authenticate, authorize('admin'), asyncHandler(jobApplications));
applicationRouter.patch('/applications/:id/status', authenticate, authorize('admin'), validate(applicationStatusSchema), asyncHandler(updateApplicationStatus));
