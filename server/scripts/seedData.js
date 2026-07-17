const job = (code, title, company, location, category, postedAt, overrides = {}) => ({
  code, title, company, location, category, postedAt,
  description: `${title} opportunity at ${company}. Join the team and make a measurable impact in this role.`,
  requirements: ['Relevant professional experience', 'Strong communication and problem-solving skills'],
  salaryRange: '$30k–$60k', jobType: 'full-time', status: 'open', featured: false, ...overrides,
});

export const seedJobs = [
  job('ENG-101', 'Senior Frontend Engineer', 'Northstar Labs', 'Lagos, Nigeria', 'Engineering', '2026-07-14', { salaryRange: '$55k–$75k', featured: true }),
  job('DES-204', 'Product Designer', 'Goodwell Health', 'Remote', 'Design', '2026-07-12', { salaryRange: '$45k–$62k', featured: true }),
  job('MKT-319', 'Growth Marketing Lead', 'Kora Finance', 'Nairobi, Kenya', 'Marketing', '2026-07-10', { salaryRange: '$48k–$65k' }),
  job('OPS-408', 'Customer Operations Specialist', 'Relay Commerce', 'Accra, Ghana', 'Operations', '2026-07-09', { salaryRange: '$24k–$32k' }),
  job('ENG-512', 'Backend Engineer', 'Northstar Labs', 'Remote', 'Engineering', '2026-07-08', { salaryRange: '$50k–$70k' }),
  job('DATA-617', 'Data Analyst', 'Bloom Energy', 'Cape Town, South Africa', 'Data', '2026-07-06', { salaryRange: '$38k–$50k', jobType: 'contract' }),
  job('DES-728', 'Brand Designer', 'Studio Maji', 'Remote', 'Design', '2026-07-05', { salaryRange: '$28k–$40k', jobType: 'contract' }),
  job('FIN-833', 'Finance Associate', 'Atlas Foods', 'Lagos, Nigeria', 'Finance', '2026-07-04', { salaryRange: '$30k–$42k' }),
  job('PEO-941', 'People & Culture Coordinator', 'Common Ground', 'Kigali, Rwanda', 'People', '2026-07-02', { salaryRange: '$22k–$30k', jobType: 'part-time' }),
  job('ENG-056', 'Mobile Engineer', 'Kora Finance', 'Nairobi, Kenya', 'Engineering', '2026-06-30', { salaryRange: '$48k–$68k' }),
  job('SAL-163', 'Partnerships Manager', 'Edventure', 'Accra, Ghana', 'Sales', '2026-06-28', { salaryRange: '$35k–$48k' }),
  job('CON-276', 'Content Strategist', 'Goodwell Health', 'Remote', 'Marketing', '2026-06-25', { salaryRange: '$25k–$36k', jobType: 'part-time', status: 'closed' }),
];
