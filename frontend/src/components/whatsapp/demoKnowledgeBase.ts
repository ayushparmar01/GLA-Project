/**
 * CareerBridge WhatsApp Demo Mode - Structured Local Knowledge Base
 * 
 * Strict Guideline: Contains ONLY real, verified features and architectural capabilities
 * of the CareerBridge platform for MISSION BHARAT Hackathon Challenge #07.
 * Purely frontend-local: Requires ZERO external AI APIs, backend calls, or network requests.
 */

export interface KnowledgeTopic {
  id: string;
  title: string;
  keywords: string[];
  response: string;
  quickReplies?: string[];
}

export interface SuggestedQuestion {
  id: string;
  question: string;
  topicId: string;
}

export type SimulatedNotificationType =
  | 'Job Alert'
  | 'Application Update'
  | 'Interview Reminder'
  | 'Career Readiness Tip'
  | 'Learning Recommendation';

export interface SimulatedNotification {
  id: string;
  type: SimulatedNotificationType;
  title: string;
  previewText: string;
  fullMessage: string;
  timestamp: string;
  tagColor: string;
  suggestedActionLabel?: string;
}

// ==========================================
// 14 VERIFIED KNOWLEDGE BASE TOPICS
// ==========================================

export const DEMO_KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  {
    id: 'what-is-careerbridge',
    title: 'What is CareerBridge?',
    keywords: [
      'what is careerbridge',
      'about careerbridge',
      'mission bharat',
      'overview',
      'platform',
      'purpose',
      'challenge 7',
      'challenge #07',
      'placement cell',
    ],
    response:
      '🇮🇳 *About CareerBridge (MISSION BHARAT Hackathon — Challenge #07)*\n\n' +
      'CareerBridge is an autonomous career development and placement access platform built specifically for colleges with *no active placement cell* or limited corporate infrastructure.\n\n' +
      '*Key Capabilities:*\n' +
      '• *Multilingual Voice Profile Creation* (Tamil, Kannada, English) for tier-2/3 students\n' +
      '• *50 kbps Low-Bandwidth Career Readiness* scorecard (sub-1.2 KB payload for rural 2G/3G connectivity)\n' +
      '• *Explainable Job Matching* with transparent criteria checklists\n' +
      '• *Fast-Track Recruiter Posting* (< 3 minutes) connecting regional employers to grassroots talent\n' +
      '• *Free Curated Learning Hub* and verified alumni mentorship network.\n\n' +
      '_Reply *READINESS*, *JOBS*, or *MENU* to explore!_',
    quickReplies: ['How to check career readiness?', 'How do I find jobs?', 'Tell me about voice profile'],
  },
  {
    id: 'student-profile',
    title: 'Student Registration & Voice Profile Creation',
    keywords: [
      'profile',
      'create profile',
      'register',
      'registration',
      'voice profile',
      'tamil',
      'kannada',
      'signup',
      'student profile',
      'audio',
      'microphone',
    ],
    response:
      '👤 *Student Profile & Multilingual Voice Creation*\n\n' +
      'Students can register at CareerBridge with their basic academic details, skills, and target career interests.\n\n' +
      '🎙️ *Mission Bharat Feature: Voice Profile Creation*\n' +
      '• Enables students from vernacular backgrounds to speak naturally in *Tamil (தமிழ்)* or *Kannada (ಕನ್ನಡ)*.\n' +
      '• The system transcribes audio locally using the Web Speech API and parses name, branch, skills, preferred location, and expected stipend.\n' +
      '• *Strict Human Review:* No unverified field is saved as fact until the student reviews and confirms it on screen.\n\n' +
      '_Navigate to **Profile & Settings** to test the voice profile recorder!_',
    quickReplies: ['What is CareerBridge?', 'How can I improve my skills?', 'How can I check career readiness?'],
  },
  {
    id: 'student-dashboard',
    title: 'Student Dashboard',
    keywords: [
      'student dashboard',
      'dashboard',
      'completion score',
      'profile strength',
      'academic info',
      'overview',
    ],
    response:
      '📊 *Student Dashboard Overview*\n\n' +
      'Your student dashboard provides an actionable placement cockpit:\n\n' +
      '• *Profile Completion Score (0-100%):* Tracks academic info, verified skills, and career preferences.\n' +
      '• *Academic Information Card:* Course, department, education level, and graduation year.\n' +
      '• *Skills & Preferences:* Tagged technical competencies and preferred job locations.\n' +
      '• *Direct Action Links:* Quick jump to Open Campus Drives, Enrolled Cohorts, and ATS Resume Builder.\n\n' +
      '_Reach 100% completion by adding your degree branch and 3 verified skills in Edit Profile!_',
    quickReplies: ['How can I check career readiness?', 'How do I find suitable jobs?'],
  },
  {
    id: 'career-readiness',
    title: 'Career Readiness Assessment (50 kbps Low-Bandwidth Mode)',
    keywords: [
      'readiness',
      'career readiness',
      '50 kbps',
      'low bandwidth',
      'scorecard',
      'readiness report',
      'readiness score',
      'bandwidth',
      'offline',
      '2g',
    ],
    response:
      '⚡ *50 kbps Low-Bandwidth Career Readiness Report*\n\n' +
      'Built for rural and tier-2/3 colleges with unstable 2G/3G internet connections:\n\n' +
      '• *Ultra-Compact Payload:* Emits structured JSON strictly under *1.2 KB* (evaluated in ~190ms even at 50 kbps throttling).\n' +
      '• *Six Core Evaluation Pillars:*\n' +
      '  1. Profile Completeness\n' +
      '  2. Verified Skills Alignment\n' +
      '  3. Project Portfolio Quality\n' +
      '  4. ATS Resume Score\n' +
      '  5. Assessment Performance\n' +
      '  6. Learning Consistency\n' +
      '• *Readiness Bands:* Early Explorer (0-39%), Developing Candidate (40-69%), Job-Ready Talent (70-84%), High-Impact Candidate (85-100%).\n' +
      '• *Offline Cache:* Automatically cached in `localStorage` for offline viewing.\n\n' +
      '_Check your scorecard under **Career Readiness (50 kbps)** in the sidebar!_',
    quickReplies: ['How can I improve my skills?', 'How do I find suitable jobs?'],
  },
  {
    id: 'skills-improvement',
    title: 'Skills & Profile Improvement',
    keywords: [
      'skills',
      'skill gap',
      'improve skills',
      'assessments',
      'portfolio',
      'projects',
      'resume',
      'ats',
      'ats analyzer',
    ],
    response:
      '🛠️ *Skills & Profile Improvement Tools*\n\n' +
      'CareerBridge offers multiple integrated modules to boost your placement candidacy:\n\n' +
      '• *Skill Assessments:* Standardized MCQs and coding evaluations with instant verified badges.\n' +
      '• *Skill Gap Analysis:* Compares your current skills against live employer job requirements.\n' +
      '• *Project Portfolio:* Showcase verified GitHub projects with live demo URLs and tech stack tags.\n' +
      '• *ATS Resume Builder & Analyzer:* Generates clean, scannable resumes with automated formatting and keyword score suggestions.\n\n' +
      '_Add your GitHub project links to increase your recruiter shortlist rate by up to 40%!_',
    quickReplies: ['How can I track my applications?', 'How can I connect with a mentor?'],
  },
  {
    id: 'job-discovery',
    title: 'Job Discovery & Campus Placement Drives',
    keywords: [
      'jobs',
      'find jobs',
      'drives',
      'campus drives',
      'internships',
      'vacancies',
      'opportunities',
      'placement drives',
      'openings',
    ],
    response:
      '💼 *Job Discovery & Open Campus Drives*\n\n' +
      'Access verified recruitment drives from regional startups, SMEs, and national tech employers:\n\n' +
      '• *Tier-2/3 Friendly:* Highlights opportunities specifically open to diploma, rural college, and fresh graduate applicants.\n' +
      '• *Comprehensive Filters:* Filter by technical domain, minimum package/stipend, work location, and eligibility criteria.\n' +
      '• *Direct Application:* 1-click apply using your verified CareerBridge digital profile.\n' +
      '• *Transparent Packages:* Clear separation between fixed CTC and performance incentives.\n\n' +
      '_Check the **Open Campus Drives** tab to view currently active drives!_',
    quickReplies: ['How do I find suitable jobs?', 'How can I track my applications?'],
  },
  {
    id: 'explainable-job-matching',
    title: 'Explainable Job Recommendations',
    keywords: [
      'matching',
      'match rationale',
      'explainable',
      'why matched',
      'recommendations',
      'eligibility checklist',
      'rationale',
      'algorithm',
    ],
    response:
      '🎯 *Explainable Job Recommendations (No Black-Box AI)*\n\n' +
      'Unlike opaque hiring platforms, CareerBridge explains *exactly why* a job matches you through an interactive checklist:\n\n' +
      '✅ *Qualification Check:* Degree requirements (e.g. B.Tech / Diploma / BCA)\n' +
      '✅ *Branch Match:* Engineering or technical specialization compatibility\n' +
      '✅ *Skill Overlap:* Explicit breakdown of your matched skills vs. missing skills\n' +
      '✅ *Academic Cutoff:* Minimum CGPA or percentage threshold check\n' +
      '✅ *Location & Mode:* Remote, Hybrid, or On-site preference alignment\n' +
      '✅ *Fresher Status:* Confirms zero-experience / entry-level suitability.\n\n' +
      '_Click "View Rationale" on any recommended job in **Job Matches & Rationale** to inspect your score!_',
    quickReplies: ['How do I find suitable jobs?', 'How can I improve my skills?'],
  },
  {
    id: 'application-tracking',
    title: 'Job Application Tracking',
    keywords: [
      'track applications',
      'my applications',
      'application status',
      'shortlisted',
      'under review',
      'hiring stages',
      'applied',
    ],
    response:
      '📋 *Real-Time Application Tracking*\n\n' +
      'Track every stage of your recruitment pipeline transparently:\n\n' +
      '• *APPLIED:* Successfully submitted to recruiter pool.\n' +
      '• *UNDER_REVIEW:* Recruiter is screening your ATS profile and verified skills.\n' +
      '• *SHORTLISTED:* Profile approved for technical assessment or interview round.\n' +
      '• *INTERVIEW_SCHEDULED:* Meeting link, date, and interviewer details assigned.\n' +
      '• *OFFERED / REJECTED:* Final decision with transparent feedback.\n\n' +
      '_Inspect live updates under **My Applications** in the student portal!_',
    quickReplies: ['How do I find suitable jobs?', 'What is CareerBridge?'],
  },
  {
    id: 'learning-hub',
    title: 'Learning Hub & Curated Learning Resources',
    keywords: [
      'learning hub',
      'resources',
      'roadmaps',
      'study material',
      'free courses',
      'learning',
      'dsa',
      'web development',
      'cloud',
    ],
    response:
      '📚 *CareerBridge Learning Hub*\n\n' +
      'High-quality, free, curated technical learning roadmaps built for self-paced study:\n\n' +
      '• *Full-Stack Web Development:* React, Node.js, Express, MongoDB, Tailwind CSS\n' +
      '• *Cloud & DevOps Basics:* Linux commands, Git version control, Docker fundamentals, AWS free tier\n' +
      '• *Data Structures & Problem Solving:* Arrays, strings, recursion, sorting, and interview algorithms\n' +
      '• *Milestones & Quizzes:* Self-check milestone quizzes to validate topic mastery.\n\n' +
      '_All resources are 100% free and open-source. Explore the **Learning Hub** in your sidebar!_',
    quickReplies: ['How can I improve my skills?', 'How can I connect with a mentor?'],
  },
  {
    id: 'mentorship',
    title: 'Mentorship Network & Guidance',
    keywords: [
      'mentor',
      'mentorship',
      'connect mentor',
      'alumni',
      'career guidance',
      'advice',
      'mock interview',
      'counseling',
    ],
    response:
      '🤝 *CareerBridge Mentorship Network*\n\n' +
      'Bridge the networking gap by connecting with verified alumni and industry professionals:\n\n' +
      '• *1-on-1 Guidance Requests:* Send direct mentorship requests specifying your career goals.\n' +
      '• *Domain Specialists:* Mentors across Software Engineering, Cloud, Data Science, and UI/UX.\n' +
      '• *Resume & Code Reviews:* Get actionable feedback on your GitHub repos and project architectures.\n' +
      '• *Mock Interviews:* Practice behavioral and technical questions before real placement drives.\n\n' +
      '_Browse verified mentors under **Mentorship Network** in the sidebar!_',
    quickReplies: ['How can I improve my skills?', 'What is CareerBridge?'],
  },
  {
    id: 'college-dashboard',
    title: 'College Dashboard & Student Progress',
    keywords: [
      'college',
      'college dashboard',
      'faculty',
      'tpo',
      'institution',
      'cohorts',
      'placement officer',
      'batch progress',
    ],
    response:
      '🏫 *College Placement Cell Dashboard*\n\n' +
      'Designed for college principals, faculty coordinators, and TPOs at institutions without formal placement cells:\n\n' +
      '• *Student Cohort Management:* Create and manage batches by department (CS, IT, Mech, Electrical) and pass-out year.\n' +
      '• *Aggregate Readiness Scorecard:* View class-wide career readiness metrics and identify struggling students.\n' +
      '• *Pooled Campus Drives:* Partner with neighboring institutions to attract larger recruitment drives collectively.\n' +
      '• *Placement Analytics:* Real-time shortlisting and offer tracking across all registered students.\n\n' +
      '_Log in with a COLLEGE account to access the Institutional Placement Desk!_',
    quickReplies: ['What is CareerBridge?', 'How can employers post jobs?'],
  },
  {
    id: 'employer-dashboard',
    title: 'Employer Dashboard & Fast-Track Job Posting',
    keywords: [
      'employer',
      'employer dashboard',
      'post jobs',
      'post job',
      'recruiter',
      'fast track',
      'under 3 minutes',
      'hiring',
      'job posting',
    ],
    response:
      '🏢 *Employer Recruiter Console & Fast-Track Job Posting*\n\n' +
      'Empowers regional and national recruiters to hire verified grassroots talent efficiently:\n\n' +
      '⚡ *Fast-Track Job Post Wizard (< 3 Minutes)*:\n' +
      '• 3 rapid steps: Basic Role Details → Eligibility & Skills → Review & Post.\n' +
      '• 1-click popular skill chips (React, Node.js, Python, Java, SQL, Linux).\n' +
      '• Standardized tier-2/3 salary & stipend recommendations (₹10k - ₹35k/mo internships, ₹3 - ₹8 LPA full-time).\n' +
      '• Auto-saves draft in browser storage so progress is never lost.\n' +
      '• Direct applicant pipeline management and interview scheduling.\n\n' +
      '_Log in as an EMPLOYER to launch the fast-track job posting wizard!_',
    quickReplies: ['What is CareerBridge?', 'How do I find suitable jobs?'],
  },
  {
    id: 'interviews-updates',
    title: 'Interview & Application Updates',
    keywords: [
      'interview',
      'interviews',
      'interview schedule',
      'google meet',
      'meeting link',
      'updates',
      'alerts',
      'timing',
    ],
    response:
      '📅 *Interview Schedules & Virtual Rooms*\n\n' +
      'Stay organized with direct calendar and video link access for your interviews:\n\n' +
      '• *Virtual Room Details:* Live Google Meet, Microsoft Teams, or in-person venue address.\n' +
      '• *Round Breakdown:* Technical Round 1, Coding Assessment, or HR / Culture round.\n' +
      '• *Time & Timezone:* Precise date and time with reminder notifications.\n' +
      '• *Preparation Checklist:* Direct links to relevant interview prep questions and mock coaching.\n\n' +
      '_View your upcoming rounds under **Scheduled Interviews** in the student portal!_',
    quickReplies: ['How can I track my applications?', 'How can I check career readiness?'],
  },
  {
    id: 'platform-navigation',
    title: 'Platform Navigation & Accessibility',
    keywords: [
      'navigation',
      'sidebar',
      'features',
      'menu',
      'how to use',
      'language',
      'tamil',
      'hindi',
      'telugu',
      'kannada',
      'offline indicator',
      'pwa',
    ],
    response:
      '🧭 *Platform Navigation & Vernacular Accessibility*\n\n' +
      'CareerBridge is engineered for ease of use across India:\n\n' +
      '• *Role-Tailored Sidebar:* Displays only features relevant to your active role (Student, College, Employer, Admin).\n' +
      '• *Multilingual Support:* Toggle UI between English, Hindi (हिंदी), Tamil (தமிழ்), Telugu (తెలుగు), and Kannada (ಕನ್ನಡ).\n' +
      '• *PWA & Offline Indicator:* Alerts you if network drops and loads cached career readiness data.\n' +
      '• *Quick Actions:* One-click shortcuts to resumes, job matches, and learning roadmaps.\n\n' +
      '_Use the language selector in the top bar to switch into your preferred regional language!_',
    quickReplies: ['What is CareerBridge?', 'How can I check career readiness?'],
  },
];

