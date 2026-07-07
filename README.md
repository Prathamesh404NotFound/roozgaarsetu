# Windsurf Prompt — RoozgaarSetu: Static → Fully Functional Job Portal

---

## 🧭 Project Context

**RoozgaarSetu** (रोज़गार सेतु) means "Employment Bridge" — a platform connecting job seekers with employers, targeted at Indian users (primarily Hindi/Marathi-speaking regions). The current site is a **static display website** (React/Vite SPA) with no real backend, no authentication, no data persistence, and no actual job flow. 

Your task is to **transform it into a production-ready full-stack job portal** while preserving the existing UI/visual identity wherever possible and extending it purposefully.

---

## 🏗️ Tech Stack

### Frontend (keep existing)
- React + Vite + TypeScript
- Tailwind CSS
- Framer Motion (for animations)
- Lucide React (icons)
- React Router DOM v6 (routing)
- React Hook Form + Zod (form validation)
- Axios (API calls)
- React Query / TanStack Query (server state management)

### Backend (new)
- **Runtime**: Node.js with Express.js (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT (access + refresh tokens) stored in httpOnly cookies
- **File Storage**: Cloudinary (for resumes, profile photos, company logos)
- **Email**: Nodemailer with Gmail SMTP or Resend API
- **Search**: PostgreSQL full-text search (pg_trgm) — no need for external search engine at this stage
- **Validation**: Zod (shared between frontend and backend)

### Infrastructure
- **Dev**: Docker Compose (postgres + backend + frontend)
- **Env management**: `.env` files with `.env.example` committed

---

## 👥 User Roles

1. **Job Seeker** — Browse jobs, create profile, upload resume, apply to jobs, track applications
2. **Employer** — Register company, post jobs, manage applicants, schedule interviews
3. **Admin** — Approve/reject job posts, manage users, view analytics (basic)

---

## 📁 Project Structure to Create

```
roozgaarsetu/
├── client/                  # Existing React/Vite frontend (extend this)
│   ├── src/
│   │   ├── api/             # Axios instance + API service files
│   │   ├── components/      # Shared UI components
│   │   ├── pages/           # Route-level pages
│   │   ├── hooks/           # Custom hooks
│   │   ├── context/         # Auth context, Toast context
│   │   ├── types/           # Shared TypeScript types
│   │   └── utils/
│   └── vite.config.ts
│
├── server/                  # New Express backend
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── utils/
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── tsconfig.json
│
├── docker-compose.yml
└── .env.example
```

---

## 🗄️ Database Schema (Prisma)

Create `server/prisma/schema.prisma` with the following models:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  role          Role      @default(JOB_SEEKER)
  isVerified    Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  jobSeeker     JobSeekerProfile?
  employer      EmployerProfile?
  refreshTokens RefreshToken[]
}

enum Role {
  JOB_SEEKER
  EMPLOYER
  ADMIN
}

model JobSeekerProfile {
  id            String    @id @default(cuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id])
  fullName      String
  phone         String?
  city          String?
  state         String?
  bio           String?
  skills        String[]
  resumeUrl     String?
  profilePhoto  String?
  experience    Int?      // years
  education     String?
  applications  Application[]
  savedJobs     SavedJob[]
}

model EmployerProfile {
  id            String    @id @default(cuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id])
  companyName   String
  companyLogo   String?
  website       String?
  industry      String?
  city          String?
  state         String?
  description   String?
  jobs          Job[]
}

model Job {
  id              String    @id @default(cuid())
  employerId      String
  employer        EmployerProfile @relation(fields: [employerId], references: [id])
  title           String
  description     String
  requirements    String
  location        String
  jobType         JobType   @default(FULL_TIME)
  salaryMin       Int?
  salaryMax       Int?
  experienceMin   Int?      // years
  skills          String[]
  category        String
  isActive        Boolean   @default(true)
  isApproved      Boolean   @default(false) // admin approval
  deadline        DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  applications    Application[]
  savedBy         SavedJob[]
}

enum JobType {
  FULL_TIME
  PART_TIME
  CONTRACT
  INTERNSHIP
  FREELANCE
}

model Application {
  id            String    @id @default(cuid())
  jobId         String
  job           Job       @relation(fields: [jobId], references: [id])
  seekerId      String
  seeker        JobSeekerProfile @relation(fields: [seekerId], references: [id])
  status        AppStatus @default(APPLIED)
  coverLetter   String?
  resumeUrl     String?
  appliedAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([jobId, seekerId])
}

