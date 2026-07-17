import mongoose from 'mongoose';

const applicantProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  bio: { type: String, required: true, trim: true },
  skills: [{ type: String, trim: true }],
  experience: { type: String, required: true, trim: true },
  education: { type: String, required: true, trim: true },
  resumeUrl: { type: String, default: '' },
}, { timestamps: true });

export const ApplicantProfile = mongoose.model('ApplicantProfile', applicantProfileSchema);
