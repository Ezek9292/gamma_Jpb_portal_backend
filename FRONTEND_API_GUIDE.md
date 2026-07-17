# Departure Job Portal API — Frontend Integration Guide

This document describes the HTTP contract for integrating a frontend with the Departure Job Portal backend.

## 1. Base URL

Replace the placeholder below with the deployed Render Web Service URL:

```js
const API_BASE_URL = 'https://YOUR-RENDER-SERVICE.onrender.com/api';
```

Examples in this guide assume that `/api` is included in `API_BASE_URL`.

Public service checks:

```http
GET https://YOUR-RENDER-SERVICE.onrender.com/
GET https://YOUR-RENDER-SERVICE.onrender.com/api/health
```

Health response:

```json
{
  "success": true,
  "data": { "status": "ok" }
}
```

## 2. Response format

Successful requests:

```json
{
  "success": true,
  "data": {}
}
```

Failed requests:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

`errors` is normally empty except for request or database validation failures.

## 3. Authentication

Signup and login return a JWT in `data.token`. Store it for the session and send it on every protected request:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

MVP storage example:

```js
localStorage.setItem('departure_token', response.data.token);
```

Reusable request helper:

```js
async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('departure_token');
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.message || 'Request failed');
    error.status = response.status;
    error.errors = payload.errors || [];
    throw error;
  }

  return payload.data;
}
```

Do not manually set `Content-Type` when sending `FormData`; the browser must add the multipart boundary.

## 4. Core data shapes

### User

```js
{
  id: 'MongoDB object ID',
  name: 'Amara Okafor',
  email: 'amara@example.com',
  role: 'applicant', // applicant | admin
  createdAt: 'ISO date',
  updatedAt: 'ISO date'
}
```

### Applicant profile

```js
{
  id: 'MongoDB object ID',
  userId: 'MongoDB object ID',
  fullName: 'Amara Okafor',
  phone: '+233 000 000 000',
  bio: 'Frontend engineer...',
  skills: ['React', 'JavaScript'],
  experience: 'Three years of experience...',
  education: 'BSc Computer Science',
  resumeUrl: '/uploads/resumes/example.pdf',
  createdAt: 'ISO date',
  updatedAt: 'ISO date'
}
```

### Job

```js
{
  id: 'MongoDB object ID',
  title: 'Frontend Engineer',
  code: 'ENG-123',
  description: 'Role description',
  requirements: ['Three years of experience'],
  company: 'Departure',
  location: 'Remote',
  salaryRange: '$40k-$60k',
  jobType: 'full-time', // full-time | part-time | contract
  category: 'Engineering',
  postedBy: 'Admin user ID',
  status: 'open', // open | closed
  postedAt: 'ISO date',
  featured: false,
  createdAt: 'ISO date',
  updatedAt: 'ISO date'
}
```

### Application

```js
{
  id: 'MongoDB object ID',
  jobId: 'MongoDB object ID',
  applicantId: 'MongoDB object ID',
  status: 'applied', // applied | reviewed | shortlisted | rejected
  appliedAt: 'ISO date',
  documents: {
    cv: {
      url: 'Cloudinary HTTPS URL',
      publicId: 'Cloudinary public ID',
      originalName: 'amara-cv.pdf'
    },
    coverLetter: {
      url: 'Cloudinary HTTPS URL',
      publicId: 'Cloudinary public ID',
      originalName: 'amara-cover-letter.pdf'
    }
  },
  createdAt: 'ISO date',
  updatedAt: 'ISO date'
}
```

Applicant application-list responses also include a populated `job` property. Admin job-application responses include a `profile` property.

## 5. Authentication endpoints

### Create an account

```http
POST /auth/signup
```

Request:

```json
{
  "name": "Amara Okafor",
  "email": "amara@example.com",
  "password": "password123",
  "role": "applicant"
}
```

Rules:

- `name`: required, maximum 100 characters
- `email`: required and unique; normalized to lowercase
- `password`: 6–72 characters
- `role`: `applicant` or `admin`; defaults to `applicant`

Response: `201 Created`

```json
{
  "success": true,
  "data": {
    "token": "JWT_TOKEN",
    "user": {
      "id": "USER_ID",
      "name": "Amara Okafor",
      "email": "amara@example.com",
      "role": "applicant",
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  }
}
```

