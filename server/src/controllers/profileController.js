import path from 'node:path';
import { ApplicantProfile } from '../models/ApplicantProfile.js';
import { AppError } from '../utils/AppError.js';
import { serialize } from '../utils/serializers.js';

export async function getProfile(req, res) {
  const profile = await ApplicantProfile.findOne({ userId: req.user.id });
  if (!profile) throw new AppError('Applicant profile not found', 404);
  res.json({ success: true, data: { profile: serialize(profile) } });
}

export async function updateProfile(req, res) {
  const profile = await ApplicantProfile.findOneAndUpdate(
    { userId: req.user.id }, { ...req.body, userId: req.user.id }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  res.json({ success: true, data: { profile: serialize(profile) } });
}

export async function uploadResume(req, res) {
  if (!req.file) throw new AppError('A PDF, DOC, or DOCX resume is required', 400);
  const profile = await ApplicantProfile.findOneAndUpdate(
    { userId: req.user.id }, { resumeUrl: `/uploads/resumes/${path.basename(req.file.filename)}` }, { new: true, runValidators: true },
  );
  if (!profile) throw new AppError('Complete your profile before uploading a resume', 400);
  res.json({ success: true, data: { profile: serialize(profile) } });
}
