import { Job } from '../models/Job.js';
import { AppError } from '../utils/AppError.js';
import { serialize } from '../utils/serializers.js';
import { generateJobCode } from '../services/jobCode.js';

export async function listJobs(req, res) {
  const filter = {};
  for (const key of ['location', 'jobType', 'category', 'status']) if (req.query[key]) filter[key] = req.query[key];
  if (req.query.search) {
    const escaped = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ title: new RegExp(escaped, 'i') }, { company: new RegExp(escaped, 'i') }];
  }
  const jobs = await Job.find(filter).sort({ postedAt: -1, createdAt: -1 });
  res.json({ success: true, data: { jobs: serialize(jobs) } });
}

export async function getJob(req, res) {
  const job = await Job.findById(req.params.id);
  if (!job) throw new AppError('Job not found', 404);
  res.json({ success: true, data: { job: serialize(job) } });
}

export async function createJob(req, res) {
  const job = await Job.create({ ...req.body, code: await generateJobCode(req.body.category), postedBy: req.user.id, postedAt: new Date(), status: 'open' });
  res.status(201).json({ success: true, data: { job: serialize(job) } });
}

export async function updateJob(req, res) {
  const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!job) throw new AppError('Job not found', 404);
  res.json({ success: true, data: { job: serialize(job) } });
}

export async function updateJobStatus(req, res) {
  const job = await Job.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  if (!job) throw new AppError('Job not found', 404);
  res.json({ success: true, data: { job: serialize(job) } });
}
