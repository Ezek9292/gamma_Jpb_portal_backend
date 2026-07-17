import { ApplicantProfile } from '../models/ApplicantProfile.js';
import { Application } from '../models/Application.js';
import { Job } from '../models/Job.js';
import { AppError } from '../utils/AppError.js';
import { serialize } from '../utils/serializers.js';
import { deleteCloudinaryDocument, uploadApplicationDocuments } from '../services/cloudinaryService.js';

const applicationDto = (application) => {
  const data = serialize(application);
  if (data.jobId && typeof data.jobId === 'object') data.job = serialize(data.jobId);
  data.jobId = data.job ? data.job.id : String(data.jobId);
  return data;
};

export async function apply(req, res) {
  const [job, profile] = await Promise.all([Job.findById(req.params.id), ApplicantProfile.findOne({ userId: req.user.id })]);
  if (!job) throw new AppError('Job not found', 404);
  if (job.status !== 'open') throw new AppError('Applications for this job are closed', 409);
  if (!profile) throw new AppError('Complete your applicant profile before applying', 422);
  if (await Application.exists({ jobId: job.id, applicantId: req.user.id })) throw new AppError('You have already applied to this job', 409);
  const cv = req.files?.cv?.[0];
  const coverLetter = req.files?.coverLetter?.[0];
  if (!cv || !coverLetter) throw new AppError('A CV and cover letter are both required as PDF files', 422);
  const documents = await uploadApplicationDocuments({ cv, coverLetter, applicantId: req.user.id, jobId: job.id });
  let application;
  try {
    application = await Application.create({ jobId: job.id, applicantId: req.user.id, documents });
  } catch (error) {
    await Promise.allSettled([
      deleteCloudinaryDocument(documents.cv.publicId),
      deleteCloudinaryDocument(documents.coverLetter.publicId),
    ]);
    throw error;
  }
  await application.populate('jobId');
  res.status(201).json({ success: true, data: { application: applicationDto(application) } });
}

export async function myApplications(req, res) {
  const applications = await Application.find({ applicantId: req.user.id }).populate('jobId').sort({ appliedAt: -1 });
  res.json({ success: true, data: { applications: applications.map(applicationDto) } });
}

export async function jobApplications(req, res) {
  if (!(await Job.exists({ _id: req.params.id }))) throw new AppError('Job not found', 404);
  const applications = await Application.find({ jobId: req.params.id }).sort({ appliedAt: -1 });
  const profiles = await ApplicantProfile.find({ userId: { $in: applications.map((item) => item.applicantId) } });
  const byUser = new Map(profiles.map((profile) => [String(profile.userId), serialize(profile)]));
  const data = applications.map((item) => ({ ...serialize(item), jobId: String(item.jobId), applicantId: String(item.applicantId), profile: byUser.get(String(item.applicantId)) || null }));
  res.json({ success: true, data: { applications: data } });
}

export async function updateApplicationStatus(req, res) {
  const application = await Application.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  if (!application) throw new AppError('Application not found', 404);
  res.json({ success: true, data: { application: { ...serialize(application), jobId: String(application.jobId), applicantId: String(application.applicantId) } } });
}
