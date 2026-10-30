# 🎓 CareerBridge (Phase 19: Advanced Security, Performance & Scalability)

> **MISSION BHARAT Hackathon Challenge #07**  
> *"Career Access for Colleges with No Placement Cell"*

CareerBridge is a unified, cloud-native placement platform built to democratize corporate hiring for over **35,000+ colleges across Tier-2, Tier-3, and rural India** that have no dedicated Training & Placement Officer (TPO) or corporate network.

Phase 19 introduces **Advanced Security, Performance & Scalability**, fortifying the entire application stack before production deployment through OWASP Top 10 defenses, tenant isolation, centralized input validation, file upload signature verification, 4-tier rate limiting, high-speed multi-tenant caching, and database index hardening. Key architectural pillars include:

1. **Multi-Tenant Boundary Enforcement & IDOR Protection**:
   - **Strict Isolation**: `tenantGuard.ts` enforces non-negotiable boundaries for Students, Colleges, and Employers. Prevents Insecure Direct Object References (IDOR) by validating that resource IDs in requests match authenticated `req.user.userId`.
   - **Role Separation**: Dedicated guards (`ensureStudentTenant`, `ensureCollegeTenant`, `ensureEmployerTenant`, and `preventIdor()`) block unauthorized cross-institutional data access while granting administrative governance.

2. **OWASP Top 10 Injection Defense (NoSQL & XSS)**:
   - **Recursive NoSQL Sanitization**: Strips dangerous MongoDB operators starting with `$` (`$gt`, `$ne`, `$where`, `$regex`) and keys containing `.` notation from `req.body`, `req.query`, and `req.params`.
   - **XSS Neutralization**: Recursively removes `<script>` tags, inline event handlers (`onerror=`, `onload=`, `onclick=`), and neutralizes `javascript:` URIs.

3. **Secure File Storage & Magic Byte Signature Verification**:
   - **Cryptographic File Signatures**: `SecureStorageService` inspects buffer magic bytes (`%PDF-` for PDF, `PK\x03\x04` for DOCX, `0x89PNG` for PNG, `0xFFD8FF` for JPEG), rejecting corrupted or executable payloads disguised with safe file extensions.
   - **Path Traversal Defense**: Strips `..`, directory separators, null bytes (`\0`), and control characters.
   - **Strict Size Limits**: Enforces 5MB ceiling for resumes and 2MB for avatar images.

4. **Multi-Tier Rate Limiting Architecture**:
   - **Tier 1 (Auth)**: 30 requests / 15 min protects login, registration, and password checks against brute-force attacks.
   - **Tier 2 (AI Inference)**: 20 requests / 1 min protects ATS scans, mock interview generation, and career guidance.
   - **Tier 3 (Heavy Export)**: 15 requests / 1 min throttles PDF report rendering and file downloads.
   - **Tier 4 (API Ceiling)**: 150 requests / 1 min provides global flood and DoS defense.

5. **Tenant-Partitioned In-Memory LRU Caching**:
   - **Tenant Scoping**: All cache keys partitioned by `cache:tenant:<scopeType>:<scopeId>:<key>` to prevent cross-institution data leakage.
   - **LRU Eviction & TTL**: Automatic Least-Recently-Used eviction when reaching capacity (5,000 entries) with configurable TTL expiration.
   - **Zero Secret Leakage**: Guarantees zero caching of credentials, passwords, or PII.

6. **Database Index Optimization & Duplicate Guards**:
   - Compound indexes on `{ driveId: 1, studentId: 1 }` (unique), `{ studentId: 1, appliedAt: -1 }`, `{ driveId: 1, status: 1 }`, `{ collegeId: 1, status: 1 }`, and `{ mentorId: 1, scheduledStart: 1 }` guarantee high-throughput concurrency and sub-millisecond query execution.

7. **Structured Logging & Telemetry**:
   - Structured JSON logging with request IDs, response durations, HTTP status, and automatic redaction of passwords, tokens, cookies, and API keys (`***REDACTED***`).
   - Enhanced health diagnostics probe (`/api/health`) reporting database status, cache metrics, memory utilization (heap used, RSS), and security status.
   - **Personal Telemetry**: Applications volume, active pipeline tracking, verified job offers, and status distribution.
   - **6-Pillar Composite Readiness Score**: Profile completeness, verified skills, project portfolio, ATS resume quality, and interview readiness.
   - **Module Synergy**: Direct integration with Phase 15 ATS resume scoring, Phase 14 AI mock interview rubric ratings, Phase 16 mentorship sessions, and Phase 17 Learning Hub progress.
   - **Privacy Isolation**: Strict server-side tenancy isolating student career records to `req.user.sub`.

3. **College Institutional Placement Intelligence & Conversion Funnel**:
   - **Unique Student Funnel**: Tracks actual students through six milestones: Registered $\rightarrow$ Eligible $\rightarrow$ Applied $\rightarrow$ Shortlisted $\rightarrow$ Interviewed $\rightarrow$ Selected ($Selected / Applied \times 100\%$).
   - **Institutional Skill Gap Interventions**: Identifies deficiencies across cohorts and directly links students to recommended Phase 17 Learning Paths.
   - **Department / Branch Breakdown**: Real-time cross-tabulation of registration, applications, selections, and average profile readiness across academic departments.
   - **Institutional Governance Audit**: Transparent disclosure of unassessed students and incomplete profiles with zero student PII or private notes leaked.

4. **Employer Corporate Recruitment Analytics**:
   - **Pipeline Performance**: Real-time tracking from job views and direct applications to interview rounds and final employment offers.
   - **Job Performance Matrix**: Per-drive breakdown of eligible applicants, shortlisted candidates, interviews conducted, and final selections.
   - **Status Distribution**: Pipeline visualizer tracking review stages and drop-offs.
   - **Multi-Tenant Isolation**: Complete isolation guaranteeing Employer A cannot access recruitment records of Employer B.

5. **Super-Admin Platform Telemetry & Governance**:
   - **Platform-Wide Ecosystem Overview**: Total students, partner colleges, active hiring employers, drives, applications, and verified selections.
   - **User Growth & Feature Engagement**: Cohort growth curves and engagement rates across Learning Hub, Skill Assessments, ATS Resume Scans, Mock Interviews, and Mentorship.
   - **System Telemetry & Health Diagnostics**: Operational uptime, database latency, and data integrity health audits.

6. **RFC 4180 Compliant CSV & Document Export Engine**:
   - **Standards-Compliant CSV**: Escapes delimiters, quotes, and line breaks adhering strictly to RFC 4180.
   - **Executive Document Reports**: Generates structured, timestamped reports complete with KPI tables, metadata, and methodological notices.
   - **Automated Report Schedules**: Allows daily, weekly, and monthly automated recurring report delivery configurations.
   - **Explainable Rationale Breakdown**: Transparently displays point allocation breakdown for every recommended resource, eliminating opaque AI black-boxes.

5. **Skill Gap to Learning Path Bridge**:
   - Connects assessed weaknesses from Phase 6 Assessments and Phase 15 ATS Resume Scans directly to targeted career paths and bridging study materials.
   - Eliminates guesswork for tier-2/3 college students by providing structured remediation pathways.

6. **Personal Library & Private Revision Notes**:
   - Allows students to bookmark resources, organize by category, and record timestamped, private revision notes.
   - Full CRUD support with instant bookmark status synchronization across all catalog views.

7. **Knowledge Check Quizzes with Server-Side Evaluation**:
   - **Anti-Cheat Question Sanitization**: Correct option keys and answer explanations are stripped from client payloads and kept strictly on the server until submission.
   - **Deterministic Server-Side Grading**: Compares user responses against verified answer keys, calculates percentage score, checks passing thresholds (70%), and returns comprehensive explanations.
   - **Automated Progression Trigger**: Passing a module quiz automatically marks the module as `COMPLETED` via `QUIZ_VERIFIED`.

8. **Admin Control & Content Quality Moderation Desk**:
   - **Resource Verification Queue**: Moderates external content across `DRAFT`, `PENDING_REVIEW`, `VERIFIED`, `REJECTED`, and `ARCHIVED` statuses.
   - **User Grievance Desk**: Reviews student-reported broken links, outdated syntax, or inaccuracies, with one-click resolution and administrative audit notes.
   - **Idempotent Database Hydration**: Super-admin trigger to seed categories, 10 learning paths, ordered modules, verified resources, and quizzes.

