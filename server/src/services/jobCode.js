import { Job } from '../models/Job.js';

export async function generateJobCode(category) {
  const prefix = category.replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase().padEnd(3, 'X');
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = String(Math.floor(100 + Math.random() * 900));
    const code = `${prefix}-${suffix}`;
    if (!(await Job.exists({ code }))) return code;
  }
  return `${prefix}-${Date.now().toString().slice(-6)}`;
}