// ==========================================
// 8 EXACT SUGGESTED QUESTIONS (User Prompt)
// ==========================================

export const DEMO_SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  {
    id: 'q1',
    question: 'What is CareerBridge?',
    topicId: 'what-is-careerbridge',
  },
  {
    id: 'q2',
    question: 'How can I create my student profile?',
    topicId: 'student-profile',
  },
  {
    id: 'q3',
    question: 'How can I check my career readiness?',
    topicId: 'career-readiness',
  },
  {
    id: 'q4',
    question: 'How do I find suitable jobs?',
    topicId: 'job-discovery',
  },
  {
    id: 'q5',
    question: 'How can I track my applications?',
    topicId: 'application-tracking',
  },
  {
    id: 'q6',
    question: 'How can I improve my skills?',
    topicId: 'skills-improvement',
  },
  {
    id: 'q7',
    question: 'How can I connect with a mentor?',
    topicId: 'mentorship',
  },
  {
    id: 'q8',
    question: 'How can employers post jobs?',
    topicId: 'employer-dashboard',
  },
];

// ==========================================
// 5 SIMULATED NOTIFICATION PREVIEWS
// ==========================================

export const DEMO_SIMULATED_NOTIFICATIONS: SimulatedNotification[] = [
  {
    id: 'notif-1',
    type: 'Job Alert',
    title: 'New Campus Drive: Junior Cloud Engineer',
    previewText: 'Bharat Cloud Tech is hiring junior cloud engineers (₹3.6 - ₹4.5 LPA). Eligible branches: CS, IT, ECE.',
    fullMessage:
      '🚀 *NEW CAMPUS DRIVE ALERT*\n\n' +
      '🏢 *Company:* Bharat Cloud Tech\n' +
      '💼 *Role:* Junior Cloud Engineer\n' +
      '📍 *Type:* Full-Time · Indore, MP (Tier-2 Hub)\n' +
      '🛠️ *Required Skills:* Linux, Python, AWS Basics, Docker\n' +
      '💰 *Package:* ₹3.60 - ₹4.50 LPA\n' +
      '⏳ *Application Deadline:* 30 Nov 2026\n' +
      '🎯 *Your Match:* 92% (Meets branch & skill criteria)\n\n' +
      '_Reply *APPLY* to submit your CareerBridge profile, or visit portal to view full details._',
    timestamp: 'Today, 09:15 AM',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    suggestedActionLabel: 'View Job Details',
  },
  {
    id: 'notif-2',
    type: 'Application Update',
    title: 'Application Shortlisted: Frontend Developer Trainee',
    previewText: 'TechBharat Labs has reviewed your ATS resume and shortlisted you for technical screening.',
    fullMessage:
      '📋 *APPLICATION STATUS UPDATE*\n\n' +
      '🏢 *Company:* TechBharat Labs\n' +
      '💼 *Role:* Frontend Developer Trainee\n' +
      '📊 *Status:* ⭐ *SHORTLISTED FOR TECHNICAL SCREENING*\n' +
      '📅 *Applied on:* 22 Oct 2026\n' +
      '💬 *Recruiter Note:* "Strong project portfolio in React and Tailwind. Advancing to round 1."\n\n' +
      '_Interview schedule will be shared within 48 hours on CareerBridge._',
    timestamp: 'Yesterday, 04:30 PM',
    tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
    suggestedActionLabel: 'View Application',
  },
  {
    id: 'notif-3',
    type: 'Interview Reminder',
    title: 'Interview Reminder: Technical Round 1 Tomorrow',
    previewText: 'Virtual interview scheduled tomorrow at 11:00 AM IST via Google Meet.',
    fullMessage:
      '📅 *INTERVIEW REMINDER: TOMORROW*\n\n' +
      '🏢 *Company:* Bharat Cloud Tech\n' +
      '💼 *Round:* Technical Round 1 (Problem Solving & Linux)\n' +
      '🕒 *Time:* Tomorrow at 11:00 AM IST\n' +
      '🔗 *Google Meet:* https://meet.google.com/cb-tech-rnd1\n' +
      '📋 *Interviewer:* Senior Cloud Architect\n\n' +
      '💡 *Preparation Tip:* Have your final-year project architecture diagram ready to share on screen.\n\n' +
      '_Good luck! Log in to CareerBridge to review sample interview questions._',
    timestamp: 'Today, 11:00 AM',
    tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    suggestedActionLabel: 'Join Virtual Room',
  },
  {
    id: 'notif-4',
    type: 'Career Readiness Tip',
    title: 'Readiness Insight: Boost Your ATS Resume Score',
    previewText: 'Quantify project achievements to elevate your readiness band into Job-Ready Talent.',
    fullMessage:
      '💡 *WEEKLY CAREER READINESS INSIGHT*\n\n' +
      '📈 *Pillar Focus:* ATS Resume & Project Alignment\n\n' +
      'Did you know? Recruiters reviewing tier-2/3 applicants look for measurable metrics:\n' +
      '• Change "Built a bookstore app" → "Built e-commerce API handling 500 requests with 99.8% uptime."\n' +
      '• Adding your GitHub commit links boosts recruiter shortlist conversion by 28%.\n\n' +
      '⚡ *Current Readiness:* 68% (Developing Candidate)\n' +
      '🎯 *Target Band:* 70%+ (Job-Ready Talent)\n\n' +
      '_Run an ATS scan in **ATS Resume Builder** to unlock your updated score!_',
    timestamp: 'Monday, 10:00 AM',
    tagColor: 'bg-amber-50 text-amber-800 border-amber-200',
    suggestedActionLabel: 'Scan Resume',
  },
  {
    id: 'notif-5',
    type: 'Learning Recommendation',
    title: 'Sprint Recommendation: RESTful API Architecture',
    previewText: 'Close your verified skill gap in backend development with our free curated learning roadmap.',
    fullMessage:
      '📚 *RECOMMENDED LEARNING SPRINT*\n\n' +
      '🚀 *Topic:* RESTful API Architecture & Authentication\n' +
      '⏱️ *Estimated Time:* 3 Hours (Self-Paced)\n' +
      '🎯 *Impact:* Addresses common skill requirement across 14 active campus drives.\n' +
      '✅ *Includes:* Video tutorials, Express.js boilerplate code, and self-check milestone quiz.\n\n' +
      'All materials are 100% free and open-source.\n\n' +
      '_Open the **Learning Hub** in CareerBridge to start this module!_',
    timestamp: '2 days ago',
    tagColor: 'bg-teal-50 text-teal-800 border-teal-200',
    suggestedActionLabel: 'Open Roadmap',
  },
];