9. **College Institutional Learning Analytics**:
   - Institutional placement cells monitor aggregate curriculum participation, top enrolled paths, most popular skills learned, and completion rates.
   - **Strict Privacy Safeguard**: Institutional analytics report aggregated statistics with zero student-specific private notes, test answers, or identifiable data leaked.

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
│       │   ├── db.ts                     # Fault-tolerant Mongoose connector (non-blocking)
│       │   └── skillTaxonomy.seed.ts     # Standardized taxonomy (10 categories, 27 skills, 4 rich assessments)
│       ├── models/
│       │   ├── user.model.ts             # User schema with studentProfile subdocuments & score
│       │   ├── cohort.model.ts           # Academic Cohort schema with student memberships & status
│       │   ├── placementDrive.model.ts   # Placement Drive schema (college- & employer-owned opportunities)
│       │   ├── placementApplication.model.ts # Student Application schema with status audit history
│       │   ├── employerProfile.model.ts  # Verified Company Profile schema with safe projections
│       │   ├── collegeEmployerConnection.model.ts # Institutional Partnership schema with status transitions
│       │   ├── interview.model.ts        # Interview rounds (online/offline) schema with scheduling
│       │   ├── resume.model.ts           # ATS Resume model with multi-versioning & template layouts
│       │   ├── skill.model.ts            # Standardized skill taxonomy model
│       │   ├── assessment.model.ts       # Assessment model with server-side answer sanitization
│       │   ├── assessmentAttempt.model.ts# Assessment attempt lifecycle, score, & question evaluation records
│       │   ├── notification.model.ts     # In-app notification schema with recipient & event linkage
│       │   ├── careerEvent.model.ts      # Multi-category career event schema with capacity limits
│       │   ├── announcement.model.ts     # Targeted broadcast announcement schema
│       │   ├── auditLog.model.ts         # Append-only administrative governance audit trail
│       │   ├── contentModerationItem.model.ts # User grievance & flagged content moderation schema
│       │   ├── whatsAppAccount.model.ts  # Linked WhatsApp phone number, consent & notification preferences
│       │   ├── whatsAppLinkToken.model.ts# 5-minute TTL single-use cryptographic linking token (SHA-256)
│       │   ├── whatsAppWebhookEvent.model.ts # Idempotent Meta webhook event log for deduplication
│       │   ├── whatsAppMessage.model.ts  # Inbound & outbound WhatsApp message communication ledger
│       │   ├── whatsAppConversation.model.ts # Conversational state machine session per phone number
│       │   ├── mentorProfile.model.ts    # Verified Mentor & Alumni profile schema with verification evidence
│       │   ├── studentMentorshipProfile.model.ts # Student mentorship preferences and career goals schema
│       │   ├── mentorshipRequest.model.ts# Mentorship connection request lifecycle schema (Pending, Accepted, Rejected)
│       │   ├── mentorshipRelationship.model.ts # Active mentorship relationship workspace schema with progress tracking
│       │   ├── mentorshipGoal.model.ts   # Structured milestones & progress tracking schema
│       │   ├── mentorshipSession.model.ts# 1-on-1 and group session booking schema with double-booking prevention
│       │   ├── mentorshipMessage.model.ts# Direct participant messaging ledger with participant isolation
│       │   ├── mentorshipNote.model.ts   # Private and shared session notes schema with strict visibility enforcement
│       │   ├── mentorshipFeedback.model.ts # Post-session review & 5-star rating schema with duplicate prevention
│       │   └── mentorshipGroup.model.ts  # Group masterclass cohort session schema with capacity enforcement
│       ├── utils/
│       │   └── auth.ts                   # Password hashing, password strength checker, JWT signing/verification
│       ├── services/
│       │   ├── eligibility.service.ts    # Deterministic, explainable eligibility evaluator
│       │   ├── profileCompletion.service.ts # Transparent 8-pillar profile score calculator
│       │   ├── pdfGenerator.service.ts   # Dynamic ATS-compliant PDF generator (PDFKit)
│       │   ├── assessmentEvaluation.service.ts # Server-side test evaluation, negative marking, & time limits
│       │   ├── careerReadiness.service.ts# Explainable 6-pillar composite Career Readiness Score calculator
│       │   ├── skillGap.service.ts       # Gap analysis (Verified vs Self-Declared vs Missing) & roadmap
│       │   ├── opportunityMatching.service.ts # Smart opportunity matcher integrating Phase 3 eligibility
│       │   ├── notification.service.ts   # Central notification creator & deduplication engine
│       │   ├── realtimeBroker.service.ts # SSE real-time client room management & event dispatch
│       │   ├── adminAnalytics.service.ts # Real aggregate database metrics & funnel calculation
│       │   ├── auditLog.service.ts       # Append-only administrative action logging
│       │   ├── mentorMatching.service.ts # 6-factor weighted deterministic compatibility matching engine (100% total)
│       │   ├── mentorshipScheduling.service.ts # Concurrency overlap & double-booking prevention engine
│       │   ├── mentorshipAiAssistant.service.ts # AI agenda synthesis, questions generator & notes summarizer
│       │   ├── mentorship.service.ts     # Central coordinator for profiles, verification, requests, goals, & feedback
│       │   └── whatsapp/
│       │       ├── whatsapp.service.ts   # Meta Graph API client with graceful unconfigured fallback
│       │       ├── whatsappWebhookVerification.service.ts # Meta hub challenge handshake & HMAC-SHA256 signature verifier
│       │       ├── whatsappMessageParser.service.ts # Inbound Meta payload parser & command normalizer
│       │       ├── whatsappAccountLinking.service.ts # Short-lived code generation, SHA-256 verification & preferences
│       │       ├── whatsappAiAssistant.service.ts # Conversational AI guidance adapter with prompt injection guard
│       │       ├── whatsappConversation.service.ts # Conversational state machine & DB entity query engine
│       │       ├── whatsappNotification.service.ts # Transactional placement & interview notifications over WhatsApp
│       │       └── whatsappRateLimiter.ts # In-memory sliding window rate limiter for linking & inbound messages
│       ├── middlewares/
│       │   ├── auth.ts                   # authenticate & authorizeRole RBAC middlewares
│       │   ├── rateLimiter.ts            # Rate limiting for auth endpoints (30 req / 15 min)
│       │   ├── errorHandler.ts           # Centralized standardized JSON error response
│       │   └── notFoundHandler.ts        # 404 handler returning structured JSON
│       ├── controllers/
│       │   ├── auth.controller.ts        # Register, login, logout, getMe handlers
│       │   ├── user.controller.ts        # Update profile with strict allowlist & role protection
│       │   ├── health.controller.ts      # Diagnostic controller for /api/health
│       │   ├── cohort.controller.ts      # Cohort CRUD, roster management, email enrollment, archive
│       │   ├── placementDrive.controller.ts # Placement Drive lifecycle (Draft, Publish, Close, Cancel)
│       │   ├── application.controller.ts # Student Apply, review workflow, and withdraw actions
│       │   ├── collegeStats.controller.ts# College placement cell aggregate KPI metrics
│       │   ├── employerProfile.controller.ts # Company profile CRUD, public projections, verification workflow
│       │   ├── employerDashboard.controller.ts # Real aggregate database metrics for employers
│       │   ├── employerOpportunity.controller.ts # Employer opportunity CRUD, draft/publish lifecycle
│       │   ├── collegeConnection.controller.ts # Employer-college connection requests & college review desk
│       │   ├── employerApplication.controller.ts # Recruiter candidate review desk with privacy enforcement
│       │   ├── interview.controller.ts   # Interview scheduling, rescheduling, cancellation & student calendar
│       │   ├── careerProfile.controller.ts # Student career profile updates, skills, transparent scoring & project CRUD
│       │   ├── resume.controller.ts      # Resume builder, multi-versioning, ATS PDF streaming & recruiter download
│       │   ├── skill.controller.ts       # Skill taxonomy explorer & category filtering
│       │   ├── assessment.controller.ts  # Assessment catalogue, sanitized attempt lifecycle & grading
│       │   ├── careerReadiness.controller.ts # Career readiness score, skill gaps, & smart matching
│       │   ├── notification.controller.ts# In-app notification management, unread counts & SSE stream
│       │   ├── careerEvent.controller.ts # Multi-category career events, registration & capacity management
│       │   ├── announcement.controller.ts# Targeted broadcast announcements & priority filters
│       │   ├── admin.controller.ts       # Super-admin governance, suspensions, verification queues & audit
│       │   ├── whatsapp.controller.ts    # Webhook handshake, HMAC event processor, student link & admin control
│       │   └── mentorship.controller.ts  # Mentorship discovery, requests, workspace, goals, sessions, & feedback
│       ├── routes/
│       │   ├── index.ts                  # Central API router mounting all modules
│       │   ├── auth.routes.ts            # /api/auth routes
│       │   ├── user.routes.ts            # /api/users routes
│       │   ├── health.routes.ts          # /api/health route
│       │   ├── cohort.routes.ts          # /api/cohorts routes
│       │   ├── placementDrive.routes.ts  # /api/placement-drives routes
│       │   ├── application.routes.ts     # /api/applications routes
│       │   ├── collegeStats.routes.ts    # /api/college/stats routes
│       │   ├── employer.routes.ts        # /api/employers sub-router
│       │   ├── skill.routes.ts           # /api/skills routes
│       │   ├── assessment.routes.ts      # /api/assessments routes
│       │   ├── studentCareer.routes.ts   # /api/students/me sub-router (profile, readiness, gaps, matching)
│       │   ├── notification.routes.ts    # /api/notifications routes
│       │   ├── careerEvent.routes.ts     # /api/events routes
│       │   ├── announcement.routes.ts    # /api/announcements routes
│       │   ├── admin.routes.ts           # /api/admin super-admin governance routes
│       │   ├── whatsapp.routes.ts        # /api/whatsapp public webhook, student link & admin bot control
│       │   └── mentorship.routes.ts      # /api/mentorship public discovery, student requests, workspace, & admin desk
│       ├── types/
│       │   ├── index.ts                  # Shared backend contracts (Assessments, Attempts, Readiness, Matching)
│       │   └── express.d.ts              # Express Request augmentation with req.user and rawBody buffer
│       └── __tests__/
│           ├── auth.test.ts              # Auth validators, tokens, registration & profile tests (20 tests)
│           ├── rbac.test.ts              # Role-Based Access Control authorization tests (12 tests)
│           ├── health.test.ts            # System health diagnostics tests (3 tests)
│           ├── cohort.test.ts            # Cohort creation, enrollment, RBAC & privacy tests (11 tests)
│           ├── placementDrive.test.ts    # Drive creation, draft/publish lifecycle & validation (15 tests)
│           ├── eligibilityAndApplication.test.ts # Deterministic eligibility & application tests (15 tests)
│           ├── employerProfile.test.ts   # Company profile validation, self-verification guard & verification (19 tests)
│           ├── employerOpportunity.test.ts # Employer job posting lifecycle & CGPA validation (17 tests)
│           ├── collegeConnection.test.ts # Institutional connection requests, acceptance & blocking (12 tests)
│           ├── employerRecruitmentAndInterview.test.ts # Candidate review, audit trail & interview scheduling (16 tests)
│           ├── careerProfileAndResume.test.ts # Career profile validation, project CRUD, PDF generator & ATS templates (23 tests)
│           ├── skillAssessmentAndReadiness.test.ts # Taxonomy, sanitized tests, server-side grading, readiness & matching (21 tests)
│           ├── aiCareerGuideAndRoadmaps.test.ts # AI provider abstraction, prompt injection guard & deterministic fallback (19 tests)
│           ├── notificationsAndEvents.test.ts # Central notification engine, SSE broker, event capacity & registration (14 tests)
│           ├── adminGovernanceAndAnalytics.test.ts # Super-admin RBAC, user suspension, moderation & audit logs (18 tests)
│           ├── whatsappIntegration.test.ts # Meta webhook handshake, HMAC verification, linking code lifecycle & bot commands (18 tests)
│           ├── multilingualLocalization.test.ts # User language preferences, PATCH /api/users/preferences/language, AI Hindi/Hinglish generation & WhatsApp templates (10 tests)
│           └── pwaAndLowBandwidth.test.ts # Lightweight payloads, cache security headers, 100kb payload ceiling & network ping resilience (8 tests)
│
└── frontend/                             # React 18 + Vite + TypeScript + Tailwind CSS
    ├── package.json                      # React, Tailwind, Lucide React, Vitest, testing-library
    ├── vite.config.ts                    # Vite config with Vitest & JSDOM setup
    ├── public/                           # Static assets served at web root
    │   ├── manifest.json                 # Web App Manifest with standalone display & shortcuts
    │   ├── sw.js                         # Production Service Worker (caching, safety denylist, offline fallback)
    │   ├── offline.html                  # Bilingual offline fallback page with reconnection listener
    │   └── icons/                        # Vector SVGs and multi-size application icons
    │       └── icon.svg                  # High-resolution CareerBridge branding icon
    ├── src/
        ├── pwa/                          # PWA Hooks & Service Worker Lifecycle
        │   ├── registerServiceWorker.ts  # Service worker registration & update event emitter
        │   ├── usePwaInstall.ts          # Installability hook capturing beforeinstallprompt
        │   ├── useNetworkStatus.ts       # Network detection (online/offline, 2G/3G, Data Saver)
        │   ├── manifestConfig.ts         # Typed manifest metadata bridge
        │   └── index.ts                  # PWA utilities barrel export
        ├── hooks/
        │   └── useDebounce.ts            # Debounced search hook for low-bandwidth queries
        │   └── offlineStorage.ts         # Safe client draft storage with credential denylist
        ├── i18n/                         # Zero-dependency React Multilingual Engine
        │   ├── types.ts                  # SupportedLanguage ('en' | 'hi' | 'hi-Latn') and contracts
        │   ├── languageConfig.ts         # Language registry, metadata, flags, and storage constants
        │   ├── index.ts                  # Resource bundle, lookup engine with interpolation, and formatters
        │   ├── I18nContext.tsx           # React Context Provider, useTranslation hook & backend sync
        │   └── locales/                  # 36 Complete JSON translation dictionaries
        │       ├── en/                   # 12 English namespaces (common, auth, student, employer, etc.)
        │       ├── hi/                   # 12 Hindi namespaces (Devanagari with technical preservation)
        │       └── hi-Latn/              # 12 Hinglish namespaces (Colloquial Indian-technical)
        ├── components/
        │   ├── common/
        │   │   └── LanguageSelector.tsx  # Reusable selector (compact, full, inline) with keyboard accessibility
        │   ├── pwa/
        │   │   ├── PwaInstallBanner.tsx  # Install app banner, header pill & dismissal logic
        │   │   ├── OfflineIndicator.tsx  # Real-time offline alert banner, reconnection notice & ping retry
        │   │   └── CachedSnapshotBadge.tsx # Explainable badge for offline data disclosure
        │   ├── student/
        │   │   ├── CareerProfileView.tsx      # Student career profile editor & completion scorecard
        │   │   ├── ProjectPortfolioView.tsx   # Verified portfolio project manager & showcase
        │   │   ├── ResumeBuilderView.tsx      # ATS resume builder, multi-versioning, & PDF download
        │   │   ├── SkillsExplorerView.tsx     # Standardized 10-category skill taxonomy explorer
        │   │   ├── AssessmentCatalogueView.tsx# Skill assessment cards, difficulty filters, & attempt history
        │   │   ├── AssessmentAttemptView.tsx  # Dynamic countdown timer, code snippets, & autosave taker
        │   │   ├── AssessmentResultView.tsx   # Scorecard, skill breakdown, & educational explanations
        │   │   ├── CareerReadinessView.tsx    # 6-pillar readiness meter, gap analysis, & employment disclaimer
        │   │   ├── SkillGapView.tsx           # Verified vs self-declared matrix & curated learning roadmaps
        │   │   └── RecommendedOpportunitiesView.tsx # Ranked opportunities with explainable factor chips
        │   ├── whatsapp/
        │   │   ├── WhatsAppIntegrationCard.tsx# Student WhatsApp linking, 5-min timer & notification preferences
        │   │   └── WhatsAppAssistantPreview.tsx# Interactive mobile chat simulator with DEMO SIMULATOR badge
        │   ├── mentorship/
        │   │   ├── MentorCard.tsx            # Mentor summary card with verification, alumni badge, & compatibility meter
        │   │   ├── MentorDiscoveryDashboard.tsx # Filterable mentor catalog with search, topics, & recommendations
        │   │   ├── RequestMentorshipModal.tsx# Topic, objective & session format proposal modal
        │   │   ├── MentorshipWorkspaceView.tsx # Central workspace with milestone goals, progress tracker & sessions
        │   │   ├── SessionSchedulingModal.tsx# Calendar scheduling with double-booking prevention & meet links
        │   │   ├── MentorshipMessagingDrawer.tsx # Private encrypted chat drawer with read receipts
        │   │   ├── MentorshipNotesDrawer.tsx # Private vs shared session documentation
        │   │   ├── AIMentorshipAssistantPanel.tsx # 45-min agenda builder, question generator, & notes summarizer
        │   │   ├── MentorshipFeedbackModal.tsx # Post-session 5-star review & strengths endorsement
        │   │   ├── GroupMentorshipView.tsx   # Masterclass cohort sessions with capacity management
        │   │   ├── CollegeMentorshipAnalyticsCard.tsx # Institutional alumni intelligence with student privacy safeguards
        │   │   └── AdminMentorVerificationCard.tsx # Super-admin credential verification queue & moderation desk
        │   ├── admin/
        │   │   ├── AdminControlCentreView.tsx # Dedicated Admin Dashboard with tabbed governance navigation
        │   │   ├── AdminMetricsCards.tsx      # Real database aggregate platform metrics cards
        │   │   ├── AdminUserManagementTable.tsx # Paginated user oversight, search, filter & suspension modal
        │   │   ├── AdminEmployerVerificationTable.tsx # Recruiter verification queue & rejection modal
        │   │   ├── AdminCollegeManagementTable.tsx # Institutional supervision & verification
        │   │   ├── AdminContentModerationTable.tsx # Flagged content & grievance review desk
        │   │   ├── AdminAnalyticsCharts.tsx   # Recruitment funnel & transparent placement outcome disclosures
        │   │   ├── AdminAuditLogsTable.tsx    # Append-only administrative governance audit trail
        │   │   ├── AdminSystemHealthCard.tsx  # Real-time backend runtime telemetry & memory diagnostics
        │   │   └── AdminWhatsAppControlCard.tsx# WhatsApp Cloud API status, delivery analytics & test console
        │   └── StudentPlacementView.tsx       # Student dashboard with tabs for Drives, Readiness, Assessments, Gaps
        └── __tests__/
            ├── App.test.tsx              # App layout & diagnostics (3 tests)
            ├── auth.test.tsx             # Auth forms & profiles (8 tests)
            ├── phase3.test.tsx           # Cohorts & drives (8 tests)
            ├── phase4.test.tsx           # Employer portal & candidate desk (11 tests)
            ├── phase5.test.tsx           # Profile, portfolio & resume builder (9 tests)
            ├── phase6.test.tsx           # Assessments, readiness, gaps & smart matching (8 tests)
            ├── phase7.test.tsx           # AI Career Guide, Roadmaps & Mock Interviews (8 tests)
            ├── phase8.test.tsx           # Notifications, Events & Communication Centre (7 tests)
            ├── phase9.test.tsx           # Admin Control Centre, Moderation & Audit Logs (9 tests)
            ├── phase10.test.tsx          # WhatsApp integration card, interactive preview & admin bot control (14 tests)
            ├── phase11.test.tsx          # Multilingual provider, dynamic switching, Hindi/Hinglish, formatters & persistence (12 tests)
            └── phase12.test.tsx          # PWA manifest, service worker lifecycle, install prompt, offline banner & cache safety (14 tests)
