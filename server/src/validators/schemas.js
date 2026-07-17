import { z } from 'zod';

const text = (label, max = 5000) => z.string().trim().min(1, `${label} is required`).max(max);
export const signupSchema = z.object({
  name: text('Name', 100), email: z.string().trim().toLowerCase().email(), password: z.string().min(6).max(72),
  role: z.enum(['admin', 'applicant']).default('applicant'),
}).strict();
export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) }).strict();
export const profileSchema = z.object({
  fullName: text('Full name', 120), phone: text('Phone', 40), bio: text('Bio', 500),
  skills: z.array(text('Skill', 60)).min(1, 'At least one skill is required').max(30),
  experience: text('Experience', 3000), education: text('Education', 3000),
}).strict();
export const jobSchema = z.object({
  title: text('Title', 150), description: text('Description', 10000), requirements: z.array(text('Requirement', 500)).min(1).max(30),
  company: text('Company', 150), location: text('Location', 150), salaryRange: text('Salary range', 100),
  jobType: z.enum(['full-time', 'part-time', 'contract']), category: text('Category', 80), featured: z.boolean().optional(),
}).strict();
export const jobUpdateSchema = jobSchema.partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required');
export const jobStatusSchema = z.object({ status: z.enum(['open', 'closed']) }).strict();
export const applicationStatusSchema = z.object({ status: z.enum(['applied', 'reviewed', 'shortlisted', 'rejected']) }).strict();