### Log in

```http
POST /auth/login
```

Request:

```json
{
  "email": "amara@example.com",
  "password": "password123"
}
```

Response: `200 OK`, with the same `data.token` and `data.user` shape as signup.

### Restore the authenticated user

```http
GET /auth/me
Authorization: Bearer JWT_TOKEN
```

Response:

```json
{
  "success": true,
  "data": { "user": {} }
}
```

Call this endpoint when the app starts if a token exists. On `401`, clear the saved token and return the user to the login page.

## 6. Applicant profile endpoints

All profile endpoints require an authenticated applicant token.

### Get the current profile

```http
GET /applicants/profile
```

Response:

```json
{
  "success": true,
  "data": { "profile": {} }
}
```

Returns `404` when the applicant has not created a profile. The frontend should treat this as `profile = null`, not as a fatal application error.

### Create or update the profile

```http
PUT /applicants/profile
```

Request:

```json
{
  "fullName": "Amara Okafor",
  "phone": "+233 000 000 000",
  "bio": "Frontend engineer focused on accessible products.",
  "skills": ["React", "JavaScript"],
  "experience": "Three years building production applications.",
  "education": "BSc Computer Science"
}
```

All six fields are required. `skills` must contain 1–30 non-empty strings. `bio` has a maximum of 500 characters.

### Legacy profile resume upload

```http
POST /applicants/profile/resume
Content-Type: multipart/form-data
```

Form field:

- `resume`: PDF, DOC, or DOCX; maximum 5 MB

This endpoint uses local server storage and exists for compatibility. For job applications, use the Cloudinary-backed `cv` and `coverLetter` fields described below.

## 7. Public job endpoints

### List jobs

```http
GET /jobs
```

Optional query parameters can be combined:

| Parameter | Meaning | Example |
| --- | --- | --- |
| `search` | Case-insensitive title or company search | `frontend` |
| `location` | Exact location match | `Remote` |
| `jobType` | `full-time`, `part-time`, or `contract` | `full-time` |
| `category` | Exact category match | `Engineering` |
| `status` | `open` or `closed` | `open` |

Example:

```http
GET /jobs?search=engineer&location=Remote&jobType=full-time&status=open
```

Response:

```json
{
  "success": true,
  "data": { "jobs": [] }
}
```

Jobs are sorted newest first.

Frontend example:

```js
const params = new URLSearchParams({
  search: searchText,
  location,
  jobType,
  category,
  status: 'open',
});

const { jobs } = await apiRequest(`/jobs?${params}`);
```

Avoid adding keys with empty values if they are not active filters.

### Get one job

```http
GET /jobs/:id
```

Response:

```json
{
  "success": true,
  "data": { "job": {} }
}
```

Returns `400` for an invalid MongoDB ID and `404` when the job does not exist.

## 8. Admin job endpoints

These endpoints require an authenticated admin token.

### Create a job

```http
POST /jobs
```

Request:

```json
{
  "title": "Frontend Engineer",
  "description": "Build accessible web products.",
  "requirements": ["Three years of React experience"],
  "company": "Departure",
  "location": "Remote",
  "salaryRange": "$40k-$60k",
  "jobType": "full-time",
  "category": "Engineering",
  "featured": false
}
```

Do not send `id`, `code`, `postedBy`, `postedAt`, or `status`; the API generates them. Returns `201 Created` with `data.job`.

### Update a job

```http
PUT /jobs/:id
```

Send any non-empty subset of the create-job fields. Returns the updated `data.job`.

### Open or close a job

```http
PATCH /jobs/:id/status
```

Request:

```json
{ "status": "closed" }
```

Allowed values: `open`, `closed`.

## 9. Applying for a job

Only authenticated applicants can apply.

```http
POST /jobs/:id/apply
Content-Type: multipart/form-data
Authorization: Bearer JWT_TOKEN
```

Required form fields:

| Field | Type | Rules |
| --- | --- | --- |
| `cv` | File | PDF only, maximum 5 MB |
| `coverLetter` | File | PDF only, maximum 5 MB |

Frontend example:

```js
async function applyToJob(jobId, cvFile, coverLetterFile) {
  const formData = new FormData();
  formData.append('cv', cvFile);
  formData.append('coverLetter', coverLetterFile);

  return apiRequest(`/jobs/${jobId}/apply`, {
    method: 'POST',
    body: formData,
  });
}
```