```
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
        │   └── api.ts                    # Full REST API client with credentials & token headers
        ├── components/
        │   ├── Navbar.tsx                # Responsive header with role navigation pills
        │   ├── Hero.tsx                  # Mission Bharat problem statement & impact stats
        │   ├── SystemHealthBanner.tsx    # Live /api/health monitor & interactive JSON viewer
        │   ├── ValueProps.tsx            # 4 core pillars solving rural/Tier-3 placement gap
        │   ├── RoleCards.tsx             # Role selection & persona navigation
        │   ├── Footer.tsx                # Hackathon context, challenge details & credits
        │   ├── LoginView.tsx             # Login form with client validation
        │   ├── RegisterView.tsx          # Registration with role switching & password strength
        │   ├── DashboardView.tsx         # Unified dashboard dispatcher (Student, College, Employer)
        │   ├── ProfileEditView.tsx       # Dynamic profile editor with live score calculator
        │   ├── UnauthorizedView.tsx      # RBAC protection feedback screen
        │   ├── CohortManagementView.tsx  # Academic batch organization & student roster modal
        │   ├── DriveManagementView.tsx   # College placement drive creator & applicant review
        │   ├── StudentPlacementView.tsx  # Student drive discovery, eligibility & My Interviews desk
        │   ├── CollegeDashboardView.tsx  # Institutional placement KPI metrics & Recruiter Requests desk
        │   ├── student/
        │   │   ├── CareerProfileView.tsx      # Verified student career profile, skills & transparent completion meter
        │   │   ├── ProjectPortfolioView.tsx   # Technical project portfolio showcase & modal manager
        │   │   └── ResumeBuilderView.tsx      # ATS resume builder, live template preview & PDF download
        │   └── employer/
        │       ├── EmployerDashboardView.tsx      # Real database metrics, profile strength & quick navigation
        │       ├── CompanyProfileView.tsx         # Corporate credentials, URL validation & verification badge
        │       ├── OpportunityManagementView.tsx  # Job/internship creator, status filters & lifecycle actions
        │       ├── EmployerApplicantView.tsx      # Candidate review desk, stage selector & audit trail
        │       ├── InterviewManagementView.tsx    # Calendar desk, online links, venue & rescheduling
        │       └── CollegeConnectionsView.tsx     # Outreach desk to connect with rural/district colleges
        └── __tests__/
            ├── App.test.tsx              # Application layout, brand identity, health diagnostics (3 tests)
            ├── auth.test.tsx             # Registration form, role switching, login, dashboard (8 tests)
            ├── phase3.test.tsx           # Cohort management, roster modal, drive management (8 tests)
            ├── phase4.test.tsx           # Employer portal, opportunity creator, candidate review, interviews (11 tests)
            └── phase5.test.tsx           # Student career profile, project portfolio, ATS resume builder (9 tests)
```

---

## 🌟 Phase 5 Features

### 1. Advanced Student Career Profile
- **Extended Identity**: Headline, career objective, course & specialization, graduation year, CGPA, work mode preferences (`ONSITE`, `REMOTE`, `HYBRID`, `ANY`).
- **Validated Online Presence**: Verified URL formatting for GitHub, LinkedIn, and personal portfolio websites.
- **Skills Categorization**: Separate management for technical skills and core soft competencies with dynamic add/remove tags.
- **Credentials & Certifications**: Structured title, issuing organization, issue date, and external verification link.

### 2. Project Portfolio Subsystem
- **Complete Project CRUD**: Dedicated endpoints (`POST`, `PATCH`, `DELETE /api/students/me/projects`).
- **Project Specifications**: Title, comprehensive description, technology stack tags, project role, duration, repository link, and live demo link.
- **Visibility Control**: Toggle between `PUBLIC` (visible to verified recruiters when candidate applies) and `PRIVATE` (draft state).

### 3. ATS Resume Builder & Multi-Version Studio
- **3 ATS-Friendly Templates**:
  1. `MODERN`: Clean accent banner, bold headers, modern divider line, structured skill breakdown.
  2. `PROFESSIONAL`: Classic corporate layout, centered contact header, horizontal rules, serif typography.
  3. `MINIMAL`: Single-column, high-density text layout maximizing keyword indexing in strict ATS parsers.
- **Dynamic Section Visibility**: Students can toggle sections (Summary, Skills, Experience, Projects, Education, Certifications, Achievements) per application.
- **Version Management**: Mongoose model `Resume` with compound uniqueness index `{ studentId, title, version }`, auto-incrementing versions and default resume selection.
- **Dynamic PDF Streaming**: Built with `pdfkit` on the backend, generating standards-compliant PDF buffers (`application/pdf`) with `%PDF` magic bytes.
- **Recruiter Candidate Resume Download**: Recruiters can securely download verified candidate resumes for applicants (`GET /api/employers/applications/:applicationId/resume`).

### 4. Transparent Profile Completion Meter
- Real 8-pillar calculation returning exact breakdown:
  - Basic & Career Identity (15%)
  - Academic Background (15%)
  - Technical & Soft Skills (15%)
  - Project Portfolio (15%)
  - Internships & Experience (15%)
  - Certifications & Honors (10%)
  - Professional Links (5%)
  - ATS Resume Built (10%)
- Returns detailed completed sections, missing sections, and actionable "Next Recommended Steps".


---

## 🌟 Phase 4 Features

### 1. Corporate Profile & Trust Policy
- **One Employer, One Profile**: One-to-one relationship between employer accounts and `EmployerProfile`.
- **Self-Verification Protection**: Employers cannot self-verify. Attempts to update `verified` or `verificationStatus` directly are rejected with HTTP 400 (`PROTECTED_FIELD_MODIFICATION`).
- **Institutional Verification**: Only verified partner college placement officers or platform administrators can verify employer credentials.
- **Safe Projections**: Public company endpoint (`GET /api/employers/:employerId`) omits internal contact person names, direct phone numbers, and recruiter designations to protect personal privacy.

### 2. Real Database Employer Dashboard
- Aggregates real metrics directly from MongoDB via `$facet` aggregation pipelines.
- Metrics tracked:
  - Total, draft, and published recruitment opportunities.
  - Candidate applicant breakdown: total applications, shortlisted, interviewing, selected hires.
  - Company profile completion score (0–100%) calculated dynamically from validated corporate fields.
  - Live verification status indicator (`PENDING`, `VERIFIED`, `REJECTED`).

### 3. Placement Opportunity Management
- Comprehensive job, internship, and apprenticeship postings.
- Full lifecycle support: `DRAFT` $\rightarrow$ `PUBLISHED` $\rightarrow$ `CLOSED` $\rightarrow$ `CANCELLED`.
- Rich hiring specifications: work mode (Onsite, Remote, Hybrid), salary/stipend range, minimum CGPA (0–10), minimum qualification, number of openings, required/preferred skills, future deadline, and multi-round recruitment process.
- Direct status tampering blocked; lifecycle transitions require dedicated endpoints (`/publish`, `/close`, `/cancel`).