enum AppStatus {
  APPLIED
  SHORTLISTED
  INTERVIEW_SCHEDULED
  REJECTED
  HIRED
}

model SavedJob {
  id        String   @id @default(cuid())
  jobId     String
  job       Job      @relation(fields: [jobId], references: [id])
  seekerId  String
  seeker    JobSeekerProfile @relation(fields: [seekerId], references: [id])
  savedAt   DateTime @default(now())

  @@unique([jobId, seekerId])
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

---

## 🔌 Backend API Endpoints

### Auth (`/api/auth`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/register` | Register (role: JOB_SEEKER or EMPLOYER) |
| POST | `/login` | Login, return JWT in httpOnly cookie |
| POST | `/logout` | Clear tokens |
| POST | `/refresh` | Refresh access token |
| POST | `/verify-email/:token` | Verify email after registration |
| POST | `/forgot-password` | Send reset email |
| POST | `/reset-password/:token` | Reset password |

### Jobs (`/api/jobs`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | Public | List approved active jobs (paginated, filterable) |
| GET | `/:id` | Public | Get single job detail |
| POST | `/` | EMPLOYER | Create job post |
| PUT | `/:id` | EMPLOYER (owner) | Update job |
| DELETE | `/:id` | EMPLOYER (owner) | Delete job |
| GET | `/my/listings` | EMPLOYER | Get employer's own job listings |

**Query params for GET /api/jobs:**
`?search=`, `?location=`, `?category=`, `?jobType=`, `?experienceMin=`, `?salaryMin=`, `?page=`, `?limit=`

### Applications (`/api/applications`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/` | JOB_SEEKER | Apply to a job |
| GET | `/my` | JOB_SEEKER | My applications |
| GET | `/job/:jobId` | EMPLOYER | Applications for a job |
| PATCH | `/:id/status` | EMPLOYER | Update application status |
| DELETE | `/:id` | JOB_SEEKER | Withdraw application |

### Profile (`/api/profile`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/seeker` | JOB_SEEKER | Get my seeker profile |
| PUT | `/seeker` | JOB_SEEKER | Update seeker profile |
| POST | `/seeker/resume` | JOB_SEEKER | Upload resume (Cloudinary) |
| GET | `/employer` | EMPLOYER | Get my employer profile |
| PUT | `/employer` | EMPLOYER | Update employer profile |
| POST | `/employer/logo` | EMPLOYER | Upload company logo |

### Saved Jobs (`/api/saved`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/:jobId` | JOB_SEEKER | Save a job |
| DELETE | `/:jobId` | JOB_SEEKER | Unsave a job |
| GET | `/` | JOB_SEEKER | Get saved jobs |

### Admin (`/api/admin`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/jobs/pending` | ADMIN | Pending approval jobs |
| PATCH | `/jobs/:id/approve` | ADMIN | Approve job |
| PATCH | `/jobs/:id/reject` | ADMIN | Reject job |
| GET | `/users` | ADMIN | List all users |
| PATCH | `/users/:id/ban` | ADMIN | Ban a user |
| GET | `/stats` | ADMIN | Dashboard stats |

---

## 🖥️ Frontend Pages to Create / Connect

### Public Pages (extend existing static pages)
1. **`/`** — Hero + Job Search Bar (connected to API), Featured Jobs section, How It Works, Stats counter (live from API), CTA
2. **`/jobs`** — Job listings with sidebar filters (location, category, type, salary range, experience), pagination, search
3. **`/jobs/:id`** — Job detail page with Apply button (auth-gated), company info, related jobs
4. **`/companies`** — Employer directory
5. **`/about`**, **`/contact`** — Static but wired to a contact form endpoint

### Auth Pages
6. **`/login`** — Unified login with role-based redirect
7. **`/register`** — Two-tab form: Job Seeker / Employer
8. **`/forgot-password`** — Email form
9. **`/reset-password/:token`** — New password form
10. **`/verify-email/:token`** — Email verification handler page

### Job Seeker Dashboard (`/dashboard/seeker/`)
11. **`overview`** — Stats: applied, shortlisted, interviews, saved
12. **`profile`** — Edit profile, upload photo and resume
13. **`applications`** — Application history with status badges
14. **`saved-jobs`** — Bookmarked jobs

### Employer Dashboard (`/dashboard/employer/`)
15. **`overview`** — Job post stats, recent applicants
16. **`profile`** — Edit company profile, upload logo
17. **`post-job`** — Multi-step job posting form
18. **`listings`** — All posted jobs with status (draft/pending/active/expired)
19. **`applicants/:jobId`** — Applicants for a specific job, with status update buttons

### Admin Panel (`/admin/`)
20. **`overview`** — Platform stats cards
21. **`pending-jobs`** — Approve/reject queue
22. **`users`** — User management table

---

## 🔐 Auth Flow Details

1. On register: hash password (bcrypt), create user + profile stub, send verification email
2. On login: verify password, generate access token (15min) + refresh token (7 days), set both as httpOnly cookies
3. Protected routes: `authMiddleware` checks access token; if expired, auto-refresh using refresh token cookie
4. Role guard middleware: `requireRole('EMPLOYER')` etc.
5. Frontend: `AuthContext` stores user object (decoded from `/api/auth/me`), provides `isAuthenticated`, `user`, `login()`, `logout()`

---

## 📧 Email Templates

Create HTML email templates for:
- Welcome + email verification
- Password reset
- Application received confirmation (to seeker)
- New applicant notification (to employer)
- Application status update (to seeker)

---

## 🧩 Key Components to Build on Frontend

- `<JobCard />` — Job listing card with company logo, title, location, type badge, salary, save button
- `<JobFilters />` — Sidebar with checkboxes, range sliders, location dropdown
- `<ApplicationStatusBadge />` — Color-coded status chip
- `<ProtectedRoute />` — Wrapper for auth + role-gated routes
- `<ResumeUploader />` — Drag and drop resume upload to Cloudinary
- `<DashboardSidebar />` — Role-based nav sidebar
- `<JobPostForm />` — Multi-step form for employers (step 1: basics, step 2: details, step 3: requirements, step 4: preview)
- `<SearchBar />` — Homepage hero search (keyword + location)
- `<Pagination />` — Reusable paginator
- `<EmptyState />` — Illustrated empty states for no jobs, no applications, etc.

---

## ⚙️ Environment Variables

Create `.env.example` in root:

```env
# Server
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/roozgaarsetu
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CLIENT_URL=http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=noreply@roozgaarsetu.com

# Client
VITE_API_URL=http://localhost:5000/api
```

---

## 🐳 Docker Setup

Create `docker-compose.yml`:

```yaml
version: "3.9"
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: roozgaarsetu
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  server:
    build: ./server
    depends_on:
      - db
    ports:
      - "5000:5000"
    env_file:
      - .env
    volumes:
      - ./server:/app

  client:
    build: ./client
    ports:
      - "5173:5173"
    env_file:
      - .env

volumes:
  pgdata:
```

---

## 🚀 Implementation Order

Follow this sequence exactly:

1. **Server setup** — Express + TypeScript boilerplate, Prisma init, DB connection
2. **Auth system** — Register, login, JWT middleware, email verification
3. **Jobs API** — CRUD with filters, admin approval flow
4. **Applications API** — Apply, status updates, seeker/employer views
5. **Profile API** — Seeker and employer profile + Cloudinary upload
6. **Saved Jobs API** — Save/unsave
7. **Admin API** — Approval queue + stats
8. **Frontend Auth** — AuthContext, login/register pages, protected routes
9. **Frontend Jobs** — Jobs listing page, job detail page, filters
10. **Frontend Dashboards** — Seeker dashboard, employer dashboard
11. **Frontend Admin** — Admin panel (minimal but functional)
12. **Email notifications** — Hook into existing flows
13. **Docker + `.env.example`** — Finalize dev setup
14. **Seed script** — Create `prisma/seed.ts` with sample jobs, users, companies for demo

---

## ✅ Definition of Done

A feature is complete when:
- API endpoint is tested and returns correct responses for success and error cases
- Frontend is connected to the real API (no mock data left)
- Loading states and error states are handled in the UI
- Auth is enforced on all protected routes (both server and client)
- Forms have validation (Zod schema, matching front and back)
- Mobile responsive layout maintained

---

## 📝 Notes

- Keep the existing landing page design intact — only **wire up** the search bar, stats counters, and featured jobs to real API data
- The job search on the homepage should navigate to `/jobs?search=...&location=...`
- All currency/salary values should be in Indian Rupees (₹)
- Add `category` field values relevant to Indian job market: IT/Software, Manufacturing, Healthcare, Education, Finance, Retail, Construction, Agriculture, Hospitality, Government
- Support Hindi characters in all text fields (ensure UTF-8 encoding throughout)
- Prioritize mobile responsiveness — a large share of Indian job seekers use mobile