# ✅ RoozgaarSetu — Full-Stack Conversion Todo

> **Goal:** Transform the static RoozgaarSetu display site into a production-ready job portal with real auth, job listings, applications, and dashboards.

---

## Phase 1 — Backend Foundation

### 1.1 Project Setup
- [ ] Initialize `server/` directory with Node.js + TypeScript
- [ ] Install core dependencies: `express`, `prisma`, `@prisma/client`, `zod`, `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `cors`, `dotenv`, `multer`, `cloudinary`
- [ ] Setup `tsconfig.json` for the server
- [ ] Configure `nodemon` + `ts-node` for dev
- [ ] Create `.env` and `.env.example`
- [ ] Setup Express app with middleware (cors, cookie-parser, json body parser)
- [ ] Create Docker Compose with PostgreSQL service

### 1.2 Database
- [ ] Initialize Prisma: `npx prisma init`
- [ ] Write full schema (User, JobSeekerProfile, EmployerProfile, Job, Application, SavedJob, RefreshToken, enums)
- [ ] Run first migration: `npx prisma migrate dev --name init`
- [ ] Generate Prisma client
- [ ] Create `prisma/seed.ts` with demo data (5+ jobs, 2 employers, 3 job seekers)

### 1.3 Auth System
- [ ] `POST /api/auth/register` — hash password, create user + profile stub, send verification email
- [ ] `POST /api/auth/login` — verify credentials, issue access + refresh tokens as httpOnly cookies
- [ ] `POST /api/auth/logout` — clear cookies, delete refresh token from DB
- [ ] `POST /api/auth/refresh` — validate refresh token, issue new access token
- [ ] `GET /api/auth/me` — return current user from token
- [ ] `POST /api/auth/verify-email/:token` — mark user as verified
- [ ] `POST /api/auth/forgot-password` — generate reset token, send email
- [ ] `POST /api/auth/reset-password/:token` — validate token, update password
- [ ] `authMiddleware` — verify JWT, attach user to `req.user`
- [ ] `requireRole(role)` — middleware factory for role-based guards

### 1.4 Jobs API
- [ ] `GET /api/jobs` — paginated, full-text search, filter by location/category/jobType/salary/experience
- [ ] `GET /api/jobs/:id` — single job with employer info
- [ ] `POST /api/jobs` — create job (EMPLOYER only, sets `isApproved: false`)
- [ ] `PUT /api/jobs/:id` — update own job
- [ ] `DELETE /api/jobs/:id` — delete own job
- [ ] `GET /api/jobs/my/listings` — employer's own job list

### 1.5 Applications API
- [ ] `POST /api/applications` — apply to job (JOB_SEEKER), prevent duplicate applications
- [ ] `GET /api/applications/my` — seeker's own applications with job + employer info
- [ ] `GET /api/applications/job/:jobId` — employer sees all applicants for a job
- [ ] `PATCH /api/applications/:id/status` — employer updates status (SHORTLISTED, REJECTED, etc.)
- [ ] `DELETE /api/applications/:id` — seeker withdraws application

### 1.6 Profile API
- [ ] `GET /api/profile/seeker` — fetch seeker profile
- [ ] `PUT /api/profile/seeker` — update seeker profile (name, phone, city, bio, skills, experience, education)
- [ ] `POST /api/profile/seeker/resume` — upload resume PDF to Cloudinary
- [ ] `POST /api/profile/seeker/photo` — upload profile photo to Cloudinary
- [ ] `GET /api/profile/employer` — fetch employer profile
- [ ] `PUT /api/profile/employer` — update employer profile
- [ ] `POST /api/profile/employer/logo` — upload company logo to Cloudinary

### 1.7 Saved Jobs API
- [ ] `POST /api/saved/:jobId` — save job
- [ ] `DELETE /api/saved/:jobId` — unsave job
- [ ] `GET /api/saved` — list saved jobs with full job details

### 1.8 Admin API
- [ ] `GET /api/admin/jobs/pending` — list jobs awaiting approval
- [ ] `PATCH /api/admin/jobs/:id/approve` — approve job
- [ ] `PATCH /api/admin/jobs/:id/reject` — reject with reason
- [ ] `GET /api/admin/users` — list users with role filter
- [ ] `PATCH /api/admin/users/:id/ban` — ban/unban user
- [ ] `GET /api/admin/stats` — total users, jobs, applications, employers

### 1.9 Email Notifications
- [ ] Setup Nodemailer with SMTP config
- [ ] Welcome + email verification template
- [ ] Password reset template
- [ ] Application submitted confirmation (to seeker)
- [ ] New applicant alert (to employer)
- [ ] Application status changed (to seeker)

---

## Phase 2 — Frontend Integration

### 2.1 Setup
- [ ] Install new frontend dependencies: `axios`, `@tanstack/react-query`, `react-hook-form`, `zod`, `@hookform/resolvers`
- [ ] Create `src/api/axiosInstance.ts` — base URL, withCredentials, interceptor for 401 → auto-refresh
- [ ] Create `src/api/` service files: `authApi.ts`, `jobsApi.ts`, `applicationsApi.ts`, `profileApi.ts`, `savedApi.ts`, `adminApi.ts`
- [ ] Create `src/context/AuthContext.tsx` — user state, login, logout, isAuthenticated, role
- [ ] Create `<ProtectedRoute />` and `<RoleRoute />` wrapper components
- [ ] Wrap app in `QueryClientProvider` and `AuthProvider`

### 2.2 Auth Pages
- [ ] `/login` — email/password form, role-based redirect after login
- [ ] `/register` — tabbed form: Job Seeker tab / Employer tab, different fields per role
- [ ] `/forgot-password` — email form
- [ ] `/reset-password/:token` — new password form
- [ ] `/verify-email/:token` — auto-calls API on page load, shows success/failure

### 2.3 Public Pages (wire up existing static)
- [ ] **Homepage (`/`)**: Wire job search bar → navigates to `/jobs?search=...&location=...`; fetch real stats from API for counter section; fetch featured/recent jobs from API
- [ ] **Jobs Listing (`/jobs`)**: Full listing with sidebar filters (location, category, job type, salary range, experience level), pagination, search, sort
- [ ] **Job Detail (`/jobs/:id`)**: Full job info, employer profile card, Apply button (opens modal or navigates — requires login), save button, related jobs
- [ ] **Contact page (`/contact`)**: Wire contact form to `POST /api/contact` (store in DB or send to email)

### 2.4 Shared Components
- [ ] `<JobCard />` — job listing card with save toggle
- [ ] `<JobFilters />` — sidebar filter panel
- [ ] `<SearchBar />` — keyword + location inputs
- [ ] `<ApplicationStatusBadge />` — colored badge per AppStatus
- [ ] `<Pagination />` — page nav component
- [ ] `<EmptyState />` — illustrated empty state with message
- [ ] `<LoadingSpinner />` / skeleton loaders
- [ ] `<Toast />` — global notification system (success, error, info)
- [ ] `<FileUploader />` — drag and drop file upload (resume/logo)
- [ ] `<ConfirmModal />` — reusable confirm dialog

### 2.5 Job Seeker Dashboard (`/dashboard/seeker/`)
- [ ] `overview` — Stats cards (applied, shortlisted, interview, saved), recent activity feed
- [ ] `profile` — Edit personal info, upload photo, upload resume (drag-drop + Cloudinary), skills tag input
- [ ] `applications` — Table/list of applications with job title, company, date, status badge, withdraw button
- [ ] `saved-jobs` — Grid of saved job cards with unsave button

### 2.6 Employer Dashboard (`/dashboard/employer/`)
- [ ] `overview` — Stats cards (active jobs, total applicants, shortlisted), recent applicants list
- [ ] `profile` — Edit company info, upload logo, website, description
- [ ] `post-job` — Multi-step form: Step 1 (title, category, type, location), Step 2 (description, requirements), Step 3 (salary range, experience, skills, deadline), Step 4 (preview + submit)
- [ ] `listings` — Table of own jobs with status (pending/active/expired), edit/delete actions
- [ ] `applicants/:jobId` — List of applicants with profile info, resume link, status dropdown, notes

### 2.7 Admin Panel (`/admin/`)
- [ ] `overview` — Platform stats dashboard with key metrics
- [ ] `pending-jobs` — Approval queue with job preview modal, approve/reject buttons
- [ ] `users` — Searchable user list, role badges, ban toggle

---

## Phase 3 — Quality & Polish

### 3.1 Forms & Validation
- [ ] All forms use React Hook Form + Zod schemas
- [ ] Zod schemas shared/mirrored between client and server
- [ ] Field-level error messages displayed
- [ ] Submit button disabled while loading
- [ ] File upload size and type validation (resume: PDF only, max 5MB; logo/photo: image only, max 2MB)

### 3.2 UX Improvements
- [ ] Global loading states with skeleton screens (not just spinners)
- [ ] Optimistic updates for save/unsave job
- [ ] Debounced search input (300ms)
- [ ] URL-synced filters (search params in URL for shareable filter state)
- [ ] Scroll to top on route change
- [ ] 404 page with navigation
- [ ] Session expiry handling (redirect to login with return URL)

### 3.3 Mobile Responsiveness
- [ ] All dashboard pages are mobile-responsive
- [ ] Job filters collapse to a bottom sheet / drawer on mobile
- [ ] Employer applicant view is scrollable on small screens
- [ ] File upload works on mobile (touch-friendly)

### 3.4 Security
- [ ] Rate limiting on auth endpoints (express-rate-limit)
- [ ] Helmet.js for security headers
- [ ] Input sanitization
- [ ] File type validation server-side (not just client-side)
- [ ] Prevent applying to own job (if employer is also seeker)
- [ ] Admin routes double-verified server-side (not just role cookie)

---

## Phase 4 — DevOps & Finalization

- [ ] Finalize `docker-compose.yml` (postgres + server + client)
- [ ] Write `README.md` with setup steps, env vars, seed instructions
- [ ] Create `package.json` scripts: `dev`, `build`, `start`, `seed`, `migrate`
- [ ] Test complete user flows end-to-end:
  - [ ] Job seeker: register → verify → complete profile → search jobs → apply → track application
  - [ ] Employer: register → complete profile → post job → review applicants → update status
  - [ ] Admin: login → approve job → view stats
- [ ] Remove all hardcoded/mock data from frontend
- [ ] Ensure all API errors show user-friendly messages in the UI

---

## 🔮 Post-Launch (Future Scope)

- [ ] SMS notifications (Twilio / MSG91 for Indian market)
- [ ] Resume builder (guided form → PDF generation)
- [ ] Job alerts via email (daily digest)
- [ ] Employer subscription plans (free tier: 3 jobs; paid: unlimited)
- [ ] Analytics dashboard for employers (views, clicks, apply rate)
- [ ] Skills assessment / micro-tests
- [ ] Multi-language support (Hindi, Marathi)
- [ ] Mobile app (React Native)

---

## 📊 Progress Tracker

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1 — Backend Foundation | 🔴 Not Started | 0% |
| Phase 2 — Frontend Integration | 🔴 Not Started | 0% |
| Phase 3 — Quality & Polish | 🔴 Not Started | 0% |
| Phase 4 — DevOps & Finalization | 🔴 Not Started | 0% |

> Update status: 🔴 Not Started → 🟡 In Progress → 🟢 Complete