### 4. College–Employer Connection System
- Employers can send direct partnership outreach requests to rural and district colleges (`POST /api/employers/connections`).
- College placement coordinators can review incoming corporate requests (`GET /api/colleges/:collegeId/connections`).
- Actions supported: `ACCEPTED` (partnership established), `REJECTED` (outreach declined), `BLOCKED` (institution prevents further outreach from employer).
- Duplicate prevention and self-approval protection enforced at database and API levels.

### 5. Candidate Review Desk & Student Privacy Safeguards
- Employers can review applicant profiles for their posted opportunities (`GET /api/employers/applications`).
- **Student Privacy Guaranteed**: Student phone numbers are strictly stripped from all recruiter review payloads. Communication occurs via structured platform stages and scheduled interview links.
- **Valid Status Transitions**: Recruiter updates candidate stage: `APPLIED` $\rightarrow$ `SHORTLISTED` $\rightarrow$ `INTERVIEW_SCHEDULED` $\rightarrow$ `SELECTED` or `REJECTED`.
- **Immutable Audit Trail**: Every status transition records the previous state, new state, user ID, timestamp, and optional recruiter evaluation note.

### 6. Multi-Modal Interview Scheduling System
- Employers can schedule interview rounds directly for shortlisted candidates (`POST /api/employers/applications/:applicationId/interviews`).
- **Online Rounds**: Validated meeting links (Google Meet, Zoom, MS Teams).
- **Offline Rounds**: Verified campus venue room or placement office location.
- Lifecycle controls: Reschedule date/time, mark completed, or cancel with candidate notification.
- **Student Experience**: Students view their scheduled interviews, meeting links, instructions, and round titles under the **"My Interviews"** tab in the Student Placement Desk.

---

## 📡 API Reference (Phase 4 Additions)

### Employer Profile
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/employers/profile` | `EMPLOYER` | Create corporate company profile |
| `GET` | `/api/employers/profile/me` | `EMPLOYER` | Get current employer's company profile |
| `PATCH` | `/api/employers/profile/me` | `EMPLOYER` | Update company profile (self-verification blocked) |
| `GET` | `/api/employers/:employerId` | Public | Safe public company profile (phone/contact omitted) |
| `PATCH` | `/api/employers/:employerId/verify` | `COLLEGE` | Verify or reject employer profile |

### Employer Dashboard
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/employers/dashboard` | `EMPLOYER` | Real aggregate hiring metrics & recent activity |

### Opportunity Management
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/employers/opportunities` | `EMPLOYER` | Create recruitment opportunity (Draft) |
| `GET` | `/api/employers/opportunities` | `EMPLOYER` | List employer's opportunities |
| `GET` | `/api/employers/opportunities/:driveId` | `EMPLOYER` | Get opportunity details |
| `PATCH` | `/api/employers/opportunities/:driveId` | `EMPLOYER` | Update opportunity fields |
| `POST` | `/api/employers/opportunities/:driveId/publish` | `EMPLOYER` | Publish opportunity to campus network |
| `POST` | `/api/employers/opportunities/:driveId/close` | `EMPLOYER` | Close opportunity to new applications |
| `POST` | `/api/employers/opportunities/:driveId/cancel` | `EMPLOYER` | Cancel opportunity |
| `GET` | `/api/opportunities` | Public | List all published opportunities |
| `GET` | `/api/opportunities/:driveId` | Public | Get public opportunity details |

### College–Employer Connections
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/employers/connections` | `EMPLOYER` | Send partnership outreach request to college |
| `GET` | `/api/employers/connections` | `EMPLOYER` | List outgoing connection requests |
| `GET` | `/api/colleges/:collegeId/connections` | `COLLEGE` | List incoming connection requests for college |
| `PATCH` | `/api/connections/:connectionId/respond` | `COLLEGE` | Accept or reject connection request |
| `POST` | `/api/connections/:connectionId/block` | `COLLEGE` | Block employer from sending requests |

### Candidate Desk & Interviews
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/employers/applications` | `EMPLOYER` | List applicant submissions for employer drives |
| `GET` | `/api/employers/opportunities/:driveId/applications` | `EMPLOYER` | List applicants for specific opportunity |
| `PATCH` | `/api/employers/applications/:applicationId/status` | `EMPLOYER` | Update candidate stage with audit note |
| `POST` | `/api/employers/applications/:applicationId/interviews` | `EMPLOYER` | Schedule interview round for candidate |
| `GET` | `/api/employers/interviews` | `EMPLOYER` | List employer's scheduled interviews |
| `PATCH` | `/api/employers/interviews/:interviewId` | `EMPLOYER` | Update or reschedule interview |
| `POST` | `/api/employers/interviews/:interviewId/cancel` | `EMPLOYER` | Cancel scheduled interview |
| `GET` | `/api/students/me/interviews` | `STUDENT` | List student's scheduled interviews & meeting links |

### Student Career Profile, Projects & Resumes (Phase 5)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/students/me/career-profile` | `STUDENT` | Retrieve career profile details and completion score |
| `PATCH` | `/api/students/me/career-profile` | `STUDENT` | Update career identity, skills, links, and preferences |
| `GET` | `/api/students/me/profile-completion` | `STUDENT` | 8-pillar transparent completion breakdown and next steps |
| `POST` | `/api/students/me/projects` | `STUDENT` | Add new technical portfolio project |
| `PATCH` | `/api/students/me/projects/:projectId` | `STUDENT` | Update portfolio project details or visibility |
| `DELETE` | `/api/students/me/projects/:projectId` | `STUDENT` | Remove portfolio project |
| `POST` | `/api/students/me/resumes` | `STUDENT` | Create and version ATS-optimized resume |
| `GET` | `/api/students/me/resumes` | `STUDENT` | List saved resume versions |
| `GET` | `/api/students/me/resumes/:resumeId` | `STUDENT` | Retrieve specific resume by ID |
| `PATCH` | `/api/students/me/resumes/:resumeId` | `STUDENT` | Update resume sections or default status |
| `DELETE` | `/api/students/me/resumes/:resumeId` | `STUDENT` | Delete saved resume version |
| `GET` | `/api/students/me/resumes/:resumeId/download` | `STUDENT` | Download dynamically generated ATS PDF |
| `GET` | `/api/employers/applications/:applicationId/resume` | `EMPLOYER` | Download verified candidate resume PDF |

### Skill Assessments & Taxonomy (Phase 6)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/skills` | Public | List standardized skills with category filter and search |
| `GET` | `/api/skills/categories` | Public | List 10 standardized technical categories |
| `GET` | `/api/assessments` | Public | List available assessments (sanitized without answer keys) |
| `GET` | `/api/assessments/:assessmentId` | Public | Get assessment overview & instructions (sanitized) |
| `POST` | `/api/assessments/:assessmentId/attempts` | `STUDENT` | Start new attempt or resume active in-progress attempt |
| `PATCH` | `/api/assessments/:assessmentId/attempts/:attemptId/answers` | `STUDENT` | Autosave student answers incrementally |
| `POST` | `/api/assessments/:assessmentId/attempts/:attemptId/submit` | `STUDENT` | Submit attempt for server-side grading & review |
| `GET` | `/api/assessments/my-history` | `STUDENT` | List student's completed/active assessment attempts |

### Career Readiness, Skill Gaps & Smart Matching (Phase 6)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/students/me/career-readiness` | `STUDENT` | Compute explainable 6-pillar Career Readiness Score |
| `GET` | `/api/students/me/skill-gaps` | `STUDENT` | Analyze verified vs self-declared vs missing skills |
| `GET` | `/api/students/me/recommended-opportunities` | `STUDENT` | Transparent opportunity matching preserving Phase 3 eligibility |

### AI Career Guidance, Roadmaps & Mock Interviews (Phase 7)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/ai/career-guidance` | `STUDENT` | Conversational guidance query with student profile context injection & deterministic fallback |
| `GET` | `/api/ai/conversations` | `STUDENT` | List student's career guidance consultation history |
| `GET` | `/api/ai/conversations/:id` | `STUDENT` | Retrieve single conversation transcript (strictly student-isolated) |
| `POST` | `/api/students/me/roadmaps` | `STUDENT` | Synthesize milestone-driven learning roadmap based on skill gaps |
| `GET` | `/api/students/me/roadmaps` | `STUDENT` | List student's personalized learning roadmaps |
| `GET` | `/api/students/me/roadmaps/:id` | `STUDENT` | Get roadmap details, weekly topics, and curated links |
| `PATCH` | `/api/students/me/roadmaps/:id/milestones` | `STUDENT` | Toggle milestone completion and recalculate progress % |
| `PATCH` | `/api/students/me/roadmaps/:id/status` | `STUDENT` | Update roadmap status (`ACTIVE`, `COMPLETED`, `PAUSED`, `ARCHIVED`) |
| `DELETE` | `/api/students/me/roadmaps/:id` | `STUDENT` | Delete personalized learning roadmap |
| `GET` | `/api/learning-resources` | Public | Browse verified free learning resources with category and skill filtering |
| `POST` | `/api/ai/resume-feedback` | `STUDENT` | ATS keyword diagnostic and role-relevance analysis without fabrication |
| `GET` | `/api/ai/interview-questions` | `STUDENT` | Practice questions across Technical, Behavioral, and HR rounds |
| `POST` | `/api/ai/interview-preparation` | `STUDENT` | Evaluate written mock interview response with advisory scorecard |

### Notifications, Events & Communication (Phase 8)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Authenticated | List recipient's in-app notifications with read filter & pagination |
| `GET` | `/api/notifications/unread-count` | Authenticated | Get current unread notification count |
| `GET` | `/api/notifications/stream` | Authenticated | Connect to real-time private event stream (SSE) |
| `PATCH` | `/api/notifications/:notificationId/read` | Authenticated | Mark notification as read (with strict ownership check) |
| `POST` | `/api/notifications/mark-all-read` | Authenticated | Mark all user's unread notifications as read |
| `DELETE` | `/api/notifications/:notificationId` | Authenticated | Delete a notification (with strict ownership check) |
| `POST` | `/api/events` | `COLLEGE`, `EMPLOYER`, `ADMIN` | Create career event (webinar, workshop, hackathon, drive) |
| `GET` | `/api/events` | Public / Auth | List published career events with category & upcoming filter |
| `GET` | `/api/events/:eventId` | Public / Auth | Get event details with registration status |
| `PATCH` | `/api/events/:eventId` | Organizer / Admin | Update event details, status, or capacity |
| `POST` | `/api/events/:eventId/register` | `STUDENT` | Register for career event with capacity & deadline validation |
| `DELETE` | `/api/events/:eventId/register` | `STUDENT` | Cancel event registration and decrement registered count |
| `GET` | `/api/events/:eventId/registrations` | Organizer / Admin | View attendee roster with student academic snapshots |
| `POST` | `/api/announcements` | `COLLEGE`, `ADMIN` | Broadcast official noticeboard announcement to students/cohort |
| `GET` | `/api/announcements` | Authenticated | List targeted announcements based on user role & college |
| `GET` | `/api/announcements/:id` | Authenticated | Get announcement details |

