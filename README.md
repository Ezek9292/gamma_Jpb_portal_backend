# Departure Job Portal Backend

Express/MongoDB API for the Departure Job Portal MVP. This repository contains the backend only; the existing React frontend remains in its separate project.

## Setup

Prerequisites: Node.js 20+ and MongoDB 7+.

```bash
cd server
npm install
copy .env.example .env
npm run seed
npm run dev
```

On macOS/Linux use `cp .env.example .env`. The backend loads `.env` from either the repository root or `server/`, so an existing root `.env` also works. Set a long random `JWT_SECRET`. `FRONTEND_URL` is accepted as an alias for `CLIENT_ORIGIN`, and `DATABASE_URL` is accepted as an alias for `MONGODB_URI`. The database name defaults to `departure_job_portal` and can be changed with `MONGODB_DB_NAME`. The API defaults to `http://localhost:5000`.

Demo accounts seeded with password `demo123`:

- `applicant@departure.dev`
- `admin@departure.dev`

## Scripts

- `npm run dev` — start with Node watch mode
- `npm start` — production start
- `npm test` — integration test suite
- `npm run test:watch` — tests in watch mode
- `npm run seed` — idempotently seed demo data

## Endpoints

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/` | Public API welcome |
| GET | `/api/health` | Public |
| POST | `/api/auth/signup` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |
| GET, PUT | `/api/applicants/profile` | Applicant |
| POST | `/api/applicants/profile/resume` | Applicant |
| GET | `/api/jobs` | Public |
| GET | `/api/jobs/:id` | Public |
| POST | `/api/jobs` | Admin |
| PUT | `/api/jobs/:id` | Admin |
| PATCH | `/api/jobs/:id/status` | Admin |
| POST | `/api/jobs/:id/apply` | Applicant |
| GET | `/api/applications/me` | Applicant |
| GET | `/api/jobs/:id/applications` | Admin |
| PATCH | `/api/applications/:id/status` | Admin |

Job listing filters can be combined: `search`, `location`, `jobType`, `category`, and `status`.

Job applications use `multipart/form-data` and require two fields: `cv` and `coverLetter`. Both must be PDFs no larger than 5 MB each. The API uploads them to Cloudinary and stores the returned secure URLs on the application.

## Assumptions

- Application CVs and cover letters are stored in Cloudinary as raw PDF assets. Configure `CLOUDINARY_URL`, or all of `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
- The separate applicant-profile resume endpoint retains local PDF/DOC/DOCX storage for backward compatibility with the original API.
- A completed profile requires full name, phone, bio, at least one skill, experience, and education; a resume is optional for applying.
- Public admin signup matches the original MVP behavior. Production deployments should provision or invite administrators instead.

Run verification from `server/` with `npm test`.
