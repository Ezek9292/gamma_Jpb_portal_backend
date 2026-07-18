import bcrypt from 'bcrypt';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/services/cloudinaryService.js', () => ({
  uploadApplicationDocuments: vi.fn(async ({ cv, coverLetter }) => ({
    cv: { url: 'https://cloudinary.test/cv.pdf', publicId: 'applications/cv', originalName: cv.originalname },
    coverLetter: { url: 'https://cloudinary.test/cover-letter.pdf', publicId: 'applications/cover-letter', originalName: coverLetter.originalname },
  })),
  deleteCloudinaryDocument: vi.fn(async () => undefined),
}));
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { ApplicantProfile } from '../src/models/ApplicantProfile.js';
import { Application } from '../src/models/Application.js';
import { Job } from '../src/models/Job.js';
import { User } from '../src/models/User.js';
import { signToken } from '../src/utils/token.js';

let mongo;
let admin;
let applicant;
let adminToken;
let applicantToken;
const password = 'demo123';
const jobInput = { title: 'Platform Engineer', description: 'Build dependable platform services.', requirements: ['Node.js experience'], company: 'Northstar Labs', location: 'Remote', salaryRange: '$50k–$70k', jobType: 'full-time', category: 'Engineering' };
const documents = {
  cv: { url: 'https://cloudinary.test/cv.pdf', publicId: 'applications/cv', originalName: 'cv.pdf' },
  coverLetter: { url: 'https://cloudinary.test/cover-letter.pdf', publicId: 'applications/cover-letter', originalName: 'cover-letter.pdf' },
};

beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });
beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
  const passwordHash = await bcrypt.hash(password, 4);
  [admin, applicant] = await User.create([{ name: 'Admin', email: 'admin@test.dev', passwordHash, role: 'admin' }, { name: 'Applicant', email: 'applicant@test.dev', passwordHash, role: 'applicant' }]);
  adminToken = signToken(admin.id); applicantToken = signToken(applicant.id);
});

describe('authentication and authorization', () => {
  it('serves the API welcome and health endpoints', async () => {
    const root = await request(app).get('/').expect(200);
    expect(root.body).toMatchObject({ success: true, data: { name: 'Gamma Job Portal API', status: 'running', health: '/api/health' } });
    await request(app).get('/api/health').expect(200, { success: true, data: { status: 'ok' } });
    const preflight = await request(app).options('/api/jobs')
      .set('Origin', env.clientOrigins[0])
      .set('Access-Control-Request-Method', 'GET')
      .expect(204);
    expect(preflight.headers['access-control-allow-origin']).toBe(env.clientOrigins[0]);
  });

  it('signs up, normalizes email, hides hashes, and logs in', async () => {
    const signup = await request(app).post('/api/auth/signup').send({ name: 'New Person', email: '  NEW@Example.COM ', password, role: 'applicant' }).expect(201);
    expect(signup.body.data.user.email).toBe('new@example.com'); expect(signup.body.data.user.passwordHash).toBeUndefined(); expect(signup.body.data.token).toBeTruthy();
    const login = await request(app).post('/api/auth/login').send({ email: 'NEW@example.com', password }).expect(200);
    expect(login.body.data.user.id).toBe(signup.body.data.user.id);
  });
  it('protects authenticated routes and enforces roles', async () => {
    await request(app).get('/api/auth/me').expect(401);
    await request(app).post('/api/jobs').set('Authorization', `Bearer ${applicantToken}`).send(jobInput).expect(403);
    await request(app).post('/api/jobs').set('Authorization', `Bearer ${adminToken}`).send(jobInput).expect(201);
  });
});

describe('jobs and applications', () => {
  async function createJob(overrides = {}) { return Job.create({ ...jobInput, ...overrides, code: overrides.code || `ENG-${Math.floor(Math.random() * 900 + 100)}`, postedBy: admin.id }); }
  it('combines public job filters and search', async () => {
    await Promise.all([createJob(), createJob({ title: 'Product Designer', company: 'Goodwell', location: 'Lagos', category: 'Design', code: 'DES-204' }), createJob({ title: 'Backend Engineer', status: 'closed', code: 'ENG-512' })]);
    const result = await request(app).get('/api/jobs').query({ search: 'Northstar', location: 'Remote', jobType: 'full-time', category: 'Engineering', status: 'open' }).expect(200);
    expect(result.body.data.jobs).toHaveLength(1); expect(result.body.data.jobs[0].title).toBe('Platform Engineer');
  });
  it('requires a completed profile and prevents duplicate applications', async () => {
    const job = await createJob();
    await request(app).post(`/api/jobs/${job.id}/apply`).set('Authorization', `Bearer ${applicantToken}`).expect(422);
    await ApplicantProfile.create({ userId: applicant.id, fullName: 'Applicant', phone: '+233000', bio: 'An experienced applicant.', skills: ['Node.js'], experience: 'Three years', education: 'BSc' });
    await request(app).post(`/api/jobs/${job.id}/apply`).set('Authorization', `Bearer ${applicantToken}`).expect(422);
    const first = await request(app).post(`/api/jobs/${job.id}/apply`).set('Authorization', `Bearer ${applicantToken}`)
      .attach('cv', Buffer.from('%PDF-1.4 CV'), { filename: 'candidate-cv.pdf', contentType: 'application/pdf' })
      .attach('coverLetter', Buffer.from('%PDF-1.4 cover'), { filename: 'cover-letter.pdf', contentType: 'application/pdf' })
      .expect(201);
    expect(first.body.data.application.job.title).toBe(job.title);
    expect(first.body.data.application.documents.cv.url).toBe('https://cloudinary.test/cv.pdf');
    await request(app).post(`/api/jobs/${job.id}/apply`).set('Authorization', `Bearer ${applicantToken}`).expect(409);
    expect(await Application.countDocuments()).toBe(1);
  });
  it('allows only admins to update an application status', async () => {
    const job = await createJob();
    const application = await Application.create({ jobId: job.id, applicantId: applicant.id, documents });
    await request(app).patch(`/api/applications/${application.id}/status`).set('Authorization', `Bearer ${applicantToken}`).send({ status: 'shortlisted' }).expect(403);
    const result = await request(app).patch(`/api/applications/${application.id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'shortlisted' }).expect(200);
    expect(result.body.data.application.status).toBe('shortlisted');
  });
});