### Admin Governance, Moderation & System Diagnostics (Phase 9)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/metrics` | `ADMIN` | Live database platform metrics & recent activity stream |
| `GET` | `/api/admin/users` | `ADMIN` | Paginated user directory with role and status filters |
| `PATCH` | `/api/admin/users/:userId/suspend` | `ADMIN` | Suspend user account with mandatory reason |
| `PATCH` | `/api/admin/users/:userId/reactivate` | `ADMIN` | Reactivate suspended user account |
| `GET` | `/api/admin/employers/pending` | `ADMIN` | List pending employer corporate verification applications |
| `PATCH` | `/api/admin/employers/:employerId/verify` | `ADMIN` | Approve employer corporate registration |
| `PATCH` | `/api/admin/employers/:employerId/reject` | `ADMIN` | Reject employer corporate registration with mandatory reason |
| `GET` | `/api/admin/colleges` | `ADMIN` | List supervised degree colleges and polytechnics |
| `PATCH` | `/api/admin/colleges/:collegeId/verify` | `ADMIN` | Verify institutional credentials of college |
| `GET` | `/api/admin/moderation` | `ADMIN` | Moderation queue for flagged content and student grievances |
| `PATCH` | `/api/admin/moderation/:id` | `ADMIN` | Resolve moderation case (`RESOLVED_APPROVED`, `RESOLVED_REMOVED`, `DISMISSED`) |
| `GET` | `/api/admin/analytics` | `ADMIN` | Funnel conversion metrics and transparent placement outcomes |
| `GET` | `/api/admin/audit-logs` | `ADMIN` | Tamper-resistant append-only governance audit log |
| `GET` | `/api/admin/system/health` | `ADMIN` | Uptime, memory, MongoDB status and non-sensitive diagnostic telemetry |

### Advanced WhatsApp Career Assistant & Webhooks (Phase 10)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/whatsapp/webhook` | Public | Meta webhook handshake challenge validation (`hub.mode`, `hub.verify_token`, `hub.challenge`) |
| `POST` | `/api/whatsapp/webhook` | Public (HMAC verified) | Cryptographically verified webhook event ingest (`X-Hub-Signature-256`), deduplication & state machine |
| `GET` | `/api/whatsapp/status` | `STUDENT` | Retrieve student WhatsApp link status, masked phone & notification preferences |
| `POST` | `/api/whatsapp/link/request` | `STUDENT` | Generate short-lived (5-min TTL) 6-character linking code (brute-force rate limited) |
| `POST` | `/api/whatsapp/link/verify` | `STUDENT` | Confirm linking code from web UI or test harness |
| `DELETE` | `/api/whatsapp/link` | `STUDENT` | Unlink phone number and revoke notification permissions |
| `PATCH` | `/api/whatsapp/preferences` | `STUDENT` | Update fine-grained notification categories (`jobAlertsEnabled`, `interviewAlertsEnabled`, etc.) |
| `GET` | `/api/whatsapp/admin/status` | `ADMIN` | Graph API configuration health, phone number ID, verify token status & webhook endpoint |
| `GET` | `/api/whatsapp/admin/analytics` | `ADMIN` | Real database counts for linked students, inbound/outbound volume, and delivery success rate |
| `GET` | `/api/whatsapp/admin/events` | `ADMIN` | Audit log of recent Meta webhook events with payload snippets and processing status |
| `POST` | `/api/whatsapp/admin/test-message` | `ADMIN` | Diagnostic test message console to verify delivery to specific WhatsApp numbers |

### Multilingual Localization & User Language Preferences (Phase 11)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `PATCH` | `/api/users/preferences/language` | Authenticated | Update user's preferred language (`en`, `hi`, `hi-Latn`) with validation & session persistence |
| `PATCH` | `/api/users/me` | Authenticated | Update user profile fields, including `preferredLanguage` (`en`, `hi`, `hi-Latn`) |

---

## 🌐 Phase 11: Multilingual Localization & Language Accessibility System

### 1. Supported Languages
- **English (`en`)**: Standard international and pan-Indian professional language. Universal default locale.
- **Hindi (`hi` - हिंदी)**: Standardized Devanagari script designed for students, administrators, and colleges across northern, central, and eastern India.
- **Hinglish (`hi-Latn`)**: Modern colloquial conversational Hindi in Roman script commonly used by university engineering students and tech professionals, blending natural Hindi syntax with standard technical keywords.

### 2. Architecture & Design Principles
- **Zero-Dependency React Localization Engine**: Lightweight, modular, type-safe `I18nProvider` and `useTranslation` hook providing instantaneous UI reactivity, nested key traversal (`lookupTranslation`), variable interpolation (`{{param}}`), and graceful fallback to English.
- **Preservation of Technical & Placement Terminology**:
  - Crucial career, computer science, and recruitment terms are preserved in English/Roman script across Hindi and Hinglish to prevent cognitive dissonance in placement preparations.
  - Examples: `DSA`, `API`, `SQL`, `GitHub`, `React`, `Node.js`, `ATS Resume`, `CGPA`, `CTC`, `Full Stack`, `Docker`, `CI/CD`, `On-Campus Drive`.
- **Dual-Layer Language Persistence**:
  - **Guests / Pre-Login**: Preserved in browser `localStorage` under `cb_preferred_language`.
  - **Authenticated Users**: Persisted to MongoDB via `PATCH /api/users/preferences/language` and `PATCH /api/users/me`. Automatically loaded on login and applied across devices.
- **Dynamic Accessibility & Screen Reader Support**:
  - Dynamically updates `<html lang="en">` or `<html lang="hi">` on `document.documentElement`.
  - Fully accessible ARIA attributes (`role="listbox"`, `role="option"`, `aria-selected`, `aria-pressed`, `aria-expanded`).
  - Keyboard accessible: Esc closes dropdown.
- **Localized Formatters**:
  - `formatI18nDate`: Localized date formatting supporting `en-IN` and `hi-IN`.
  - `formatI18nNumber`: Indian numbering system grouping (Lakhs / Crores).
  - `formatI18nCurrency`: Indian Rupee formatting (`₹`) with locale grouping.

### 3. Language Contribution Guide
Adding a new regional Indian language (e.g. Marathi, Tamil, Telugu, Bengali) takes 3 simple steps:
1. **Define Language Code**: Add the ISO 639-1 code to `SupportedLanguage` in `frontend/src/i18n/types.ts` and `SUPPORTED_LANGUAGES` in `backend/src/controllers/user.controller.ts`.
2. **Create Locale Dictionaries**: Create `frontend/src/i18n/locales/<lang>/` containing the 12 JSON module files following the schema:
   - `common.json`, `auth.json`, `student.json`, `employer.json`, `college.json`, `admin.json`, `jobs.json`, `resume.json`, `assessments.json`, `assistant.json`, `notifications.json`, `whatsapp.json`.
3. **Register in Bundle**: Import and register the dictionaries in `frontend/src/i18n/index.ts`.

---

## 📱 Phase 12: Progressive Web App (PWA) & Low-Bandwidth Optimization

### 1. PWA Setup & Installation Instructions
- **Desktop (Google Chrome / Microsoft Edge / Brave)**:
  - Visit CareerBridge at any URL.
  - Click the **"Install App"** pill in the top navigation bar, or click the browser install icon in the address bar.
  - Click **Install** to add CareerBridge to your desktop and applications menu.
- **Mobile Android (Chrome / Samsung Internet)**:
  - Tap the floating **"Install CareerBridge App"** banner at the top of the screen or open the browser menu (⋮) and select **"Add to Home screen"** / **"Install app"**.
  - Confirms standalone installation with native full-screen experience and zero-data shell caching.
- **Mobile iOS (Safari)**:
  - On Safari (iOS 16.4+), tap the **Share** button (box with upward arrow) and select **"Add to Home Screen"**.

### 2. Supported Browsers
| Browser | Platform | PWA Installable | Offline Shell | Background Sync |
|---|---|---|---|---|
| Google Chrome | Android, Windows, macOS, Linux | ✅ Yes | ✅ Yes | ✅ Supported |
| Microsoft Edge | Windows, macOS, Android | ✅ Yes | ✅ Yes | ✅ Supported |
| Samsung Internet | Android | ✅ Yes | ✅ Yes | ✅ Supported |
| Mozilla Firefox | Android, Windows, macOS | ⚠️ Manual Add | ✅ Yes | ⚠️ Partial |
| Apple Safari | iOS (16.4+), macOS (14+) | ✅ Add to Home | ✅ Yes | ⚠️ Limited |

### 3. Offline Capabilities vs. Limitations
To ensure absolute integrity and student trust, CareerBridge transparently delineates offline-capable features from online-only requirements:

#### ✅ Available in Offline Mode:
1. **Application Shell & Navigation**: Complete UI layouts, headers, sidebars, dashboard shells, and role-based navigation.
2. **Previously Loaded Public Resources**: Campus drives catalog, standardized skill taxonomy, and career event schedules previously fetched in the active session.
3. **Local Draft Preservation**: In-progress student profile edits and ATS resume notes are automatically backed up to local storage (`offlineStorage.ts`) so work is never lost if connectivity drops mid-edit.
4. **Bilingual Offline Fallback (`/offline.html`)**: Interactive offline guidance in English and Hindi with an active "Retry Connection" ping test and automatic reload upon network reconnection.
5. **Explainable Stale Data Disclosure**: All offline-retrieved cards and tables display a prominent `[Cached Snapshot - HH:MM]` badge, explicitly communicating to students and recruiters that the displayed data is a cached local copy.

#### ⚡ Requires Active Internet Connection:
1. **Placement Drive Applications**: Submitting job applications requires real-time eligibility evaluation and server-side state transitions.
2. **Verified Skill Assessments**: Standardized tests enforce anti-cheat countdown timers, question sanitization, and server-side grading.
3. **Live AI Career Counseling**: Contextual guidance generation via Gemini/OpenAI models requires active network exchange.
4. **Video Interview Rooms**: Online interview rounds (Google Meet, Zoom, MS Teams) require external webRTC connectivity.

### 4. Cache Safety & Student Privacy Architecture
CareerBridge strictly adheres to zero-trust client caching:
- **Never Cached in Service Worker**:
  - Non-GET requests (`POST`, `PUT`, `DELETE`, `PATCH`).
  - Passwords and authentication credentials (`/api/auth/*`).
  - JWT tokens or bearer headers in shared caches.
  - Super-admin governance and audit logs (`/api/admin/*`).
  - Private student application records (`/api/students/me/*`).
  - Recruiter candidate desk evaluations and college review desk data (`/api/employers/*`, `/api/colleges/*`).
  - WhatsApp webhook events and linking codes (`/api/whatsapp/*`).
- **Safe to Cache**:
  - Versioned static assets (`.js`, `.css`, `.svg`, `.png`, fonts).
  - Public read-only endpoints (`/api/health`, `/api/skills`, `/api/events`).

### 5. Low-Bandwidth Network Strategy
- **Route-Level Code Splitting**: Heavy dashboards (`ResumeBuilderView`, `OpportunityManagementView`, `AdminControlCentreView`) are lazy-loaded via `React.lazy()` and `Suspense`, reducing initial mobile payload by over 60%.
- **Request Timeout Protection**: `fetchWithTimeout()` wraps critical API requests with an `AbortController` (12-second ceiling), providing instant user feedback instead of hanging on spotty rural 2G networks.
- **Debounced Search Queries**: `useDebounce()` limits keystroke API requests to 300ms intervals, avoiding wasteful network congestion.
- **100kb Backend Request Limit**: Express body-parsers enforce a strict 100kb payload ceiling to protect mobile data plans.

---

## 🌟 Phase 16: Advanced AI-Powered Mentorship & Industry Connect Platform

