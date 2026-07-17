import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, required: true, trim: true },
  requirements: [{ type: String, trim: true }],
  company: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  salaryRange: { type: String, required: true, trim: true },
  jobType: { type: String, enum: ['full-time', 'part-time', 'contract'], required: true },
  category: { type: String, required: true, trim: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  postedAt: { type: Date, default: Date.now },
  featured: { type: Boolean, default: false },
}, { timestamps: true });

jobSchema.index({ title: 'text', company: 'text' });
export const Job = mongoose.model('Job', jobSchema);
