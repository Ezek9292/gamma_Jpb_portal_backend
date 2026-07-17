import bcrypt from 'bcrypt';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { ApplicantProfile } from '../src/models/ApplicantProfile.js';
import { Application } from '../src/models/Application.js';
import { Job } from '../src/models/Job.js';
import { User } from '../src/models/User.js';
import { seedJobs } from './seedData.js';

async function upsertUser({ name, email, role }) {
  const passwordHash = await bcrypt.hash('demo123', 12);
  return User.findOneAndUpdate({ email }, { name, email, role, passwordHash }, { upsert: true, new: true, setDefaultsOnInsert: true });
}

async function seed() {
  await connectDatabase();
  const [admin, applicant, daniel, lerato] = await Promise.all([
    upsertUser({ name: 'Departure Admin', email: 'admin@departure.dev', role: 'admin' }),
    upsertUser({ name: 'Amara Okafor', email: 'applicant@departure.dev', role: 'applicant' }),
    upsertUser({ name: 'Daniel Mensah', email: 'daniel@departure.dev', role: 'applicant' }),
    upsertUser({ name: 'Lerato Mokoena', email: 'lerato@departure.dev', role: 'applicant' }),
  ]);

  const profileRows = [
    [applicant, { fullName: 'Amara Okafor', phone: '+234 800 123 4567', bio: 'Frontend developer who enjoys turning complex problems into clear, inclusive product experiences.', skills: ['React', 'JavaScript', 'Accessibility'], experience: 'Frontend Developer — Brightside (2022–present)', education: 'B.Sc. Computer Science — University of Lagos', resumeUrl: '/uploads/resumes/amara-okafor-resume.pdf' }],
    [daniel, { fullName: 'Daniel Mensah', phone: '+233 200 000 001', bio: 'Backend engineer focused on reliable distributed systems.', skills: ['Node.js', 'PostgreSQL', 'AWS'], experience: 'Backend Engineer — Relay', education: 'B.Sc. Computer Science', resumeUrl: '/uploads/resumes/daniel-mensah-cv.pdf' }],
    [lerato, { fullName: 'Lerato Mokoena', phone: '+27 700 000 002', bio: 'Product-minded engineer with a background in design systems.', skills: ['React', 'TypeScript', 'Design systems'], experience: 'Product Engineer — Studio Maji', education: 'B.Des. Interaction Design', resumeUrl: '/uploads/resumes/lerato-mokoena-cv.pdf' }],
  ];
  await Promise.all(profileRows.map(([user, profile]) => ApplicantProfile.findOneAndUpdate({ userId: user.id }, { ...profile, userId: user.id }, { upsert: true, new: true, runValidators: true })));

  const jobs = new Map();
  for (const source of seedJobs) {
    const saved = await Job.findOneAndUpdate({ code: source.code }, { ...source, postedBy: admin.id, postedAt: new Date(`${source.postedAt}T12:00:00.000Z`) }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
    jobs.set(source.code, saved);
  }

  const applications = [
    { jobCode: 'DES-204', user: applicant, status: 'reviewed', appliedAt: '2026-07-13' },
    { jobCode: 'ENG-101', user: daniel, status: 'applied', appliedAt: '2026-07-15' },
    { jobCode: 'ENG-101', user: lerato, status: 'shortlisted', appliedAt: '2026-07-14' },
  ];
  await Promise.all(applications.map(({ jobCode, user, status, appliedAt }) => Application.findOneAndUpdate(
    { jobId: jobs.get(jobCode).id, applicantId: user.id },
    {
      status,
      appliedAt: new Date(`${appliedAt}T12:00:00.000Z`),
      documents: {
        cv: { url: `https://res.cloudinary.com/demo/raw/upload/${user.id}-cv.pdf`, publicId: `seed/${user.id}-cv`, originalName: `${user.name}-cv.pdf` },
        coverLetter: { url: `https://res.cloudinary.com/demo/raw/upload/${user.id}-cover-letter.pdf`, publicId: `seed/${user.id}-cover-letter`, originalName: `${user.name}-cover-letter.pdf` },
      },
    }, { upsert: true, new: true, runValidators: true },
  )));
  console.log(`Seed complete: ${await User.countDocuments()} users, ${await Job.countDocuments()} jobs, ${await Application.countDocuments()} applications`);
}

seed().catch((error) => { console.error(error); process.exitCode = 1; }).finally(disconnectDatabase);