### 1. Mentorship Ecosystem Overview
CareerBridge Phase 16 establishes a full-stack, secure, and production-grade mentorship ecosystem connecting:
1. **Students**: Browse verified mentors, receive AI-ranked compatibility recommendations, request 1-on-1 and group mentorship, track milestone goals, schedule sessions, exchange private messages, and submit verified feedback.
2. **Industry Mentors & Alumni**: Register credentials, configure availability calendars, review incoming requests, host 1-on-1 calls and group masterclass cohorts, track mentee goal progress, take private session notes, and provide structured career advice.
3. **College Coordinators**: View institutional aggregate mentorship metrics, alumni participation counts, session volumes, and top mentorship topics with strict student privacy safeguards (zero access to private 1-on-1 messages or notes).
4. **Platform Administrators**: Supervise mentor credentials, review submitted evidence (work email, ID proofs, document URLs), approve, reject (with mandatory justification), or suspend mentors, and analyze platform-wide engagement telemetry.

### 2. 6-Factor Deterministic Compatibility Matching Engine (100% Total)
To ensure complete transparency and eliminate hallucinated match percentages, mentor recommendations are computed using an explainable 6-pillar weighted formula:

$$\text{Compatibility Score} = \sum_{j=1}^{6} \text{Factor Score}_j$$

| Factor | Weight | Evaluation Criteria |
|---|---|---|
| **Expertise & Skill Alignment** | 30% | Direct overlap between student technical skills & mentor domain expertise ($\ge 4$ skills = 30 pts, 3 = 24 pts, 2 = 18 pts, 1 = 12 pts). |
| **Career Goal Alignment** | 20% | Semantic match between student career ambitions and mentor designation/expertise. |
| **Industry Alignment** | 15% | Compatibility between student target industries and mentor current corporate industry. |
| **Mentorship Topic Alignment** | 15% | Overlap between student requested guidance topics and mentor active offerings. |
| **Language Compatibility** | 10% | Shared spoken languages ensuring seamless communication (2+ shared = 10 pts, 1 shared = 8 pts). |
| **Availability Compatibility** | 10% | Open capacity check based on mentor `maximumMentees` minus `activeMenteeCount` and active time slots. |

#### Match Categories & Explainability:
- **`EXCELLENT_MATCH` (85–100%)**: Highlighted match with prioritized recommendation banner.
- **`STRONG_MATCH` (70–84%)**: High compatibility across core skills and industry goals.
- **`MODERATE_MATCH` (50–69%)**: Useful developmental match with adjacent skill overlap.
- **`LIMITED_MATCH` (< 50%)**: Clear disclosure of potential skill and industry gaps.
- **College Alumni Bonus**: Verified alumni of the student's college receive prominent visual badges and priority ranking.

### 3. Concurrency-Safe Scheduling & Double-Booking Prevention
The session scheduling engine guarantees strict time-slot integrity:
- **Chronological Range Validation**: Rejects inverted start/end times and past date-time selections.
- **Double-Booking Overlap Check**:
  $$\text{Overlap Condition: } (\text{sessionStart} < \text{existingEnd}) \land (\text{sessionEnd} > \text{existingStart})$$
  Ensures neither mentor nor student can have concurrent overlapping confirmed sessions.
- **Cryptographic Meeting Links**: Generates unique, tamper-proof video conference room URLs (`https://meet.careerbridge.in/session-...`).

### 4. Privacy Architecture & Participant Security
- **Sender Validation**: The messaging API strictly binds `senderId` to the verified JWT session token (`req.user.sub`), rejecting any client-supplied spoofed identities.
- **Private vs. Shared Note Isolation**:
  - `PRIVATE`: Strictly filtered at the database query level so only `authorId === req.user.sub` can retrieve them.
  - `SHARED`: Visible to both active participants in the workspace.
  - Never exposed to third parties, college coordinators, or corporate recruiters.
- **Capacity Limits**: Mentors cannot accept requests beyond their configured `maximumMentees` ceiling. Duplicate pending requests are strictly blocked.

### 5. AI Mentorship Assistant with Deterministic Fallbacks
Integrated with `AiService.getInstance()` to provide student guidance with 100% offline fallback resilience:
1. **Session Agenda Builder**: Generates structured 45-minute timeline agendas with pre-session preparation checklists.
2. **High-Impact Discussion Questions**: Proposes 5 thoughtful industry questions across technical architecture, career growth, and interview trade-offs.
3. **Notes Summarizer & Action Item Extractor**: Distills raw meeting minutes into executive summaries, key takeaways, and prioritized action items with assignees (`STUDENT` vs `MENTOR`).

---

## 📊 Career Readiness Heuristic Formula

The Career Readiness Score represents an explainable, 6-pillar weighted heuristic (0–100%):

$$\text{Readiness Score} = \sum_{i=1}^{6} \text{Pillar Score}_i$$

1. **Profile Completeness (20% Weight)**: Derived from the 8-section profile completion audit.
2. **Verified Skills Assessment (30% Weight)**: Awarded based on passed standardized assessments (3+ passed = 30 pts, 2 passed = 24 pts, 1 passed = 15 pts, 0 = 0 pts).
3. **Project Portfolio (20% Weight)**: Rewarding documented GitHub and deployed projects (2+ with links = 20 pts).
4. **Academic & Education Records (15% Weight)**: Verified college course, graduation year, and CGPA.
5. **ATS Resume Availability (10% Weight)**: Verifying an active, compiled ATS resume is ready for instant application.
6. **Certifications & Credentials (5% Weight)**: Rewarding professional certifications.

### Status Bands:
- **80% – 100%**: `HIGHLY_JOB_READY`
- **60% – 79%**: `JOB_READY`
- **40% – 59%**: `DEVELOPING`
- **< 40%**: `EARLY_STAGE`

---

## 🧪 Automated Testing & Verification

CareerBridge includes **542 comprehensive automated tests** across 42 test suites powered by **Vitest**:

```bash
# Run all backend tests (367 tests across 24 suites)
npm --prefix backend test

# Run all frontend tests (175 tests across 18 suites)
npm --prefix frontend test

# Run production builds
npm --prefix backend run build
npm --prefix frontend run build
```

### Test Coverage Summary:
- **Backend (367 Tests - 100% Pass Rate)**:
  - `auth.test.ts` (20 tests): Passwords, tokens, registration, profile score
  - `rbac.test.ts` (12 tests): RBAC authorization across roles
  - `health.test.ts` (3 tests): Health diagnostics and 404 handler
  - `cohort.test.ts` (11 tests): Cohort creation, role security, student enrollment, archive, offline DB handling
  - `placementDrive.test.ts` (15 tests): Drive drafting, publishing, closing, cancelling, field validation, offline DB handling
  - `eligibilityAndApplication.test.ts` (15 tests): Deterministic eligibility evaluator, application submission, status transitions, withdrawal, college stats
  - `employerProfile.test.ts` (19 tests): Company profile validation, self-verification guard, safe public projections, college verification
  - `employerOpportunity.test.ts` (17 tests): Opportunity creation, CGPA validation, draft/publish lifecycle, status protections
  - `collegeConnection.test.ts` (12 tests): Institutional connection requests, acceptance, rejection, blocking, duplicate prevention
  - `employerRecruitmentAndInterview.test.ts` (16 tests): Candidate desk, audit trail logging, interview scheduling, student interview listing
  - `careerProfileAndResume.test.ts` (23 tests): Career profile RBAC, URL validations, project portfolio CRUD validation, resume versioning, ATS templates PDF generation, transparent scoring service, offline DB resilience
  - `skillAssessmentAndReadiness.test.ts` (21 tests): Taxonomy retrieval, question sanitization (answer keys stripped), attempt initialization, autosave, server-side grading, negative marking, attempt expiration, duplicate submission rejection, 6-pillar career readiness calculation, skill gap analysis (verified vs self-declared), smart opportunity matching preserving Phase 3 eligibility
  - `aiCareerGuideAndRoadmaps.test.ts` (19 tests): AI provider abstraction, deterministic fallback labeling (`isFallback: true`), sliding-window rate limit enforcement, prompt injection sanitization, conversational context snapshot injection, student conversation isolation, roadmap synthesis, milestone completion progress recalculation, learning resource catalog URL validation, ATS resume feedback keyword matching, mock interview question category filtering and answer evaluation with advisory disclaimer
  - `notificationsAndEvents.test.ts` (14 tests): Notification creation from real application events, deduplication suppression window, non-blocking external provider failure handling, unread counts, private user room isolation in RealtimeBroker, student notification isolation, career event creation and role validation, event registration and capacity enforcement, duplicate registration prevention, registration cancellation, organizer attendee roster access, communication centre announcements broadcasting and permissions
  - `adminGovernanceAndAnalytics.test.ts` (18 tests): Super-admin RBAC authorization matrix (strict 401/403 for non-admins, 200 for ADMIN), dashboard metrics aggregation from actual database records, user management pagination and role filters, account suspension with mandatory justification, self-suspension guard, account reactivation, append-only audit trail logging, employer verification queue review, approve with notes, reject with mandatory reason, college supervision and institutional verification, content moderation report intake and resolution, platform analytics recruitment funnel calculation, transparent placement outcome disclosure without fabricated statistics, queryable audit log entries, operational system health diagnostics and sanitized error telemetry without credential leakage
  - `whatsappIntegration.test.ts` (18 tests): Meta webhook verification handshake (`hub.challenge`), timing-safe HMAC-SHA256 signature verification (`X-Hub-Signature-256`), duplicate webhook event deduplication, inbound message parsing & command normalization, short-lived 6-character linking code generation with SHA-256 hash & 5-minute TTL, brute-force rate limit protection (max 3 attempts), successful account linking and unlinking, notification preference toggling, real database job search (`PlacementDrive.find`), student application tracking privacy isolation (`PlacementApplication.find({ studentId })`), upcoming interview lookup, student profile summary generation, skill recommendations, AI career guidance over WhatsApp with prompt injection protection & transparent fallback disclosure, opt-out compliance via `STOP` and re-engagement via `START`, transactional placement notification delivery, and admin security isolation
  - `multilingualLocalization.test.ts` (10 tests): User language preference updates via `PATCH /api/users/preferences/language`, profile preference sync via `PATCH /api/users/me`, unsupported language code validation (400), unauthenticated access guard (401), AI Career Assistant localized guidance in Hindi (Devanagari) and Hinglish (Roman colloquial) with technical keyword preservation, localized WhatsApp welcome menus and button templates in English, Hindi, and Hinglish
  - `pwaAndLowBandwidth.test.ts` (8 tests): API discovery reports Phase 13 metadata, root service status, lightweight health payloads (< 2KB), public unauthenticated resource access, Helmet security headers, rejection of unauthenticated access to private student/admin records (401), 100kb payload limit protection (413), and rapid network reconnect resilience
  - `recommendationEngine.test.ts` (17 tests): Recommendation configuration defaults (35/20/15/10/10/10) summing to 100%, weight sum validation rejecting != 100% and negative bounds, valid weight updates, strict separation of mandatory eligibility (binary deterministic status `ELIGIBLE`/`NOT_ELIGIBLE`/`INCOMPLETE_PROFILE`), course/branch/CGPA/backlogs/skills evaluation, 6-pillar compatibility breakdown calculation, match category classification thresholds (`EXCELLENT_MATCH`, `STRONG_MATCH`, `MODERATE_MATCH`, `LOW_MATCH`), transparent explainability rationale, matching vs missing skills extraction, skill gap report generation with 4 gap categories, learning resource integration, and complete RBAC protection across all recommendation routes (401 unauthenticated, 403 role-restricted)
  - `mockInterviewEngine.test.ts` (19 tests): Curated default question bank across DSA, programming, web, DBMS, CN, OS, HR, and behavioral categories; dynamic Job-Description question generation via `PlacementDrive.findById`; dynamic Resume-based question generation via student projects and work history; session creation boundary validations (duration 5–60 mins, question count 1–15); session state machine transitions (`CREATED` -> `IN_PROGRESS` -> `SUBMITTED` -> `EVALUATING` -> `COMPLETED`); answer autosave and timestamp tracking; safe static code analysis without backend execution; Big-O asymptotic time ($O(1)$, $O(N)$) and space complexity estimation; STAR methodology (Situation, Task, Action, Result) evaluation and structure scoring; deterministic fallback evaluation under offline/timeout conditions; AI Coach Practice Mode progressive hints vs Mock Mode strict exam condition gating; student topic mastery and score analytics; personalized interview preparation roadmap synthesis; college-level interview readiness reporting with student privacy safeguards; full route RBAC protection (401 unauthenticated, 403 role-restricted)
  - `atsResumeAnalyzer.test.ts` (14 tests): PDF magic byte validation (`%PDF-`), DOCX PK zip header validation (`50 4B 03 04`), unsupported file format and 5MB size limit rejection, structured resume field extraction (contact, education, skills, projects, experience, certs), 7-component explainable ATS scoring engine (30/20/15/10/10/10/5 summing to 100%), fresher-friendly project credit without tenure penalties, 4-tier score categorization, keyword comparison matrix (matched, missing, partial synonyms, additional skills), prioritized skill gap ranking with curated free learning links, deterministic AI bullet optimization using action verbs without fabricated metrics, immutable version history creation, and complete RBAC route security (401 unauthenticated, 403 unauthorized)
  - `mentorshipPlatform.test.ts` (15 tests): 6-factor deterministic compatibility matching formula (Expertise 30%, Goal 20%, Industry 15%, Topic 15%, Language 10%, Availability 10% = 100%), match category tier classification (Excellent, Strong, Moderate, Limited), alumni mentor affiliation highlighting, scheduling range validation and past session prevention, unique cryptographic meeting link generation, concurrency overlap / double-booking conflict detection, 45-minute structured agenda synthesis with deterministic fallback, 5 high-impact questions generator, raw notes summarization with action items and assignees, unverified mentor discovery exclusion, self-mentorship rejection, maximum active mentee capacity enforcement, duplicate pending request prevention, note privacy isolation (PRIVATE visible only to author), and complete route-level RBAC authorization
  - `learningHubPlatform.test.ts` (15 tests): 5-pillar composite explainable recommendation formula (Career Goal 30%, Skill Gap 30%, Placement Demand 20%, Difficulty 10%, Learning Format 10% = 100%), exact point weight summation, priority matching for assessed student skill gaps, skill gap to curated learning path and resource mapping, 10-type resource catalog filtering (Video Tutorials, Documentation, Courses, Practice Platforms, Articles, Interview Prep, Coding Challenges, Books, Project Tutorials, Certifications), category and difficulty scoping, keyword searches, learning path enrollment lifecycle with duplicate prevention, module progress tracking and completion recalculation, personal library bookmarks with isolated notes, sanitized quiz question delivery without client answer key leakage, server-side grading and explanation generation, student content issue reporting, admin report resolution and dismiss workflows, college institutional analytics with student privacy safeguards, and complete RBAC route security (401 unauthenticated, 403 unauthorized)
  - `analyticsPlatform.test.ts` (16 tests): Centralized metric definitions with formulas, source models, counting units, and limitations; global date range resolution across 9 presets and custom ranges; timeseries bucket generation; student personal career analytics and strict student privacy isolation; college institutional placement metrics scoped strictly by institution; unique-student placement conversion funnel (Registered -> Eligible -> Applied -> Shortlisted -> Interviewed -> Selected) with strict rule that only verified selections count as placements; cohort skill gap aggregation linked to Phase 17 Learning Paths; department breakdowns and data quality audit; employer recruitment overview, per-job performance, and funnel; super-admin platform-wide telemetry, user growth, and feature engagement; Phase 9 backward-compatible static methods on AdminAnalyticsService; RFC 4180 compliant CSV export generator; formatted text/PDF document reports with methodology notice; automated scheduled report lifecycle (create, list, update, delete); and route-level RBAC authorization (401 unauthenticated, 403 unauthorized)
  - `securityAndHardening.test.ts` (23 tests): Injection defense (recursive NoSQL stripping of `$` and `.`, XSS script and inline event handler neutralization, pseudo-protocol conversions), tenant isolation & IDOR prevention (`ensureStudentTenant`, `ensureCollegeTenant`, `ensureEmployerTenant`, `preventIdor()`), centralized input validation & pagination clamping, file upload security & magic byte verification (PDF, DOCX, PNG, JPEG), 5MB size limits, path traversal neutralization, tenant-scoped LRU caching with TTL expiration & tenant invalidation, structured JSON logging with secret masking (`***REDACTED***`), enhanced health probe telemetry without credential leakage, and database compound index declarations
  - `loadAndPerformance.test.ts` (8 tests): 50 concurrent HTTP health requests, 100 concurrent API discovery calls, 250 parallel in-memory operations under 500ms, cache latency benchmarking demonstrating >95% latency reduction vs async db queries, 95%+ repeated query cache hit ratio, memory bounds & LRU eviction under capacity limits, heap memory stability under rapid object cycles, and safe concurrent race condition handling
