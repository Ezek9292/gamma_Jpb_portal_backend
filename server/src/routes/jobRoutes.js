import { Router } from 'express';
import { apply } from '../controllers/applicationController.js';
import { createJob, getJob, listJobs, updateJob, updateJobStatus } from '../controllers/jobController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { applicationDocumentUpload } from '../middleware/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { jobSchema, jobStatusSchema, jobUpdateSchema } from '../validators/schemas.js';

export const jobRouter = Router();
jobRouter.get('/', asyncHandler(listJobs));
jobRouter.get('/:id', asyncHandler(getJob));
jobRouter.post('/', authenticate, authorize('admin'), validate(jobSchema), asyncHandler(createJob));
jobRouter.put('/:id', authenticate, authorize('admin'), validate(jobUpdateSchema), asyncHandler(updateJob));
jobRouter.patch('/:id/status', authenticate, authorize('admin'), validate(jobStatusSchema), asyncHandler(updateJobStatus));
jobRouter.post(
  '/:id/apply',
  authenticate,
  authorize('applicant'),
  applicationDocumentUpload.fields([{ name: 'cv', maxCount: 1 }, { name: 'coverLetter', maxCount: 1 }]),
  asyncHandler(apply),
);