// ==========================================
// HONEST FALLBACK RESPONSE
// ==========================================

export const DEMO_HONEST_FALLBACK =
  "I don't have verified information about that yet. Please explore the relevant CareerBridge section or contact your college administrator for assistance.";

// ==========================================
// INTENT & KEYWORD MATCHING ENGINE
// ==========================================

export interface AnswerResult {
  reply: string;
  quickReplies?: string[];
  matchedTopicId?: string;
  isFallback?: boolean;
}

/**
 * Searches the structured local knowledge base strictly using keywords, commands, and intents.
 * Never invents unverified data. Returns DEMO_HONEST_FALLBACK on unknown queries.
 */
export function findBestAnswer(rawQuery: string): AnswerResult {
  const query = rawQuery.trim();
  const normalized = query.toUpperCase();

  // 1. Direct Command Shortcuts
  if (normalized === 'MENU' || normalized === 'HELP' || normalized === '7') {
    return {
      reply:
        '🎓 *CareerBridge Assistant Menu*\n\n' +
        'Choose a topic or reply with the number:\n\n' +
        '*1.* Find Jobs & Internships (Reply *1* or *JOBS*)\n' +
        '*2.* My Applications (Reply *2* or *APPLICATIONS*)\n' +
        '*3.* Interview Updates (Reply *3* or *INTERVIEWS*)\n' +
        '*4.* My Profile & Voice (Reply *4* or *PROFILE*)\n' +
        '*5.* Career Readiness 50 kbps (Reply *5* or *READINESS*)\n' +
        '*6.* Skills & Assessments (Reply *6* or *SKILLS*)\n' +
        '*7.* Learning Hub & Mentors (Reply *7* or *LEARNING*)\n' +
        '*8.* Help & Support (Reply *HELP*)\n\n' +
        '_Or type any question like "What is CareerBridge?" or "How can employers post jobs?"_',
      quickReplies: ['What is CareerBridge?', 'How can I check career readiness?', 'How do I find jobs?'],
      matchedTopicId: 'menu',
    };
  }

  if (normalized === '1' || normalized === 'JOBS' || normalized === 'DRIVES') {
    const topic = DEMO_KNOWLEDGE_TOPICS.find((t) => t.id === 'job-discovery')!;
    return {
      reply: topic.response,
      quickReplies: topic.quickReplies,
      matchedTopicId: topic.id,
    };
  }

  if (normalized === '2' || normalized === 'APPLICATIONS') {
    const topic = DEMO_KNOWLEDGE_TOPICS.find((t) => t.id === 'application-tracking')!;
    return {
      reply: topic.response,
      quickReplies: topic.quickReplies,
      matchedTopicId: topic.id,
    };
  }

  if (normalized === '3' || normalized === 'INTERVIEWS') {
    const topic = DEMO_KNOWLEDGE_TOPICS.find((t) => t.id === 'interviews-updates')!;
    return {
      reply: topic.response,
      quickReplies: topic.quickReplies,
      matchedTopicId: topic.id,
    };
  }

  if (normalized === '4' || normalized === 'PROFILE') {
    const topic = DEMO_KNOWLEDGE_TOPICS.find((t) => t.id === 'student-profile')!;
    return {
      reply: topic.response,
      quickReplies: topic.quickReplies,
      matchedTopicId: topic.id,
    };
  }

  if (normalized === '5' || normalized === 'READINESS') {
    const topic = DEMO_KNOWLEDGE_TOPICS.find((t) => t.id === 'career-readiness')!;
    return {
      reply: topic.response,
      quickReplies: topic.quickReplies,
      matchedTopicId: topic.id,
    };
  }

  if (normalized === '6' || normalized === 'SKILLS') {
    const topic = DEMO_KNOWLEDGE_TOPICS.find((t) => t.id === 'skills-improvement')!;
    return {
      reply: topic.response,
      quickReplies: topic.quickReplies,
      matchedTopicId: topic.id,
    };
  }

  if (normalized === 'STOP') {
    return {
      reply:
        '🛑 *WhatsApp Notifications Paused (Simulated)*\n\n' +
        'Automated alerts are temporarily stopped. Reply *START* anytime to resume notifications.',
      quickReplies: ['START', 'MENU'],
    };
  }

  if (normalized === 'START') {
    return {
      reply:
        '✅ *WhatsApp Notifications Active (Simulated)*\n\n' +
        'You will receive campus drive announcements and interview reminders. Reply *MENU* to view options.',
      quickReplies: ['MENU', 'JOBS', 'READINESS'],
    };
  }

  // 2. Exact match with suggested questions
  const matchedQuestion = DEMO_SUGGESTED_QUESTIONS.find(
    (q) => q.question.toLowerCase() === query.toLowerCase()
  );
  if (matchedQuestion) {
    const topic = DEMO_KNOWLEDGE_TOPICS.find((t) => t.id === matchedQuestion.topicId);
    if (topic) {
      return {
        reply: topic.response,
        quickReplies: topic.quickReplies,
        matchedTopicId: topic.id,
      };
    }
  }

  // 3. Keyword Scoring across Topics
  const lowerQuery = query.toLowerCase();
  let bestTopic: KnowledgeTopic | null = null;
  let bestScore = 0;

  for (const topic of DEMO_KNOWLEDGE_TOPICS) {
    let score = 0;
    for (const kw of topic.keywords) {
      if (lowerQuery.includes(kw)) {
        // Longer phrase matches get higher weight
        score += kw.split(' ').length * 3;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
    }
  }

  // If sufficient keyword overlap found (threshold >= 2)
  if (bestTopic && bestScore >= 2) {
    return {
      reply: bestTopic.response,
      quickReplies: bestTopic.quickReplies,
      matchedTopicId: bestTopic.id,
    };
  }

  // 4. Honest Fallback for Unsupported Questions
  return {
    reply: DEMO_HONEST_FALLBACK,
    quickReplies: ['What is CareerBridge?', 'How can I check career readiness?', 'Show main menu'],
    isFallback: true,
  };
}