- **Frontend (186 Tests - 100% Pass Rate)**:
  - `App.test.tsx` (3 tests): Application layout, brand identity, health diagnostics
  - `auth.test.tsx` (8 tests): Registration form, role switching, login, dashboard, profile editor
  - `phase3.test.tsx` (8 tests): Cohort management, roster modal, drive management, applicant review desk, student eligibility scorecard
  - `phase4.test.tsx` (11 tests): Employer dashboard metrics, company profile editor, trust policy notice, opportunity management, candidate desk with privacy protection, interview calendar, student interviews desk, college recruiter requests
  - `phase5.test.tsx` (9 tests): Career profile strength meter, transparent checklist, skills management, project portfolio grid and modal, ATS resume builder with 3 templates, live preview, version history, PDF download, integrated placement desk navigation
  - `phase6.test.tsx` (8 tests): Skill taxonomy explorer with category filtering, assessment catalogue with difficulty badges, interactive test-taking interface with countdown timer and code snippets, submit confirmation modal, server-side evaluation scorecard with educational explanations, 6-pillar career readiness score meter and disclaimer, skill gap matrix (verified vs self-declared vs missing), smart recommended opportunities with explainable factor chips
  - `phase7.test.tsx` (8 tests): AI Career Assistant chat interface, deterministic fallback banner and prompt starters, roadmap list and detail view with milestone checkmarks, curated learning library card grid with verified external links, interview practice question answering and evaluation scorecard, ATS resume feedback modal with keyword gap analysis and advisory notice
  - `phase8.test.tsx` (7 tests): NotificationDropdown popover with unread counter badge, mark as read, mark all as read, delete notification, CareerEventsView event card rendering, student event registration with instant confirmation notification, event cancellation, organizer attendee roster modal, CommunicationCentreView noticeboard with priority badges and college broadcast notice form
  - `phase9.test.tsx` (9 tests): AdminMetricsCards real database count rendering, AdminUserManagementTable user list with role and status badges, suspension modal with mandatory reason validation, reactivate user handler, AdminEmployerVerificationTable pending queue review, approve verification with optional notes, reject with mandatory reason, AdminCollegeManagementTable institutional verification, AdminContentModerationTable flagged report review and resolution, AdminAnalyticsCharts recruitment funnel conversion and ethical placement transparency disclosure, AdminAuditLogsTable append-only audit trail viewer with action badges, AdminSystemHealthCard operational telemetry and sanitized privacy diagnostics
  - `phase10.test.tsx` (14 tests): WhatsAppIntegrationCard unlinked state rendering, modal linking code generation with 5-minute countdown, phone number submission, linked state with verified badge and formatted phone, notification preferences toggles (`jobAlertsEnabled`, `interviewAlertsEnabled`, `careerTipsEnabled`), account unlinking confirmation, WhatsAppAssistantPreview realistic chat simulator with `DEMO SIMULATOR` badge, interactive conversational menu navigation (`1`/`JOBS`, `2`/`APPLICATIONS`, `6`/`GUIDANCE`, `STOP`/opt-out), AdminWhatsAppControlCard Cloud API status report rendering, real database analytics display (linked students, message counts, delivery success rate), recent webhook events audit table, and diagnostic test message console dispatch
  - `phase11.test.tsx` (12 tests): Multilingual provider default English state, dynamic language switching to Hindi and Hinglish without page reload, technical terminology preservation in Hindi/Hinglish translations, parameterized interpolation (`{{name}}`, `{{count}}`), graceful fallback for missing translation keys, date/number/currency formatters, LanguageSelector compact dropdown and inline settings variants, keyboard navigation (Escape key), localStorage persistence, backend synchronization for authenticated users, login preference rehydration, and DOM accessibility (`document.documentElement.lang`, ARIA attributes)
  - `phase12.test.tsx` (14 tests): Web App Manifest schema validation, icon configurations (192x192, 512x512, maskable), quick-action shortcuts, Service Worker registration logic, usePwaInstall hook beforeinstallprompt capture, PwaInstallBanner rendering, promptInstall execution, banner dismissal persistence to localStorage, useNetworkStatus offline detection, OfflineIndicator alert banner, connection restored notice, CachedSnapshotBadge stale data disclosure, saveLocalDraft credential denylist enforcement, useDebounce input delay, and fetchWithTimeout slow network abort handling
  - `phase13.test.tsx` (11 tests): RecommendedOpportunitiesView distinct match score rendering (0-100) and match category pills (`EXCELLENT_MATCH`, `MODERATE_MATCH`), unmingled verified readiness score display in banner, independent eligibility status badges (`Eligible to Apply` vs `Not Eligible`), matching and missing skills chips, interactive 6-pillar breakdown drawer expanding Skills /35, Education /20, Assessment /15, Experience /10, Location /10, Role Preference /10 and transparent rationale, SkillGapView metrics cards, critical missing skills banner, 4 gap categories (`MISSING_MANDATORY`, `NEEDS_IMPROVEMENT`, `MATCHED`), curated learning resource cards with direct links, prioritized learning sequence roadmap steps, AdminMatchingConfigCard 6-pillar weight inputs, real-time 100% total validation with disabled saving on invalid sums, reset to defaults, and EmployerCandidateMatchView candidate compatibility rankings with verified assessment test badges
  - `phase14.test.tsx` (11 tests): InterviewPreparationDashboard rendering overview metrics and category practice cards (DSA, Web Dev, HR & Behavioral, Job-Description, Resume-Based); modal opening on category selection; InterviewConfigModal form inputs, track selection, duration & question count boundaries, Practice vs Mock Mode gating; MockInterviewSessionView timer countdown, question pagination, code/text area inputs, answer autosave indicator, finish & submit confirmation modal; AI Interview Coach assistant drawer opening and hint generation; InterviewFeedbackReportView score meters, strengths, improvement areas, STAR methodology breakdown, safe static code analysis and Big-O estimation display, model answer approach; AdminInterviewQuestionManagementCard question bank listing, platform interview metrics, search & category filters, and new custom question submission modal
  - `phase15.test.tsx` (11 tests): ResumeUploadCard drag-and-drop file upload, format validation, size limit checks, structured overview preview; JobDescriptionSelector switching between active CareerBridge placement drives and custom job description with minimum length validation; AtsScoreCard score meter (0-100), tier badges (Strong, Good, Moderate, Needs Improvement), data coverage, 7-component breakdown progress bars, internal guidance disclaimer; KeywordComparisonCard matched, missing, partial synonym, and additional skill chips, authenticity reminder; SkillGapReportCard prioritized gaps (High/Medium/Low) with curated free learning links; ResumeQualityReportCard 5-area structural checklist with fresher-friendly credit; AIBulletOptimizationPanel weak bullet identification, action-oriented recommendations, accept/reject interactions, summary proposal; ResumeImprovementWorkspace section editing, new version creation, ATS PDF export; ResumeVersionHistoryView revision list and side-by-side comparison modal
  - `phase16.test.tsx` (10 tests): MentorCard profile rendering, designation, company, experience, verification badge, and alumni tag; MentorCard AI compatibility score, match category badge, and explainable positive match reason chips; RequestMentorshipModal form inputs, validation, and request submission; MentorDiscoveryDashboard directory filters (search, industry, topic, alumni) and recommendations; SessionSchedulingModal date/time scheduling with duration presets; MentorshipMessagingDrawer participant message thread rendering and sending; AIMentorshipAssistantPanel 45-min agenda timeline generation, 5 questions suggestion, and action items extraction; MentorshipFeedbackModal 5-star rating, strengths selection, and review submission; GroupMentorshipView group session cohort cards, capacity counter, and join session reservation; CollegeMentorshipAnalyticsCard alumni metrics, satisfaction scores, and privacy safeguards; AdminMentorVerificationCard pending verification queue, evidence inspection, and approve action
  - `phase17.test.tsx` (10 tests): LearningHubDashboard welcome banner, learning streak counter, 6 metric statistics cards, continue learning feed with progress percentage, 5-pillar explainable recommendations with match score badges and toggleable rationale breakdown; ResourceLibraryView 10 resource type chips, category and difficulty filters, keyword search, and bookmark toggle; ResourceDetailModal details rendering, external launch link, private personal note editor, and broken link reporting; LearningPathsView career path catalogue cards and enrollment; LearningPathDetailView sequential module timeline, study materials, practice activities, and mark module completed action; SkillGapLearningView assessed skill gap cards, recommended paths, and bridging resources; PersonalLibraryBookmarksView saved bookmark list, private notes editor, and remove bookmark action; LearningQuizModal sanitized question rendering, option selection, submission, and score evaluation with explanations; AdminLearningManagementCard user reports queue, report resolution and dismissal, and idempotent seed trigger; CollegeLearningOverviewCard aggregated institutional learning metrics and top skills with student privacy safeguards
  - `phase18.test.tsx` (11 tests): MetricCard formatted value, subtitle, trend indicators, and badges; DateRangeFilter preset dropdown selection and custom range picker inputs; AnalyticsFunnel unique student conversion stage bars, counts, conversion percentages, and ethical methodology notice; SkillGapChart missing skills rendering, percentage of cohort, and learning path navigation callback; ExportButton dropdown menu and CSV/PDF export triggers; ReportGeneratorModal form fields, generation handler, and download trigger; ScheduledReportsModal active schedules listing, new schedule creation, and toggle action; StudentAnalyticsDashboard career overview metrics, status breakdown, ATS score, missing keywords, and learning hub progress; CollegeAnalyticsDashboard institutional placement intelligence, conversion funnel, missing skills, and department breakdown; EmployerAnalyticsDashboard recruitment overview, active job performance table, funnel stages, and status breakdown; AdminPlatformAnalyticsDashboard cross-tenant platform overview, feature engagement metrics, system health status, and top hiring employers
  - `phase19.test.tsx` (11 tests): Sensitive credential denylist detection, safe localStorage write blocking of sensitive tokens, PWA offline storage guard with token filtering, plain text XSS sanitization in rendered UI, rate limiting response parsing, and descriptive HTTP 429 error handling

