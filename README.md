<<<<<<< HEAD
# 🎓 CareerBridge (Phase 2: Auth, RBAC & User Profiles)

> **MISSION BHARAT Hackathon Challenge #07**  
> *"Career Access for Colleges with No Placement Cell"*

CareerBridge is a unified, cloud-native placement platform built to democratize corporate hiring for over **35,000+ colleges across Tier-2, Tier-3, and rural India** that have no dedicated Training & Placement Officer (TPO) or corporate network.

---

## 🏛️ Architecture Overview

The project is structured as a modular full-stack application:

```
careerbridge/
├── package.json                          # Monorepo scripts for root orchestration
├── .gitignore                            # Production and environment ignore rules
├── .env.example                          # Root environment template
├── README.md                             # Setup, architecture & verification guide
│
├── backend/                              # Node.js + Express + TypeScript REST API
│   ├── package.json                      # Express, Mongoose, Helmet, Cors, Vitest, bcryptjs, jsonwebtoken, cookie-parser
│   ├── tsconfig.json                     # Strict ES2022 / NodeNext TypeScript configuration
│   ├── vitest.config.ts                  # Vitest configuration for backend testing
│   ├── .env.example                      # Backend environment placeholders
│   ├── .env                              # Local backend environment
│   └── src/
│       ├── app.ts                        # Express application factory with security headers & cookie parsing
│       ├── server.ts                     # Lifecycle listener & graceful SIGINT/SIGTERM shutdown
│       ├── config/
│       │   ├── env.ts                    # Environment variables validation & JWT config
│       │   └── db.ts                     # Fault-tolerant Mongoose connector (non-blocking)
│       ├── models/
│       │   └── user.model.ts             # User Mongoose schema with role-specific profiles & score calculation
│       ├── utils/
│       │   └── auth.ts                   # Password hashing, password strength checker, JWT signing/verification
│       ├── middlewares/
│       │   ├── auth.ts                   # authenticate & authorizeRole RBAC middlewares
│       │   ├── rateLimiter.ts            # Rate limiting for auth endpoints (30 req / 15 min)
│       │   ├── errorHandler.ts           # Centralized standardized JSON error response
│       │   └── notFoundHandler.ts        # 404 handler returning structured JSON
│       ├── controllers/
│       │   ├── auth.controller.ts        # Register, login, logout, getMe handlers
│       │   ├── user.controller.ts        # Update profile with strict allowlist & role protection
│       │   └── health.controller.ts      # Diagnostic controller for /api/health
│       ├── routes/
│       │   ├── index.ts                  # Central API router
│       │   ├── auth.routes.ts            # /api/auth routes
│       │   ├── user.routes.ts            # /api/users routes
│       │   └── health.routes.ts          # /api/health route
│       ├── types/
│       │   ├── index.ts                  # Shared backend contracts (SafeUser, Roles, HealthCheckData)
│       │   └── express.d.ts              # Express Request augmentation with req.user
│       └── __tests__/
│           ├── auth.test.ts              # Auth validators, tokens, registration & profile tests (20 tests)
│           ├── rbac.test.ts              # Role-Based Access Control authorization tests (12 tests)
│           └── health.test.ts            # System health diagnostics tests (3 tests)
│
└── frontend/                             # React 18 + Vite + TypeScript + Tailwind CSS
    ├── package.json                      # React, Tailwind, Lucide React, Vitest, testing-library
    ├── vite.config.ts                    # Vite config with Vitest & JSDOM setup
    ├── tsconfig.json                     # Client TypeScript compiler settings
    ├── tailwind.config.js                # Custom Mission Bharat brand color palette
    ├── postcss.config.js                 # PostCSS autoprefixer & Tailwind configuration
    ├── index.html                        # Application entry HTML with Google Fonts
    ├── .env.example                      # Frontend environment template
    ├── .env                              # Local frontend environment
    └── src/
        ├── App.tsx                       # Main layout and view state orchestration
        ├── main.tsx                      # DOM mount point
        ├── index.css                     # Tailwind directives and utility classes
        ├── vite-env.d.ts                 # Vite client environment typing
        ├── types/                        # Shared frontend data contracts
        ├── context/
        │   └── AuthContext.tsx           # Centralized Authentication Provider & State
        ├── services/
        │   └── api.ts                    # API client with credentials: 'include' & token headers
        ├── components/
        │   ├── Navbar.tsx                # Responsive header with role pill & auth actions
        │   ├── Hero.tsx                  # Mission Bharat problem statement & impact stats
        │   ├── SystemHealthBanner.tsx    # Live /api/health monitor & interactive JSON viewer
        │   ├── ValueProps.tsx            # 4 core pillars solving rural/Tier-3 placement gap
        │   ├── RoleCards.tsx             # Interactive stakeholder onboarding triggers
        │   ├── RegisterView.tsx          # Multi-role registration with real-time validation
        │   ├── LoginView.tsx             # Secure login form with error feedback
        │   ├── DashboardView.tsx         # Role-specific portal with profile completion meter
        │   ├── ProfileEditView.tsx       # Profile editor with tag chips & immutable field locks
        │   ├── UnauthorizedView.tsx      # HTTP 403 Forbidden access-denied state
        │   └── Footer.tsx                # Roadmap and hackathon attribution
        └── __tests__/
            ├── setup.ts                  # @testing-library/jest-dom setup
            ├── App.test.tsx              # Application layout & initial rendering tests (3 tests)
            └── auth.test.tsx             # Auth forms, RBAC views, and profile edit tests (8 tests)
```

