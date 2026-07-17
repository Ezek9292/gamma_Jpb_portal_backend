import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['applied', 'reviewed', 'shortlisted', 'rejected'], default: 'applied' },
  appliedAt: { type: Date, default: Date.now },
  documents: {
    cv: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      originalName: { type: String, required: true },
    },
    coverLetter: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      originalName: { type: String, required: true },
    },
  },
}, { timestamps: true });

applicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });
export const Application = mongoose.model('Application', applicationSchema);
