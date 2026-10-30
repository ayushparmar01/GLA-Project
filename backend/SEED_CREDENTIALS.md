# CareerBridge — Development Seed Data & Demo Credentials
**Hackathon:** MISSION BHARAT HACKATHON | **Problem Statement #07:** Career Access for Colleges with No Placement Cell

---

## 1. Quick Execution Guide

Run seed operations against the local development database:

```powershell
# Idempotently seed or update development records
npm run seed

# Reset all demo records and re-seed from scratch
npm run seed:reset
```

> **Safety Notice:** The seed system includes strict environment checks (`process.env.NODE_ENV === 'production'`) and will immediately abort if attempted in a production environment.

---

## 2. Seeded Demo Accounts

All demo accounts share the standard password:
**`DemoPass@123`**

| Role | Name & Identity | Email | Primary Responsibilities & Test Scenarios |
| :--- | :--- | :--- | :--- |
| **`ADMIN`** | Dr. Rameshwar Joshi | `admin@careerbridge.demo` | Platform governance, verification queues, moderation, system health telemetry, audit logs, and global analytics. |
| **`COLLEGE`** | Prof. Anant Kulkarni (SVRIT Kolhapur) | `college01@careerbridge.demo` | Institutional TPO portal for Tier-2/3 college with no placement cell. Batch cohorts, student readiness tracking, recruiter connections. |
| **`COLLEGE`** | Dr. Sunita Gaikwad (AKREC Nanded) | `college02@careerbridge.demo` | Partner college in rural Marathwada. Cohort management, employer requests, and departmental placement metrics. |
| **`EMPLOYER`** | Kavita Menon (ZenithPay FinTech) | `employer01@careerbridge.demo` | National recruiter posting active drives, reviewing applicants, shortlisting, conducting video interviews, and issuing offers. |
| **`EMPLOYER`** | Rahul Verma (CogniCraft AI Labs) | `employer02@careerbridge.demo` | AI startup hiring for data engineering and paid remote frontend internships. |
| **`EMPLOYER`** | Priyanka Sen (ApexLogic IT Systems) | `employer03@careerbridge.demo` | Enterprise IT services recruiter managing pooled campus hiring drives for fresher trainees. |
| **`STUDENT`** | Aarav Sharma (Kolhapur, B.Tech CSE) | `student01@careerbridge.demo` | Top candidate (8.7 CGPA, 95% profile completion) with selected placement at ZenithPay (₹6.5 - 8.5 LPA), mentor session, and projects. |
| **`STUDENT`** | Pooja Deshmukh (Nanded, B.Tech IT) | `student02@careerbridge.demo` | Data/ML student (8.4 CGPA) with upcoming technical interview at CogniCraft AI Labs. |
| **`STUDENT`** | Rohan Patil (Kolhapur, B.Tech CSE) | `student03@careerbridge.demo` | Cloud/DevOps student (7.9 CGPA) shortlisted at ZenithPay Technologies. |
| **`STUDENT`** | Sneha Kulkarni (Nanded, B.Tech CSE) | `student04@careerbridge.demo` | Top ranker (9.1 CGPA) with verified placement offer at ApexLogic IT Systems. |
| **`MENTOR`** | Vikramaditya Rao (Staff Engineer) | `mentor01@careerbridge.demo` | Rural college alumnus with 11 yrs distributed systems experience. Mentors Tier-2/3 students on system design and interview prep. |

---

## 3. Connected Relational Verification

- **Placement Pipeline Integrity:**
  - `student01@careerbridge.demo` applied $\rightarrow$ shortlisted $\rightarrow$ interviewed $\rightarrow$ **SELECTED** at ZenithPay Technologies.
  - `student02@careerbridge.demo` applied $\rightarrow$ shortlisted $\rightarrow$ **INTERVIEW_SCHEDULED** at CogniCraft AI Labs.
  - `student04@careerbridge.demo` applied $\rightarrow$ shortlisted $\rightarrow$ **SELECTED** at ApexLogic Software Systems.
- **Institutional Cohorts:**
  - SVRIT Kolhapur: Batch 2026 CS/IT Readiness Cohort (Aarav Sharma & Rohan Patil).
  - AKREC Nanded: Batch 2025 Enterprise Cohort (Pooja Deshmukh & Sneha Kulkarni).
- **Recruiter Connections:**
  - ZenithPay Technologies $\longleftrightarrow$ SVRIT Kolhapur (Accepted partnership).
  - CogniCraft AI Labs $\longleftrightarrow$ AKREC Nanded (Accepted partnership).
- **Mentorship Ecosystem:**
  - Active 1-on-1 relationship between Vikramaditya Rao and Aarav Sharma with completed session notes and upcoming milestones.
- **Analytics Alignment:**
  - Real database documents calculate live statistics on College, Employer, Student, and Admin dashboards without synthetic fabrication.