Successful response: `201 Created`

```json
{
  "success": true,
  "data": {
    "application": {
      "id": "APPLICATION_ID",
      "jobId": "JOB_ID",
      "applicantId": "APPLICANT_ID",
      "status": "applied",
      "documents": {
        "cv": {
          "url": "https://res.cloudinary.com/...pdf",
          "publicId": "departure-job-portal/applications/...",
          "originalName": "candidate-cv.pdf"
        },
        "coverLetter": {
          "url": "https://res.cloudinary.com/...pdf",
          "publicId": "departure-job-portal/applications/...",
          "originalName": "cover-letter.pdf"
        }
      },
      "job": {}
    }
  }
}
```

Application rules:

- The applicant must have a completed profile.
- The job must exist and have `status: "open"`.
- An applicant can apply to each job only once.
- Both documents are required and uploaded to Cloudinary.

Expected errors:

| Status | Meaning |
| --- | --- |
| `400` | Invalid file type, invalid ID, or file larger than 5 MB |
| `401` | Missing, invalid, or expired token |
| `403` | An admin account attempted to apply |
| `404` | Job does not exist |
| `409` | Job is closed or applicant already applied |
| `422` | Profile incomplete, documents missing, or validation failed |
| `502` | Cloudinary could not upload the documents |
| `503` | Cloudinary credentials are not configured on the backend |

## 10. Applicant application history

```http
GET /applications/me
Authorization: Bearer JWT_TOKEN
```

Response:

```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "APPLICATION_ID",
        "jobId": "JOB_ID",
        "applicantId": "APPLICANT_ID",
        "status": "applied",
        "documents": {},
        "job": {}
      }
    ]
  }
}
```

Applications are sorted newest first.

## 11. Admin application endpoints

### View applicants for a job

```http
GET /jobs/:id/applications
Authorization: Bearer ADMIN_JWT_TOKEN
```

Response:

```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "APPLICATION_ID",
        "jobId": "JOB_ID",
        "applicantId": "APPLICANT_ID",
        "status": "applied",
        "documents": {
          "cv": { "url": "https://...", "originalName": "cv.pdf" },
          "coverLetter": { "url": "https://...", "originalName": "cover-letter.pdf" }
        },
        "profile": {
          "fullName": "Amara Okafor",
          "phone": "+233 000 000 000",
          "bio": "...",
          "skills": ["React"],
          "experience": "...",
          "education": "..."
        }
      }
    ]
  }
}
```

Use `application.documents.cv.url` and `application.documents.coverLetter.url` for document links.

### Update application status

```http
PATCH /applications/:id/status
Authorization: Bearer ADMIN_JWT_TOKEN
```

Request:

```json
{ "status": "shortlisted" }
```

Allowed values:

- `applied`
- `reviewed`
- `shortlisted`
- `rejected`

The response contains the updated application in `data.application`.

## 12. HTTP status reference

| Status | Frontend handling |
| --- | --- |
| `200` | Request succeeded |
| `201` | Resource created successfully |
| `400` | Show the request/file error to the user |
| `401` | Clear stale token and redirect to login |
| `403` | Show an unauthorized/incorrect-role state |
| `404` | Show a not-found or empty-profile state as appropriate |
| `409` | Show conflict message, such as duplicate application |
| `422` | Display validation errors beside the relevant fields |
| `500+` | Show a retryable service error; retain the user's form state |

## 13. Recommended frontend startup flow

1. Request `GET /jobs` for public listings.
2. Read the JWT from storage.
3. If a token exists, request `GET /auth/me`.
4. If the user is an applicant, request `GET /applicants/profile` and `GET /applications/me`.
5. If the user is an admin, load jobs and request `GET /jobs/:id/applications` when an applicant list is opened.
6. On any authentication `401`, clear the token and redirect to login.

## 14. CORS requirement

The backend permits the origin configured in its `CLIENT_ORIGIN` or `FRONTEND_URL` environment variable. The deployed frontend URL must be added to the Render backend environment exactly, including `https://` and without an incorrect path.

Example:

```env
CLIENT_ORIGIN=https://departure-portal.example.com
```

After changing the value, redeploy or restart the backend service.