---

## 🗺️ Mission Bharat Hackathon Roadmap
- ✅ **Phase 1: Project Foundation** (Folder structure, Express API, Vite/React UI, Health check, Vitest suite, Centralized error handling, Database tolerance)
- ✅ **Phase 2: Authentication, Role-Based Access Control & User Profiles** (Bcrypt hashing, JWT HttpOnly cookies, RBAC middleware, student profile completion score, profile editor, rate limiting)
- ✅ **Phase 3: Automated Placement Cell & Cohort Management** (Cohort creation, student enrollment by email, roster privacy, placement drive drafting/publishing, deterministic eligibility evaluator, student application workflow, college review desk, institutional KPIs)
- ✅ **Phase 4: Employer Portal, Company Profiles & Recruitment Management** (Employer account & company profile, self-verification guard, real database dashboard, opportunity management, college connection system, candidate review desk with student privacy, multi-round interview scheduling, student interview calendar)
- ✅ **Phase 5: Advanced Student Career Profile, Resume Builder & Portfolio** (Career profile identity, verified technical/soft skills, project portfolio CRUD, ATS resume builder with Modern/Professional/Minimal templates, PDFKit backend streaming, multi-versioning, transparent profile completion, candidate resume download)
- ✅ **Phase 6: Skill Assessment, Career Readiness & Explainable Opportunity Matching** (Standardized taxonomy across 10 categories, assessment engine with 5 question types, anti-cheat question sanitization, server-side evaluation, 6-pillar weighted Career Readiness Score, verified vs self-declared skill gaps, smart opportunity matching)
- ✅ **Phase 7: AI Career Guide, Personalized Learning Roadmaps & Career Assistant** (Provider abstraction with Gemini/OpenAI/Deterministic Fallback, rate limiting, prompt sanitization, contextual career advisor, personalized milestone-driven learning roadmaps, curated 100% free learning resource catalog, mock interview question practice with advisory scoring, ATS resume diagnostic tool)
- ✅ **Phase 8: Notification Engine, Communication Centre & Career Events** (Central notification engine, delivery provider abstraction, real-time private room dispatch, deduplication, real event lifecycle notifications, Communication Centre for verified announcements, Career Events platform with capacity validation and attendee management)
- ✅ **Phase 9: Admin Control Centre, Analytics, Moderation & Platform Governance** (Super-admin RBAC authorization matrix, dashboard metrics aggregation from actual database records, user management pagination and role filters, account suspension with mandatory justification, self-suspension guard, account reactivation, append-only audit trail logging, employer verification queue review, approve with notes, reject with mandatory reason, college supervision and institutional verification, content moderation report intake and resolution, platform analytics recruitment funnel calculation, transparent placement outcome disclosure without fabricated statistics, queryable audit log entries, operational system health diagnostics and sanitized error telemetry without credential leakage)
- ✅ **Phase 10: Advanced WhatsApp Career Assistant** (Meta Cloud API, webhook HMAC-SHA256 verification, conversational Career Assistant state machine, cryptographic account linking with 5-minute TTL, student privacy, AI guidance on WhatsApp, transactional placement notifications, admin oversight card, and interactive demo simulator)
- ✅ **Phase 11: Complete Multilingual Localization & Language Accessibility System** (English, Hindi, Hinglish support across 12 namespaces and 36 locale dictionaries, zero-dependency React i18n engine, instant language switching, dual-layer storage persistence, dynamic HTML lang sync, LanguageSelector component in all major views, localized AI Career Assistant & WhatsApp templates, 100% test pass rate)
- ✅ **Phase 12: Progressive Web App (PWA) & Low-Bandwidth Optimization** (Web App Manifest, Service Worker caching & offline fallback page, installability prompts, zero-trust cache safety, stale data disclosures, route-level code splitting with Suspense, request timeout wrappers, debounced queries, mobile responsiveness audit, 100% test pass rate)
- ✅ **Phase 13: Advanced AI Job Matching & Explainable Recommendation Engine** (Strict separation of Eligibility, Compatibility, and Readiness; configurable 6-pillar weighted matching formula summing to 100%; Score Coverage metric; transparent explainability rationale; 4-category Skill Gap Analysis with curated LearningResource catalog links; Employer Candidate Match Intelligence with privacy safeguards; College Placement Intelligence reports; Admin Matching Weights Control Card with real-time validation; 100% test pass rate across 410 automated tests)
- ✅ **Phase 14: AI-Powered Interview Preparation, Mock Interviews & Intelligent Performance Evaluation** (End-to-end simulated interview arena; multi-track categories: DSA, Web Development, Programming, DBMS, OS, Networks, HR & Behavioral; dynamic Job-Description and Resume-based question generation; multi-rubric evaluation engine v14.0 with normalized 0-100 scoring, STAR methodology breakdown, and deterministic fallback; safe static code analysis and Big-O asymptotic complexity estimation with zero server-side code execution; Interactive AI Interview Coach with Practice Mode guidance vs Mock Mode exam condition enforcement; student topic mastery analytics and personalized roadmaps; college interview readiness intelligence with privacy safeguards; super-admin question bank management and platform metrics; 440 passing tests)
- ✅ **Phase 15: Advanced AI-Powered ATS Resume Analyzer & Optimization System** (PDF and DOCX document ingestion with magic byte verification; pure Node.js text extraction; structured field parsing; dual-mode target role selection from active CareerBridge drives or custom job descriptions; explainable 7-component deterministic ATS scoring formula 30/20/15/10/10/10/5 summing to 100%; fresher-friendly project credit without tenure penalties; keyword comparison matrix with matched, missing, partial synonyms, and additional capabilities; authenticity reminder against keyword stuffing; prioritized skill gap action plan with curated free learning links; 5-area structural quality audit; AI bullet optimization using action verbs without fabricated metrics; deterministic offline fallback; interactive improvement workspace; immutable version history with side-by-side comparison; ATS-compliant PDF export; college aggregate resume analytics with student privacy safeguards; employer candidate resume review with drive ownership authorization; 465 passing tests)
- ✅ **Phase 16: Advanced AI-Powered Mentorship & Industry Connect Platform** (Full-stack mentorship ecosystem connecting Students, Industry Professionals, Alumni, College Coordinators, and Admins; multi-factor 6-pillar deterministic compatibility formula 30/20/15/15/10/10 summing to 100% with explainable match tiers and alumni bonuses; concurrency-safe session scheduling with double-booking prevention; end-to-end isolated messaging and private vs shared notes; AI Mentorship Assistant with 45-min agenda generation, discussion questions, notes summarization, and deterministic offline fallbacks; post-session 5-star rating and feedback engine; group mentorship cohort sessions with capacity management; college coordinator institutional intelligence with strict student privacy safeguards; admin mentor verification desk with review queue, approve/reject/suspend governance, and platform analytics; 490 passing tests)
- ✅ **Phase 17: Advanced Learning & Resource Hub** (Curated resource library across 10 resource types; 10 structured career learning paths with ordered modules and practical capstone projects; 5-pillar explainable recommendation engine 30/30/20/10/10 summing to 100%; skill gap to learning path bridge; personal library with private revision notes; knowledge check quizzes with anti-cheat question sanitization and server-side grading; student resource defect reporting; admin verification and grievance moderation desk; idempotent seed content hydration; college institutional learning analytics with zero student PII leakage; 515 passing tests)
- ✅ **Phase 18: Advanced Analytics & Reporting System** (Centralized Metric Definition Layer with transparent formulas, counting units, and limitations; global date filters with 9 presets and custom range; role-scoped analytics across Student personal progress, College institutional conversion funnel with unique students and verified selections, Employer recruitment pipeline, and Super-Admin cross-tenant platform telemetry; RFC 4180 compliant CSV export and formatted document PDF engine; automated daily/weekly/monthly report schedules with recipient delivery; 542 passing tests across 42 test suites)
- ✅ **Phase 19: Advanced Security, Performance & Scalability** (OWASP Top 10 hardening, recursive NoSQL and XSS sanitization, tenant isolation and IDOR prevention with tenantGuard.ts, centralized request validation and pagination bounds, magic byte file signature verification for PDF/DOCX/PNG/JPEG, path traversal defense, 4-tier rate limiting for Auth/AI/Export/API, tenant-scoped LRU caching with TTL expiration, compound database indexes, structured JSON logging with secret masking, enhanced health probes with cache and memory metrics, disaster recovery RPO/RTO plan, 584 passing tests across 45 test suites)
- ⏳ **Phase 20: Final Polish, Production Readiness & Hackathon Submission**