---

## 🔒 Security Architecture & RBAC Rules

### 1. Password Security
- Passwords are validated server-side for complexity: minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol.
- Salted hashing using **`bcryptjs`** (12 rounds).
- Plaintext passwords and hashes are never returned in API responses or logged.

### 2. Session Management
- Short-lived JWT access tokens delivered via **`HttpOnly`** cookies (`cb_token`) with `sameSite: 'lax'`, `secure` in production, and standard 7-day expiration.
- Dual-support for `Authorization: Bearer <token>` headers for programmatic API consumers and automated test runners.
- Logout clears the authentication cookie and resets frontend context.

### 3. Role-Based Access Control (RBAC) Matrix

| Operation / Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- |
| `POST /api/auth/register` | Public | Register as `STUDENT`, `EMPLOYER`, or `COLLEGE` |
| `POST /api/auth/login` | Public | Authenticate with rate limiting |
| `POST /api/auth/logout` | Authenticated | Clears `cb_token` cookie |
| `GET /api/auth/me` | Authenticated | Retrieves current authenticated user session |
| `GET /api/users/me` | Authenticated | Retrieves user's own profile and role-specific details |
| `PATCH /api/users/me` | Authenticated | Updates allowed fields for user's own profile only |

#### Role Permissions:
- **`STUDENT`**: Can update skills, degree/branch, graduation year, career interests, and work locations. Cannot access employer-only or college-only features. Role and email are immutable.
- **`EMPLOYER`**: Can update organization name, industry sector, headquarters location, company description, and target hiring roles. Cannot access student-only or college-only operations.
- **`COLLEGE`**: Can update institution profile, campus location, accreditation/type, and placement cell contact details. Cannot access employer or student operations.
- **Privilege Escalation Prevention**: `PATCH /api/users/me` rejects any request containing `role`, `email`, `_id`, or `passwordHash` with HTTP `400 Bad Request`.

### 4. Rate Limiting
- `express-rate-limit` enforces a maximum of 30 attempts per 15-minute window on `/api/auth/register` and `/api/auth/login`.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v24.x tested)
- **npm**: v9.0.0 or higher
- **MongoDB**: (Optional for viewing UI; required for live registration persistence). When MongoDB is offline, the backend starts gracefully in degraded mode (responding to `/api/health` with HTTP 200).

### 2. Workspace Setup
```bash
cd C:\Users\Lenovo\.gemini\antigravity\scratch\careerbridge
```

### 3. Installation
Install dependencies for both backend and frontend:
```bash
npm run install:all
```

### 4. Environment Configuration
Verify `.env` in both folders (created from `.env.example`):

**Backend (`backend/.env`)**:
```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/careerbridge
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_placeholder
JWT_EXPIRES_IN=7d
```

**Frontend (`frontend/.env`)**:
```ini
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🏃 Running the Application

### Running Backend API
```bash
npm run dev:backend
# Or from backend/: cd backend && npm run dev
```
- API Base: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`
- API Index: `http://localhost:5000/api`

### Running Frontend Application
```bash
npm run dev:frontend
# Or from frontend/: cd frontend && npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🧪 Automated Testing

Both backend and frontend are powered by **Vitest**:

```bash
# Run all backend tests (35 tests)
npm --prefix backend test

# Run all frontend tests (11 tests)
npm --prefix frontend test

# Run monorepo test suite from root
npm test
```

### Test Coverage Highlights:
- **Backend (35 Tests)**:
  - Password strength validation: rejects short, missing uppercase, missing numbers, missing symbols (6 tests)
  - JWT token generation, tampering detection, and decoding (2 tests)
  - Student profile completion score weighted algorithm (2 tests)
  - Registration input validation pre-database checks (4 tests)
  - Missing and invalid token rejection (2 tests)
  - Logout cookie clearing (1 test)
  - Role modification & privilege escalation rejection (2 tests)
  - Auth rate limiting response headers (1 test)
  - Role-Based Access Control authorization middleware across roles (12 tests)
  - System health diagnostics & RFC 404 response handling (3 tests)
- **Frontend (11 Tests)**:
  - Multi-role selection & dynamic form field switching (Student/College/Employer)
  - Password confirmation and strength inline validation
  - Login failure error presentation
  - Authenticated dashboard rendering with profile strength meter
  - Profile edit view with disabled immutable identity locks
  - HTTP 403 Forbidden Access-Denied view
  - Brand identity and hackathon context rendering

---

## 🗺️ Mission Bharat Hackathon Roadmap
- ✅ **Phase 1: Project Foundation** (Folder structure, Express API, Vite/React UI, Health check, Vitest suite, Error handling, DB tolerance)
- ✅ **Phase 2: Authentication, Role-Based Access Control & User Profiles** (Bcrypt hashing, JWT HttpOnly cookies, RBAC middleware, student profile completion score, profile editor, rate limiting)
- ⏳ **Phase 3: Automated Placement Cell & Cohort Management** (Batch onboarding, student roster verification, institutional TPO portal)
- ⏳ **Phase 4: ICAN Sandbox Skill Assessment Integration** (Standardized technical benchmarking)
- ⏳ **Phase 5: Regional Pooled Recruitment Drives & Employer Matchmaking**
=======
# GLA-Project
This is the first hackathon
>>>>>>> 12449696c395ed2ad233c8f2104823a074b2097e
