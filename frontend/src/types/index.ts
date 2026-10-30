export type Role = 'STUDENT' | 'EMPLOYER' | 'COLLEGE' | 'ADMIN' | 'MENTOR';

export interface EducationItem {
  id?: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
  graduationYear?: number;
  cgpa?: number;
  isCurrent?: boolean;
}

export interface CertificationItem {
  id?: string;
  title: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  role?: string;
  duration?: string;
  githubUrl?: string;
  liveDemoUrl?: string;
  imageUrl?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  createdAt?: string;
  updatedAt?: string;
}

export interface ExperienceItem {
  id?: string;
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

export interface AchievementItem {
  id?: string;
  title: string;
  description?: string;
  date?: string;
  issuer?: string;
}

export interface ExtracurricularItem {
  id?: string;
  title: string;
  role?: string;
  description?: string;
  year?: number;
}

export interface StudentProfileData {
  educationLevel?: string;
  collegeName?: string;
  course?: string;
  graduationYear?: number;
  cgpa?: number;
  backlogs?: number;
  skills?: string[];
  careerInterests?: string[];
  preferredWorkLocation?: string[];
  profileCompletionScore?: number;
  // Phase 5 Career Profile Extensions
  headline?: string;
  careerObjective?: string;
  specialization?: string;
  technicalSkills?: string[];
  softSkills?: string[];
  educationHistory?: EducationItem[];
  certifications?: CertificationItem[];
  projects?: ProjectItem[];
  internships?: ExperienceItem[];
  workExperience?: ExperienceItem[];
  achievements?: AchievementItem[];
  extracurriculars?: ExtracurricularItem[];
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  preferredJobRoles?: string[];
  preferredWorkLocations?: string[];
  workModePreference?: 'ONSITE' | 'REMOTE' | 'HYBRID' | 'ANY';
  // Phase 10 WhatsApp Preferences
  whatsappNumber?: string;
  whatsappVerified?: boolean;
  whatsappLinkedAt?: string;
  whatsappNotificationsEnabled?: boolean;
  whatsappJobAlertsEnabled?: boolean;
  whatsappApplicationUpdatesEnabled?: boolean;
  whatsappInterviewAlertsEnabled?: boolean;
  whatsappCareerTipsEnabled?: boolean;
  whatsappConsentAt?: string;
  whatsappConsentSource?: string;
  whatsappOptOutAt?: string;
}

export interface EmployerProfileData {
  organizationName?: string;
  industry?: string;
  organizationLocation?: string;
  organizationDescription?: string;
  hiringInterests?: string[];
}

export interface CollegeProfileData {
  institutionName?: string;
  institutionLocation?: string;
  institutionType?: string;
  contactPerson?: string;
  placementEmail?: string;
  placementPhone?: string;
  verified?: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface SafeUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  preferredLanguage: string;
  phoneNumber?: string;
  isActive: boolean;
  isSuspended?: boolean;
  suspensionReason?: string;
  suspendedAt?: string;
  suspendedBy?: string;
  studentProfile?: StudentProfileData;
  employerProfile?: EmployerProfileData;
  collegeProfile?: CollegeProfileData;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseHealth {
  status: 'connected' | 'disconnected' | 'connecting';
  state: string;
  host?: string;
  name?: string;
}

export interface IcanSandboxHealth {
  status: 'ready' | 'unconfigured';
  configured: boolean;
  targetEnvironment: string;
  note: string;
}

export interface SystemHealthData {
  service: string;
  version: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  services: {
    database: DatabaseHealth;
    icanSandbox: IcanSandboxHealth;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface SystemHealthResponse {
  success: boolean;
  data?: SystemHealthData;
  error?: {
    code: string;
    message: string;
  };
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: SafeUser;
    token?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface RoleFeature {
  title: string;
  description: string;
  iconName: string;
  badge: string;
  actions: string[];
}

// ==================== PHASE 3 TYPES ====================

export type CohortStatus = 'ACTIVE' | 'ARCHIVED';

export interface CohortStudentSummary {
  id: string;
  fullName: string;
  email: string;
  course: string;
  educationLevel: string;
  graduationYear?: number;
  skills: string[];
  profileCompletionScore: number;
}

export interface CohortData {
  id: string;
  name: string;
  description?: string;
  collegeId: string;
  academicYear?: string;
  course?: string;
  graduationYear?: number;
  status: CohortStatus;
  studentCount: number;
  studentIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export type OpportunityType = 'JOB' | 'INTERNSHIP' | 'APPRENTICESHIP';
export type WorkMode = 'ONSITE' | 'REMOTE' | 'HYBRID';
export type DriveStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED' | 'PENDING_APPROVAL';

export interface PlacementDriveData {
  id: string;
  title: string;
  description: string;
  collegeId?: string;
  employerId?: string;
  createdBy: string;
  organizationName: string;
  opportunityType: OpportunityType;
  workMode: WorkMode;
  location?: string;
  eligibleCourses?: string[];
  eligibleBranches?: string[];
  eligibleGraduationYears?: number[];
  requiredSkills?: string[];
  preferredSkills?: string[];
  minimumQualification?: string;
  minimumCGPA?: number;
  maxBacklogsAllowed?: number;
  minExperienceYears?: number;
  salaryRange?: string;
  internshipDuration?: string;
  numberOfOpenings?: number;
  recruitmentProcess?: string[];
  applicationDeadline: string;
  driveDate?: string;
  status: DriveStatus;
  cohortIds?: string[];
  applicationCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus =
  | 'APPLIED'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'SELECTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface ApplicationStatusHistoryItem {
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
  changedBy: string;
  changedAt: string;
  note?: string;
}

export interface PlacementApplicationData {
  id: string;
  driveId: string;
  studentId: string;
  collegeId?: string;
  status: ApplicationStatus;
  appliedAt: string;
  statusHistory?: ApplicationStatusHistoryItem[];
  drive?: Partial<PlacementDriveData>;
  student?: Partial<SafeUser>;
  createdAt: string;
  updatedAt: string;
}

export interface EligibilityResult {
  eligible: boolean;
  status: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'NEEDS_VERIFICATION' | 'INCOMPLETE_PROFILE';
  reasons: string[];
  missingRequirements: string[];
  academicEligible?: boolean;
  skillsEligible?: boolean;
  cgpaEligible?: boolean;
  batchEligible?: boolean;
  backlogEligible?: boolean;
  checkedAt: string;
}

export interface CollegeStatsData {
  totalCohorts: number;
  activeCohorts: number;
  totalStudentsEnrolled: number;
  totalDrives: number;
  publishedDrives: number;
  totalApplications: number;
  recentCohorts: CohortData[];
  recentDrives: PlacementDriveData[];
}

// ==================== PHASE 4 TYPES ====================

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface EmployerCompanyProfileData {
  id: string;
  userId: string;
  companyName: string;
  companyDescription: string;
  companyWebsite: string;
  industry: string;
  companySize?: string;
  headquarters?: string;
  companyLogo?: string;
  contactPerson: string;
  designation: string;
  verified: boolean;
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyPublicProfileData {
  id: string;
  userId: string;
  companyName: string;
  companyDescription: string;
  companyWebsite: string;
  industry: string;
  companySize?: string;
  headquarters?: string;
  companyLogo?: string;
  verified: boolean;
  verificationStatus: VerificationStatus;
  createdAt: string;
}

export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';

export interface CollegeEmployerConnectionData {
  id: string;
  collegeId: string;
  employerId: string;
  initiatedBy: 'EMPLOYER' | 'COLLEGE';
  message?: string;
  status: ConnectionStatus;
  collegeName?: string;
  employerName?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type InterviewType = 'ONLINE' | 'OFFLINE';
export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export interface InterviewData {
  id: string;
  applicationId: string;
  driveId: string;
  employerId: string;
  studentId: string;
  interviewRound: string;
  interviewType: InterviewType;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink?: string;
  location?: string;
  instructions?: string;
  status: InterviewStatus;
  createdBy: string;
  driveTitle?: string;
  companyName?: string;
  studentName?: string;
  studentEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployerDashboardStatsData {
  totalOpportunities: number;
  draftOpportunities: number;
  publishedOpportunities: number;
  totalApplications: number;
  shortlistedCandidates: number;
  interviewStageCandidates: number;
  selectedCandidates: number;
  recentOpportunities: PlacementDriveData[];
  recentApplications: PlacementApplicationData[];
  profileCompletionScore: number;
  verificationStatus: VerificationStatus;
  verified: boolean;
}

// ==========================================
// PHASE 5: CAREER PROFILE, RESUME & PORTFOLIO
// ==========================================

export type ResumeTemplate = 'MODERN' | 'PROFESSIONAL' | 'MINIMAL';

export interface ResumeStructuredContent {
  personalInfo: {
    fullName: string;
    email: string;
    phoneNumber?: string;
    location?: string;
    headline?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    summary?: string;
  };
  education: EducationItem[];
  technicalSkills: string[];
  softSkills: string[];
  projects: ProjectItem[];
  experience: ExperienceItem[];
  certifications: CertificationItem[];
  achievements: AchievementItem[];
  extracurriculars?: ExtracurricularItem[];
  customSections?: { title: string; content: string }[];
  visibleSections?: {
    summary?: boolean;
    education?: boolean;
    skills?: boolean;
    projects?: boolean;
    experience?: boolean;
    certifications?: boolean;
    achievements?: boolean;
    extracurriculars?: boolean;
  };
}

export interface ResumeData {
  id: string;
  studentId: string;
  title: string;
  template: ResumeTemplate;
  structuredContent: ResumeStructuredContent;
  version: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileCompletionSection {
  key: string;
  label: string;
  weight: number;
  completed: boolean;
  details: string;
}

export interface ProfileCompletionReport {
  score: number;
  isComplete: boolean;
  sections: ProfileCompletionSection[];
  completedCount: number;
  totalCount: number;
  nextSteps: string[];
}

// ==========================================
// PHASE 6: SKILL TAXONOMY, ASSESSMENTS & READINESS
// ==========================================

export type SkillCategory =
  | 'Programming Languages'
  | 'Data Structures and Algorithms'
  | 'Web Development'
  | 'Databases'
  | 'Cloud Computing'
  | 'AI and Machine Learning'
  | 'Cybersecurity'
  | 'Software Engineering'
  | 'Communication'
  | 'Problem Solving';

export type SkillDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface SkillData {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  relatedSkills: string[];
  difficultyLevel: SkillDifficulty;
  isActive: boolean;
}

export type QuestionType =
  | 'MCQ'
  | 'MULTIPLE_SELECT'
  | 'OUTPUT_PREDICTION'
  | 'DEBUGGING'
  | 'CONCEPTUAL';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface AssessmentQuestion {
  id: string;
  questionText: string;
  questionType: QuestionType;
  codeSnippet?: string;
  options: QuestionOption[];
  correctAnswers?: string[];
  marks: number;
  negativeMarks?: number;
  explanation?: string;
  skill?: string;
}

export interface AssessmentData {
  id: string;
  title: string;
  description: string;
  category: SkillCategory;
  skillsTested: string[];
  difficulty: SkillDifficulty;
  durationMinutes: number;
  totalMarks: number;
  passingPercentage: number;
  questionCount: number;
  questions?: AssessmentQuestion[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AssessmentAttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';

export interface SkillWiseResult {
  skill: string;
  totalQuestions: number;
  correctQuestions: number;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface QuestionEvaluation {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  codeSnippet?: string;
  options: QuestionOption[];
  selectedAnswers: string[];
  correctAnswers: string[];
  isCorrect: boolean;
  marksAwarded: number;
  explanation?: string;
  skill?: string;
}

export interface AssessmentAttemptData {
  id: string;
  studentId: string;
  assessmentId: string;
  assessmentTitle?: string;
  category?: SkillCategory;
  difficulty?: SkillDifficulty;
  status: AssessmentAttemptStatus;
  answers: Record<string, string[]>;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  startedAt: string;
  submittedAt?: string;
  timeTakenSeconds?: number;
  durationMinutes: number;
  skillWiseResults?: SkillWiseResult[];
  questionEvaluations?: QuestionEvaluation[];
  sanitizedQuestions?: AssessmentQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface CareerReadinessFactor {
  name: string;
  category: string;
  weight: number;
  score: number;
  maxScore: number;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_WORK' | 'MISSING';
  details: string;
}

export interface CareerReadinessReport {
  overallScore: number;
  statusBand: 'HIGHLY_JOB_READY' | 'JOB_READY' | 'DEVELOPING' | 'EARLY_STAGE';
  factors: CareerReadinessFactor[];
  missingFactors: string[];
  improvementSuggestions: string[];
  assessmentVerifiedSkillsCount: number;
  disclaimer: string;
  calculatedAt: string;
}

export interface SkillGapItem {
  skill: string;
  status: 'ASSESSMENT_VERIFIED' | 'SELF_DECLARED' | 'MISSING';
  importance: 'REQUIRED' | 'PREFERRED';
  suggestedAssessmentId?: string;
  suggestedAssessmentTitle?: string;
  learningResources?: string[];
}

export interface SkillGapReport {
  driveId?: string;
  driveTitle?: string;
  organizationName?: string;
  requiredSkillsCount: number;
  matchedSkillsCount: number;
  missingSkillsCount: number;
  matchPercentage: number;
  skills: SkillGapItem[];
  learningPath: string[];
}

export interface MatchedOpportunity {
  drive: PlacementDriveData;
  matchScore: number;
  eligibility: EligibilityResult;
  matchingFactors: string[];
  gaps: string[];
  recommendedActions: string[];
  isEligible: boolean;
  isPotentialMatch: boolean;
}

export interface SmartMatchingReport {
  eligibleOpportunities: MatchedOpportunity[];
  potentialMatches: MatchedOpportunity[];
  ineligibleOpportunities: MatchedOpportunity[];
  totalDrivesEvaluated: number;
  studentReadinessScore: number;
  studentVerifiedSkills: string[];
}

// ==========================================
// PHASE 7: AI CAREER GUIDE, ROADMAPS & ASSISTANT
// ==========================================

export type AiProviderType = 'GEMINI' | 'OPENAI' | 'DETERMINISTIC_FALLBACK' | 'MOCK';
export type AiRole = 'user' | 'assistant' | 'system';

export interface AiMessage {
  id: string;
  role: AiRole;
  content: string;
  isFallback?: boolean;
  provider?: string;
  fallbackReason?: string;
  timestamp: string;
}

export interface AiConversationData {
  id: string;
  studentId: string;
  title: string;
  messages: AiMessage[];
  contextSnapshot?: {
    targetRole?: string;
    headline?: string;
    course?: string;
    verifiedSkills?: string[];
    readinessScore?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  description: string;
  order: number;
  estimatedWeeks: number;
  completed: boolean;
  completedAt?: string;
  topics: string[];
  projectIdea?: string;
  practiceTasks?: string[];
}

export type RoadmapStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ARCHIVED';

export interface LearningRoadmapData {
  id: string;
  studentId: string;
  targetRole: string;
  currentSkillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  skillGaps: Array<{
    skill: string;
    status: 'ASSESSMENT_VERIFIED' | 'SELF_DECLARED' | 'MISSING';
    importance: 'REQUIRED' | 'RECOMMENDED';
  }>;
  milestones: RoadmapMilestone[];
  recommendedTopics: string[];
  resourceReferences: Array<{
    title: string;
    url: string;
    type: string;
    provider: string;
  }>;
  estimatedDuration: string;
  progress: number;
  status: RoadmapStatus;
  isAiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ResourceType =
  | 'Documentation'
  | 'Course'
  | 'Tutorial'
  | 'Practice Platform'
  | 'Video'
  | 'Project Guide';

export interface LearningResourceData {
  id: string;
  title: string;
  topic: string;
  skill: string;
  skills?: string[];
  category?: string;
  tags?: string[];
  resourceType: ResourceType | string;
  provider: string;
  url: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  description: string;
  estimatedDuration?: string;
  durationMinutes?: number;
  thumbnailUrl?: string;
  language?: string;
  verificationStatus?: LearningResourceVerificationStatus;
  isPublished?: boolean;
  rating?: number;
  reviewCount?: number;
  clickCount?: number;
  bookmarkCount?: number;
  completionCount?: number;
  isBookmarked?: boolean;
  isCompleted?: boolean;
  createdBy?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResumeFeedbackSection {
  sectionName: string;
  score: number;
  status: 'STRONG' | 'ADEQUATE' | 'NEEDS_IMPROVEMENT' | 'MISSING';
  strengths: string[];
  weaknesses: string[];
  actionableSuggestions: string[];
}

export interface ResumeFeedbackReport {
  resumeId?: string;
  overallScore: number;
  summary: string;
  isFallback: boolean;
  provider: string;
  sections: ResumeFeedbackSection[];
  roleRelevance: {
    targetRole?: string;
    fitScore: number;
    matchingKeywords: string[];
    missingKeywords: string[];
  };
  keyImprovements: string[];
  disclaimer: string;
  analyzedAt: string;
}

export type InterviewTypeCategory = 'TECHNICAL' | 'HR' | 'BEHAVIORAL';

export interface InterviewPracticeQuestion {
  id: string;
  role: string;
  category: InterviewTypeCategory;
  questionText: string;
  context?: string;
  sampleAnswerGuidelines?: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

export interface InterviewFeedbackReport {
  questionId: string;
  questionText: string;
  studentAnswer: string;
  score: number;
  strengths: string[];
  areasForImprovement: string[];
  modelAnswerSnippet: string;
  isFallback: boolean;
  provider: string;
  disclaimer: string;
  evaluatedAt: string;
}

// ==========================================
// PHASE 8: NOTIFICATIONS, EVENTS & COMMUNICATION
// ==========================================

export type NotificationType =
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_STATUS_CHANGED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_RESCHEDULED'
  | 'INTERVIEW_CANCELLED'
  | 'DRIVE_PUBLISHED'
  | 'DRIVE_DEADLINE_REMINDER'
  | 'CONNECTION_REQUEST'
  | 'CONNECTION_ACCEPTED'
  | 'CONNECTION_REJECTED'
  | 'EVENT_ANNOUNCEMENT'
  | 'EVENT_REGISTRATION_CONFIRMED'
  | 'ROADMAP_REMINDER'
  | 'SYSTEM_ANNOUNCEMENT';

export type RelatedEntityType =
  | 'APPLICATION'
  | 'INTERVIEW'
  | 'PLACEMENT_DRIVE'
  | 'COLLEGE_CONNECTION'
  | 'CAREER_EVENT'
  | 'ROADMAP'
  | 'ANNOUNCEMENT'
  | 'SYSTEM';

export interface NotificationData {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: string;
  readAt?: string | null;
  createdAt: string;
  expiresAt?: string;
  isRead: boolean;
}

export type CareerEventType =
  | 'WEBINAR'
  | 'WORKSHOP'
  | 'HACKATHON'
  | 'CAREER_FAIR'
  | 'INTERVIEW_DRIVE'
  | 'TRAINING_SESSION';

export type CareerEventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

export interface CareerEventData {
  id: string;
  title: string;
  description: string;
  eventType: CareerEventType;
  organizerId: string;
  organizerRole: 'COLLEGE' | 'EMPLOYER' | 'ADMIN';
  organizerName?: string;
  collegeId?: string;
  startAt: string;
  endAt: string;
  location: string;
  meetingUrl?: string;
  registrationDeadline: string;
  capacity: number;
  registeredCount: number;
  isFull: boolean;
  isDeadlinePassed: boolean;
  eligibility?: {
    courses?: string[];
    minCgpa?: number;
    graduationYears?: number[];
  };
  status: CareerEventStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isRegistered?: boolean;
}

export type EventRegistrationStatus = 'REGISTERED' | 'CANCELLED' | 'WAITLISTED';
export type AttendanceStatus = 'NOT_RECORDED' | 'ATTENDED' | 'ABSENT';

export interface EventRegistrationData {
  id: string;
  eventId: string;
  userId: string;
  registrationStatus: EventRegistrationStatus;
  registeredAt: string;
  attendanceStatus: AttendanceStatus;
  studentSnapshot?: {
    fullName: string;
    email: string;
    course?: string;
    collegeName?: string;
    graduationYear?: number;
  };
}

export type AnnouncementAudience = 'ALL' | 'COLLEGE_STUDENTS' | 'COHORT';
export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorRole: 'COLLEGE' | 'ADMIN';
  authorName: string;
  targetAudience: AnnouncementAudience;
  collegeId?: string;
  cohortId?: string;
  priority: AnnouncementPriority;
  expiresAt?: string;
  createdAt: string;
}

// ==========================================
// PHASE 9: ADMIN CONTROL CENTRE & GOVERNANCE
// ==========================================

export interface AdminActivityLogItem {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  resourceType: string;
  resourceId?: string;
  reason?: string;
  timestamp: string;
}

export interface AdminDashboardMetrics {
  totalUsers: number;
  totalStudents: number;
  totalEmployers: number;
  totalColleges: number;
  activeCohorts: number;
  publishedOpportunities: number;
  totalApplications: number;
  activeCareerEvents: number;
  pendingEmployerVerifications: number;
  pendingCollegeVerifications: number;
  recentActivities: AdminActivityLogItem[];
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorRole: Role;
  action: string;
  resourceType: string;
  resourceId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
  timestamp: string;
}

export type ModerationItemTargetType =
  | 'OPPORTUNITY'
  | 'EMPLOYER_PROFILE'
  | 'ANNOUNCEMENT'
  | 'EVENT'
  | 'USER_CONTENT';

export type ModerationItemStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISMISSED'
  | 'ACTION_TAKEN';

export interface ModerationItemData {
  id: string;
  targetType: ModerationItemTargetType;
  targetId: string;
  targetTitle?: string;
  reason: string;
  flaggedBy?: string;
  flaggedByName?: string;
  status: ModerationItemStatus;
  moderatorNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformAnalyticsReport {
  userGrowth: Array<{
    date: string;
    students: number;
    employers: number;
    colleges: number;
  }>;
  opportunityCategories: Array<{
    category: string;
    count: number;
  }>;
  applicationFunnel: {
    applied: number;
    shortlisted: number;
    interviewScheduled: number;
    selected: number;
    rejected: number;
    withdrawn: number;
  };
  transparentPlacementOutcomes: {
    totalSelected: number;
    offerConfirmed: number;
    joined: number;
    outcomeVerified: number;
    note: string;
  };
  topSkillsInDemand: Array<{
    skill: string;
    count: number;
  }>;
}

export interface AdminSystemHealthReport {
  server: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptimeSeconds: number;
    memoryUsage: {
      heapUsedMB: number;
      heapTotalMB: number;
      rssMB: number;
    };
    environment: string;
    nodeVersion: string;
  };
  database: {
    status: 'connected' | 'disconnected' | 'connecting';
    host?: string;
    name?: string;
  };
  aiProvider: {
    configured: boolean;
    activeProvider: string;
    status: 'healthy' | 'fallback_mode';
  };
  notifications: {
    status: 'operational';
    activeSseClients: number;
  };
  recentErrorCount: number;
  sanitizedDiagnostics: string[];
}

// ==========================================
// PHASE 10: WHATSAPP CAREER ASSISTANT
// ==========================================

export type WhatsAppAccountStatus = 'ACTIVE' | 'OPTED_OUT' | 'UNLINKED';

export interface WhatsAppPreferences {
  notificationsEnabled?: boolean;
  jobAlertsEnabled?: boolean;
  applicationUpdatesEnabled?: boolean;
  interviewAlertsEnabled?: boolean;
  careerTipsEnabled?: boolean;
}

export interface WhatsAppAccountData {
  id: string;
  userId: string;
  phoneNumber: string;
  verified: boolean;
  linkedAt: string;
  notificationsEnabled: boolean;
  jobAlertsEnabled: boolean;
  applicationUpdatesEnabled: boolean;
  interviewAlertsEnabled: boolean;
  careerTipsEnabled: boolean;
  consentAt?: string;
  consentSource?: string;
  optOutAt?: string;
  status: WhatsAppAccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppLinkRequestResult {
  code: string;
  expiresInSeconds: number;
  expiresAt: string;
  officialPhoneNumber: string;
  instruction: string;
}

export interface WhatsAppStatusData {
  linked: boolean;
  phoneNumber?: string;
  verified?: boolean;
  linkedAt?: string;
  preferences?: WhatsAppPreferences;
  status?: WhatsAppAccountStatus;
  integrationConfigured: boolean;
  officialNumber?: string;
}

export interface WhatsAppAdminAnalytics {
  totalLinkedAccounts: number;
  totalOptedIn: number;
  totalOptedOut: number;
  messagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
  recentWebhookEventCount: number;
  recentDeliveryFailureCount: number;
}

export type WhatsAppWebhookEventProcessingStatus = 'RECEIVED' | 'PROCESSED' | 'FAILED' | 'DUPLICATE';

export interface WhatsAppWebhookEventData {
  id: string;
  eventId: string;
  eventType: string;
  status: WhatsAppWebhookEventProcessingStatus;
  processedAt: string;
}

export type WhatsAppIntegrationState = 'CONFIGURED' | 'NOT_CONFIGURED' | 'CONNECTED_VERIFIED' | 'ERROR';

export interface WhatsAppIntegrationStatusReport {
  status: WhatsAppIntegrationState;
  enabled: boolean;
  apiVersion: string;
  phoneNumberId?: string;
  wabaId?: string;
  webhookPath: string;
  webhookVerified: boolean;
  lastWebhookReceivedAt?: string;
  lastErrorMessage?: string;
}

// ==========================================
// Phase 13: Intelligent Job Matching & Recommendations
// ==========================================

export type MatchCategory = 'EXCELLENT_MATCH' | 'STRONG_MATCH' | 'MODERATE_MATCH' | 'LOW_MATCH';
export type EligibilityStatus = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'NEEDS_VERIFICATION' | 'INCOMPLETE_PROFILE';

export interface RecommendationExplanation {
  matchingSkills: string[];
  missingSkills: string[];
  academicCompatibility: string;
  assessmentCompatibility: string;
  preferenceCompatibility: string;
  recommendedActions: string[];
  checklist?: string[];
  whyItMatches?: string[];
  whyItDoesNotMatch?: string[];
}

export interface RecommendationScoreBreakdown {
  skillsScore: number;          // max 35
  educationScore: number;       // max 20
  assessmentScore: number;      // max 15
  experienceScore: number;      // max 10
  locationScore: number;        // max 10
  rolePreferenceScore: number;  // max 10
}

export interface JobRecommendationData {
  jobId: string;
  drive?: PlacementDriveData;
  matchScore: number;            // 0 - 100
  scoreCoverage: number;         // 0 - 100
  matchCategory: MatchCategory;
  eligibilityStatus: EligibilityStatus;
  eligibility: EligibilityResult;
  readinessScore: number;        // 0 - 100 from CareerReadinessService (unmingled)
  scoreBreakdown: RecommendationScoreBreakdown;
  explanation: RecommendationExplanation;
  recommendedActions: string[];
  generatedAt: string;
}

export interface MatchingWeightsConfig {
  skills: number;          // 35
  education: number;       // 20
  assessment: number;      // 15
  experience: number;      // 10
  location: number;        // 10
  rolePreference: number;  // 10
}

export interface RecommendationConfigurationData {
  scoringWeights: MatchingWeightsConfig;
  scoringVersion: string;
  updatedBy?: string;
  updatedAt: string;
}

export interface SkillGapItem {
  skill: string;
  requirementType: 'MANDATORY' | 'PREFERRED';
  studentProficiency?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'NONE';
  verified: boolean;
  gapCategory: 'MATCHED' | 'MISSING_MANDATORY' | 'MISSING_PREFERRED' | 'NEEDS_IMPROVEMENT';
  relevanceScore: number;
  recommendedAction: string;
  recommendedLearningResource?: {
    title: string;
    topic: string;
    difficulty: string;
    url: string;
    source: string;
  };
}

export interface StudentSkillGapAnalysisReport {
  studentId: string;
  overallMatchScoreAverage: number;
  matchingSkillsCount: number;
  missingSkillsCount: number;
  criticalMissingSkills: string[];
  gaps: SkillGapItem[];
  prioritizedLearningSequence: string[];
  analyzedAt: string;
}

export interface CollegePlacementIntelligenceReport {
  collegeId: string;
  totalStudents: number;
  completeProfileCount: number;
  incompleteProfileCount: number;
  driveEligibilityBreakdown: {
    driveId: string;
    driveTitle: string;
    eligibleCount: number;
    ineligibleCount: number;
    totalEvaluated: number;
  }[];
  topInDemandSkills: { skill: string; demandCount: number }[];
  commonSkillGaps: { skill: string; gapCount: number }[];
  departmentBreakdown: { department: string; studentCount: number; avgReadiness: number }[];
  generatedAt: string;
}

export interface EmployerCandidateMatchData {
  studentId: string;
  fullName: string;
  course?: string;
  graduationYear?: number;
  cgpa?: number;
  matchScore: number;
  matchCategory: MatchCategory;
  eligibilityStatus: EligibilityStatus;
  matchingSkills: string[];
  missingSkills: string[];
  applicationId?: string;
  applicationStatus?: ApplicationStatus;
  readinessScore: number;
  hasVerifiedAssessments: boolean;
  appliedAt?: string;
}

// ==========================================
// Phase 14: AI Mock Interview Preparation & Evaluation
// ==========================================

export type MockInterviewType =
  | 'TECHNICAL'
  | 'HR'
  | 'BEHAVIORAL'
  | 'ROLE_SPECIFIC'
  | 'JOB_SPECIFIC'
  | 'RESUME_BASED';

export type MockInterviewDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type MockInterviewSessionStatus =
  | 'CREATED'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'SUBMITTED'
  | 'EVALUATING'
  | 'COMPLETED'
  | 'FAILED';

export type MockInterviewQuestionType =
  | 'CONCEPTUAL'
  | 'CODING'
  | 'SCENARIO'
  | 'BEHAVIORAL'
  | 'DEBUGGING'
  | 'PROJECT_EXPLANATION';

export interface MockInterviewQuestionData {
  id: string;
  questionText: string;
  category: MockInterviewType;
  topic: string;
  role: string;
  difficulty: MockInterviewDifficulty;
  questionType: MockInterviewQuestionType;
  expectedConcepts: string[];
  suggestedApproach?: string;
  starterCode?: string;
  codeLanguage?: string;
  timeLimitSeconds?: number;
  sourceType: 'CURATED' | 'JOB_DESCRIPTION' | 'RESUME' | 'ADMIN';
}

export interface MockInterviewAnswerData {
  questionId: string;
  answerText: string;
  answerType: 'TEXT' | 'CODE';
  codeLanguage?: string;
  timeSpentSeconds: number;
  submittedAt: string;
}

export interface MockInterviewQuestionFeedback {
  questionId: string;
  questionText: string;
  studentAnswer: string;
  score: number;
  strengths: string[];
  areasForImprovement: string[];
  missingConcepts: string[];
  suggestedApproach: string;
  starEvaluation?: {
    situationScore: number;
    taskScore: number;
    actionScore: number;
    resultScore: number;
  };
  codingEvaluation?: {
    correctnessScore: number;
    complexityExplanation: string;
    codeQualityScore: number;
  };
}

export interface MockInterviewSessionEvaluation {
  overallScore: number;
  categoryScores: Record<string, number>;
  strengths: string[];
  improvementAreas: string[];
  questionFeedbacks: MockInterviewQuestionFeedback[];
  nextSteps: string[];
  isFallback: boolean;
  provider: string;
  rubricVersion: string;
  disclaimer: string;
  evaluatedAt: string;
}

export interface MockInterviewSessionData {
  id: string;
  studentId: string;
  interviewType: MockInterviewType;
  targetRole: string;
  difficulty: MockInterviewDifficulty;
  language: string;
  durationMinutes: number;
  questionCount: number;
  jobId?: string;
  jobTitle?: string;
  companyName?: string;
  resumeId?: string;
  status: MockInterviewSessionStatus;
  questions: MockInterviewQuestionData[];
  answers: MockInterviewAnswerData[];
  evaluation?: MockInterviewSessionEvaluation;
  startedAt?: string;
  submittedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockInterviewSessionConfig {
  interviewType: MockInterviewType;
  targetRole: string;
  difficulty: MockInterviewDifficulty;
  durationMinutes: number;
  questionCount: number;
  language: string;
  focusTopics?: string[];
  jobId?: string;
  resumeId?: string;
}

export interface InterviewCoachQuery {
  sessionId: string;
  questionId: string;
  mode: 'PRACTICE' | 'MOCK';
  queryType: 'HINT' | 'CONCEPT_EXPLANATION' | 'STRUCTURE_ADVICE' | 'FOLLOWUP_QUESTION';
  studentInput?: string;
}

export interface InterviewCoachResponse {
  response: string;
  suggestedTopics?: string[];
  disclaimer: string;
}

export interface StudentInterviewAnalytics {
  totalSessions: number;
  completedSessions: number;
  abandonedSessions: number;
  averageScore: number;
  totalQuestionsAnswered: number;
  strongestCategory: string;
  weakestCategory: string;
  categoryBreakdown: Array<{ category: string; sessionCount: number; averageScore: number }>;
  topicBreakdown: Array<{ topic: string; questionsCount: number; averageScore: number; status: 'STRONG' | 'NEEDS_PRACTICE' }>;
  difficultyBreakdown: Array<{ difficulty: string; averageScore: number }>;
  recentTrend: Array<{ date: string; score: number; role: string }>;
}

export interface PersonalizedInterviewRoadmap {
  studentId: string;
  targetRole: string;
  overallReadiness: number;
  recommendedTopics: Array<{
    topic: string;
    category: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
    practiceQuestionCount: number;
    learningResourceUrl?: string;
  }>;
  generatedAt: string;
}

export interface CollegeInterviewAnalyticsReport {
  collegeId: string;
  totalStudentsParticipated: number;
  totalSessionsCompleted: number;
  averageCollegeScore: number;
  popularCategories: Array<{ category: string; count: number }>;
  commonStrugglingTopics: Array<{ topic: string; averageScore: number; studentCount: number }>;
  generatedAt: string;
}

export interface AdminInterviewQuestionData {
  id: string;
  questionText: string;
  category: MockInterviewType;
  topic: string;
  role: string;
  difficulty: MockInterviewDifficulty;
  questionType: MockInterviewQuestionType;
  expectedConcepts: string[];
  suggestedApproach: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// PHASE 15: ADVANCED AI ATS RESUME ANALYZER
// ==========================================

export type ResumeDocumentFileType = 'PDF' | 'DOCX';
export type ResumeDocumentStatus = 'UPLOADED' | 'PARSED' | 'ERROR';

export interface ExtractedResumeContact {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  summary?: string;
}

export interface ExtractedEducationItem {
  institution: string;
  degree: string;
  branch?: string;
  startYear?: string;
  endYear?: string;
  cgpa?: string;
}

export interface ExtractedExperienceItem {
  company: string;
  role: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  bullets: string[];
}

export interface ExtractedProjectItem {
  title: string;
  description?: string;
  technologies: string[];
  link?: string;
  bullets: string[];
}

export interface ExtractedCertificationItem {
  name: string;
  issuer?: string;
  year?: string;
  link?: string;
}

export interface ExtractedStructuredResume {
  contact: ExtractedResumeContact;
  education: ExtractedEducationItem[];
  technicalSkills: string[];
  softSkills: string[];
  workExperience: ExtractedExperienceItem[];
  projects: ExtractedProjectItem[];
  certifications: ExtractedCertificationItem[];
  achievements: string[];
  rawTextLength: number;
}

export interface ResumeDocumentData {
  id: string;
  studentId: string;
  fileName: string;
  fileType: ResumeDocumentFileType;
  fileSize: number;
  extractionStatus: ResumeDocumentStatus;
  extractedText: string;
  structuredData: ExtractedStructuredResume;
  createdAt: string;
  updatedAt: string;
}

export type AtsScoreTier =
  | 'STRONG_ALIGNMENT'
  | 'GOOD_ALIGNMENT'
  | 'MODERATE_ALIGNMENT'
  | 'NEEDS_IMPROVEMENT';

export interface AtsScoreBreakdown {
  requiredSkillCoverage: number;
  jobKeywordAlignment: number;
  projectExperienceAlignment: number;
  educationAlignment: number;
  structureCompleteness: number;
  achievementsCertifications: number;
  formattingChecks: number;
  weights: {
    requiredSkills: number;
    jobKeywords: number;
    projectsExperience: number;
    education: number;
    structure: number;
    achievementsCertifications: number;
    formatting: number;
  };
}

export interface AtsKeywordAnalysis {
  matchedKeywords: string[];
  missingKeywords: string[];
  partiallyMatchedKeywords: Array<{ keyword: string; resumeTerm: string }>;
  additionalResumeKeywords: string[];
}

export interface AtsSkillGapItem {
  skill: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'MISSING' | 'PARTIAL' | 'MATCHED';
  category: string;
  learningResources: Array<{ title: string; topic: string; provider: string; url: string }>;
}

export interface AtsQualitySectionCheck {
  name: string;
  present: boolean;
  status: 'PASS' | 'WARNING' | 'NEEDS_ATTENTION';
  notes: string;
}

export interface AtsResumeQualityReport {
  contactCompleteness: AtsQualitySectionCheck;
  structureCompleteness: AtsQualitySectionCheck;
  projectQuality: AtsQualitySectionCheck;
  experienceQuality: AtsQualitySectionCheck;
  formattingChecks: AtsQualitySectionCheck;
  fresherFriendly: boolean;
  overallQualityScore: number;
  warnings: string[];
}

export interface AtsBulletSuggestion {
  originalBullet: string;
  suggestedBullet: string;
  section: string;
  reason: string;
  actionVerbUsed: string;
}

export interface AtsAiFeedback {
  overallFeedback: string;
  bulletSuggestions: AtsBulletSuggestion[];
  projectImprovementTips: string[];
  summarySuggestion?: string;
  missingInfoWarnings: string[];
  interviewPrepTips: string[];
  isFallback: boolean;
}

export interface AtsAnalysisResultData {
  id: string;
  studentId: string;
  documentId: string;
  jobId?: string;
  jobTitle: string;
  companyName: string;
  isCustomJob: boolean;
  jobDescriptionText: string;
  atsScore: number;
  scoreTier: AtsScoreTier;
  scoreBreakdown: AtsScoreBreakdown;
  dataCoveragePercentage: number;
  reasons: string[];
  keywordAnalysis: AtsKeywordAnalysis;
  skillGapAnalysis: AtsSkillGapItem[];
  qualityReport: AtsResumeQualityReport;
  aiFeedback: AtsAiFeedback;
  disclaimer: string;
  createdAt: string;
}

export interface ResumeSuggestionData {
  id: string;
  studentId: string;
  analysisId: string;
  section: string;
  originalText: string;
  suggestedText: string;
  reason: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export interface ResumeVersionData {
  id: string;
  studentId: string;
  documentId: string;
  versionNumber: number;
  structuredData: ExtractedStructuredResume;
  changeSummary: string;
  createdAt: string;
}

export interface CollegeResumeAnalyticsReport {
  collegeId: string;
  totalStudentsUsingAnalyzer: number;
  totalAnalysesCompleted: number;
  averageAtsScore: number;
  commonMissingSkills: Array<{ skill: string; count: number }>;
  commonQualityIssues: Array<{ issue: string; occurrences: number }>;
  generatedAt: string;
}

// ==========================================
// PHASE 16: MENTORSHIP & INDUSTRY CONNECT
// ==========================================

export type MentorVerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
export type MentorshipRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
export type MentorshipRelationshipStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'TERMINATED';
export type MentorshipGoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type MentorshipSessionStatus = 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type MentorshipSessionType = 'ONE_ON_ONE' | 'GROUP';
export type NoteVisibility = 'PRIVATE' | 'SHARED';
export type MentorMatchCategory = 'EXCELLENT_MATCH' | 'STRONG_MATCH' | 'MODERATE_MATCH' | 'LIMITED_MATCH';

export interface MentorTimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface MentorVerificationEvidence {
  documentUrl?: string;
  workEmail?: string;
  idProofUrl?: string;
  submissionNotes?: string;
}

export interface MentorProfileData {
  id: string;
  userId: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  organization: string;
  designation: string;
  experienceYears: number;
  industry: string;
  expertise: string[];
  mentorshipTopics: string[];
  bio: string;
  languages: string[];
  isAlumni: boolean;
  almaMaterCollegeId?: string;
  almaMaterCollegeName?: string;
  graduationYear?: number;
  branch?: string;
  linkedinUrl?: string;
  maximumMentees: number;
  activeMenteeCount: number;
  verificationStatus: MentorVerificationStatus;
  verificationEvidence?: MentorVerificationEvidence;
  verificationReviewedAt?: string;
  verificationReviewedBy?: string;
  verificationRejectionReason?: string;
  availableDays: string[];
  timeSlots: MentorTimeSlot[];
  ratingAverage: number;
  totalReviews: number;
  totalSessionsCompleted: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentMentorshipProfileData {
  id: string;
  studentId: string;
  careerGoals: string[];
  preferredTopics: string[];
  preferredIndustries: string[];
  preferredLanguages: string[];
  preferredSessionTypes: MentorshipSessionType[];
  currentMentorshipCount: number;
  maxConcurrentMentorships: number;
  createdAt: string;
  updatedAt: string;
}

export interface MentorMatchFactors {
  expertiseAlignment: number; // Max 30
  goalAlignment: number;      // Max 20
  industryAlignment: number;  // Max 15
  topicAlignment: number;     // Max 15
  languageMatch: number;      // Max 10
  availabilityScore: number;  // Max 10
}

export interface MentorRecommendationData {
  mentor: MentorProfileData;
  compatibilityScore: number; // 0 - 100
  matchCategory: MentorMatchCategory;
  factors: MentorMatchFactors;
  positiveMatchReasons: string[];
  potentialGaps: string[];
}

export interface MentorshipRequestData {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  mentorId: string;
  mentorName?: string;
  mentorProfileId: string;
  topic: string;
  objective: string;
  introduction: string;
  preferredFormat: MentorshipSessionType;
  status: MentorshipRequestStatus;
  responseMessage?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MentorshipRelationshipData {
  id: string;
  studentId: string;
  studentName?: string;
  mentorId: string;
  mentorName?: string;
  mentorOrganization?: string;
  mentorDesignation?: string;
  mentorProfileId: string;
  requestId: string;
  topic: string;
  primaryObjective: string;
  status: MentorshipRelationshipStatus;
  startDate: string;
  endDate?: string;
  completedSessions: number;
  totalGoals: number;
  completedGoals: number;
  overallProgress: number; // 0 - 100
  createdAt: string;
  updatedAt: string;
}

export interface MentorshipGoalData {
  id: string;
  relationshipId: string;
  studentId: string;
  mentorId: string;
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  targetDate?: string;
  progress: number; // 0 - 100
  status: MentorshipGoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MentorshipSessionData {
  id: string;
  relationshipId: string;
  mentorId: string;
  studentId: string;
  title: string;
  sessionTopic: string;
  scheduledStart: string;
  scheduledEnd: string;
  durationMinutes: number;
  sessionType: MentorshipSessionType;
  meetingLink: string;
  status: MentorshipSessionStatus;
  cancellationReason?: string;
  agenda: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MentorshipMessageData {
  id: string;
  relationshipId: string;
  senderId: string;
  senderName?: string;
  receiverId: string;
  content: string;
  readAt?: string;
  createdAt: string;
}

export interface MentorshipNoteData {
  id: string;
  relationshipId: string;
  sessionId?: string;
  authorId: string;
  authorName?: string;
  content: string;
  visibility: NoteVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface MentorshipFeedbackData {
  id: string;
  relationshipId: string;
  sessionId?: string;
  submittedBy: string;
  targetUserId: string;
  role: 'STUDENT' | 'MENTOR';
  rating: number; // 1 - 5
  writtenFeedback: string;
  strengthsHighlight: string[];
  areasToImprove: string[];
  isPublic: boolean;
  createdAt: string;
}

export interface MentorshipGroupData {
  id: string;
  mentorId: string;
  mentorName?: string;
  mentorOrganization?: string;
  title: string;
  description: string;
  topic: string;
  maximumParticipants: number;
  currentParticipantCount: number;
  memberIds: string[];
  scheduledStart: string;
  scheduledEnd: string;
  meetingLink: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface CollegeMentorshipAnalyticsReport {
  collegeId: string;
  collegeName?: string;
  totalAlumniMentors: number;
  verifiedAlumniMentors: number;
  totalMentorshipSessions: number;
  activeStudentMentees: number;
  averageSatisfactionRating: number;
  topMentorshipTopics: Array<{ topic: string; count: number }>;
  topIndustriesRepresented: Array<{ industry: string; count: number }>;
  generatedAt: string;
}

export interface AdminMentorshipAnalyticsReport {
  totalMentorsRegistered: number;
  verifiedMentors: number;
  pendingVerifications: number;
  rejectedMentors: number;
  suspendedMentors: number;
  totalActiveRelationships: number;
  totalSessionsConducted: number;
  averagePlatformRating: number;
  popularMentorshipTopics: Array<{ topic: string; count: number }>;
  topIndustries: Array<{ industry: string; count: number }>;
  generatedAt: string;
}

export interface MentorshipAiAgendaResponse {
  topic: string;
  durationMinutes: number;
  agendaItems: Array<{ timeSlot: string; topic: string; notes: string }>;
  suggestedPreparation: string[];
  isFallback: boolean;
}

export interface MentorshipAiQuestionsResponse {
  topic: string;
  suggestedQuestions: Array<{ category: string; question: string; purpose: string }>;
  isFallback: boolean;
}

export interface MentorshipAiNotesSummaryResponse {
  summary: string;
  keyTakeaways: string[];
  actionItems: Array<{ item: string; assignee: 'STUDENT' | 'MENTOR'; priority: 'HIGH' | 'MEDIUM' | 'LOW' }>;
  isFallback: boolean;
}

// ==========================================
// PHASE 17: ADVANCED LEARNING & RESOURCE HUB
// ==========================================

export type ExtendedResourceType =
  | 'Documentation'
  | 'Course'
  | 'Tutorial'
  | 'Practice Platform'
  | 'Video'
  | 'Project Guide'
  | 'Video Tutorials'
  | 'Courses'
  | 'Articles'
  | 'Article'
  | 'Interview Prep'
  | 'Coding Challenges'
  | 'Coding Challenge'
  | 'Books'
  | 'Book'
  | 'Project Tutorials'
  | 'Project Tutorial'
  | 'Certifications'
  | 'Certification'
  | string;

export type LearningResourceVerificationStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'ARCHIVED';

export type LearningEnrollmentStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PAUSED';

export type ModuleCompletionStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export type ModuleCompletionMethod =
  | 'STUDENT_CONFIRMED'
  | 'QUIZ_VERIFIED'
  | 'AUTO';

export type LearningActivityType =
  | 'RESOURCE_OPENED'
  | 'RESOURCE_STARTED'
  | 'RESOURCE_COMPLETED'
  | 'PATH_ENROLLED'
  | 'MODULE_COMPLETED'
  | 'QUIZ_ATTEMPTED';

export type ResourceReportReason =
  | 'BROKEN_LINK'
  | 'OUTDATED_CONTENT'
  | 'INACCURATE_INFORMATION'
  | 'INAPPROPRIATE'
  | 'OTHER';

export type ResourceReportStatus =
  | 'PENDING'
  | 'REVIEWED'
  | 'RESOLVED'
  | 'DISMISSED';

export interface LearningCategoryData {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  isActive: boolean;
  order: number;
}

export interface LearningPathModuleActivity {
  title: string;
  description: string;
  type: 'CODING' | 'PROJECT' | 'EXERCISE' | 'QUIZ';
  link?: string;
}

export interface LearningModuleData {
  id: string;
  learningPathId: string;
  sequence: number;
  title: string;
  description: string;
  skillsCovered: string[];
  resourceIds: string[];
  resources?: LearningResourceData[];
  practiceActivities: LearningPathModuleActivity[];
  quizId?: string;
  isRequired: boolean;
  estimatedHours: number;
  userProgress?: {
    status: ModuleCompletionStatus;
    completionMethod?: ModuleCompletionMethod;
    completedAt?: string;
    quizScore?: number;
    notes?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface LearningPathData {
  id: string;
  title: string;
  slug: string;
  description: string;
  careerRole: string;
  targetSkills: string[];
  prerequisites: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedDuration: string;
  estimatedHours: number;
  moduleCount: number;
  modules?: LearningModuleData[];
  icon: string;
  color: string;
  isPublished: boolean;
  isFeatured: boolean;
  enrollmentCount: number;
  completionCount: number;
  userEnrollment?: {
    id: string;
    status: LearningEnrollmentStatus;
    progressPercentage: number;
    completedModulesCount: number;
    enrolledAt: string;
    lastAccessedAt: string;
    completedAt?: string;
    streakDays: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface LearningEnrollmentData {
  id: string;
  studentId: string;
  learningPathId: string;
  learningPathTitle?: string;
  careerRole?: string;
  status: LearningEnrollmentStatus;
  progressPercentage: number;
  completedModulesCount: number;
  totalModulesCount: number;
  enrolledAt: string;
  lastAccessedAt: string;
  completedAt?: string;
  streakDays: number;
}

export interface ModuleProgressData {
  id: string;
  studentId: string;
  learningPathId: string;
  moduleId: string;
  status: ModuleCompletionStatus;
  completionMethod: ModuleCompletionMethod;
  completedAt?: string;
  quizScore?: number;
  notes?: string;
}

export interface ResourceBookmarkData {
  id: string;
  studentId: string;
  resourceId: string;
  resource?: LearningResourceData;
  personalNote?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningActivityData {
  id: string;
  studentId: string;
  resourceId?: string;
  learningPathId?: string;
  moduleId?: string;
  activityType: LearningActivityType;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface QuizQuestionOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: QuizQuestionOption[];
  correctOptionId?: string; // Hidden on client until submitted
  explanation?: string;
}

export interface LearningQuizData {
  id: string;
  title: string;
  moduleId?: string;
  skill: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  passingScore: number;
  questionCount: number;
  questions: QuizQuestion[];
  createdAt?: string;
  updatedAt?: string;
}

export interface QuizQuestionEvaluation {
  questionId: string;
  questionText: string;
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
  explanation: string;
}

export interface LearningQuizAttemptData {
  id: string;
  studentId: string;
  quizId: string;
  quizTitle?: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  passed: boolean;
  answers: Record<string, string>;
  evaluations: QuizQuestionEvaluation[];
  attemptedAt: string;
}

export interface ResourceReportData {
  id: string;
  studentId: string;
  studentName?: string;
  resourceId: string;
  resourceTitle?: string;
  reason: ResourceReportReason;
  details: string;
  status: ResourceReportStatus;
  adminNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface RecommendationPillarScore {
  name: string;
  weight: number;
  score: number;
  maxScore: number;
  explanation: string;
}

export interface LearningRecommendationData {
  resource: LearningResourceData;
  matchScore: number; // 0 - 100
  pillars: RecommendationPillarScore[];
  whyRecommended: string[];
  careerGoalMatch: string;
  skillGapAddressed?: string;
}

export interface SkillGapLearningRecommendation {
  skill: string;
  gapStatus: 'MISSING' | 'SELF_DECLARED' | 'NEEDS_IMPROVEMENT';
  source: 'ASSESSMENT' | 'RESUME' | 'TARGET_ROLE';
  recommendedPaths: Array<{
    id: string;
    title: string;
    careerRole: string;
    difficulty: string;
    estimatedDuration: string;
  }>;
  recommendedResources: LearningResourceData[];
}

export interface LearningHubDashboardData {
  stats: {
    enrolledPathsCount: number;
    completedPathsCount: number;
    completedResourcesCount: number;
    inProgressResourcesCount: number;
    bookmarkedResourcesCount: number;
    quizzesPassedCount: number;
    currentStreakDays: number;
  };
  activeEnrollments: Array<{
    enrollment: LearningEnrollmentData;
    learningPath: LearningPathData;
  }>;
  recentActivities: LearningActivityData[];
  continueLearning: Array<{
    learningPathId: string;
    learningPathTitle: string;
    moduleId: string;
    moduleTitle: string;
    progressPercentage: number;
    lastAccessedAt: string;
  }>;
  recommendations: LearningRecommendationData[];
}

export interface CollegeLearningAnalyticsReport {
  collegeId: string;
  collegeName?: string;
  totalStudentsActive: number;
  totalEnrollments: number;
  totalPathCompletions: number;
  topEnrolledPaths: Array<{ pathId: string; title: string; count: number }>;
  topLearnedSkills: Array<{ skill: string; count: number }>;
  resourceEngagementByType: Record<string, number>;
  averageCompletionRate: number;
  generatedAt: string;
}

// ==========================================
// PHASE 18: ADVANCED ANALYTICS & REPORTING SYSTEM
// ==========================================

export type AnalyticsDatePeriod =
  | 'TODAY'
  | '7D'
  | '30D'
  | '90D'
  | 'THIS_MONTH'
  | 'PREVIOUS_MONTH'
  | 'THIS_QUARTER'
  | 'THIS_YEAR'
  | 'ALL'
  | 'CUSTOM';

export interface AnalyticsDateFilter {
  period: AnalyticsDatePeriod;
  from?: string;
  to?: string;
}

export interface MetricDefinition {
  key: string;
  name: string;
  description: string;
  formula: string;
  sourceEntities: string[];
  countingUnit: string;
  limitations: string;
}

export interface StudentCareerAnalytics {
  studentId: string;
  studentName?: string;
  careerOverview: {
    profileCompletionPercentage: number;
    careerGoal: string;
    totalApplications: number;
    applicationsInProgress: number;
    shortlistedCount: number;
    interviewCount: number;
    verifiedSelections: number;
    completedAssessments: number;
    learningPathsEnrolled: number;
    learningPathsCompleted: number;
  };
  applicationAnalytics: {
    total: number;
    pending: number;
    underReview: number;
    shortlisted: number;
    interviewScheduled: number;
    selected: number;
    rejected: number;
    withdrawn: number;
    statusDistribution: Array<{ status: string; count: number; percentage: number }>;
    activityOverTime: Array<{ date: string; count: number }>;
    recentApplications: Array<{
      id: string;
      driveId: string;
      driveTitle: string;
      companyName: string;
      status: string;
      appliedAt: string;
    }>;
  };
  skillAnalytics: {
    assessedSkillsCount: number;
    averageAssessmentScore: number;
    strongSkills: string[];
    skillsNeedingImprovement: string[];
    notAssessedCount: number;
    scoreHistory: Array<{
      assessmentTitle: string;
      category: string;
      score: number;
      percentage: number;
      passed: boolean;
      date: string;
    }>;
    roleGaps: Array<{ skill: string; status: string }>;
  };
  learningAnalytics: {
    enrolledPathsCount: number;
    completedModulesCount: number;
    completedResourcesCount: number;
    overallProgressPercentage: number;
    averageQuizScore: number;
    streakDays: number;
    recentActivities: Array<{
      id: string;
      title: string;
      type: string;
      timestamp: string;
    }>;
  };
  resumeAnalytics: {
    latestScore?: number;
    scoreHistory: Array<{
      versionNumber: number;
      score: number;
      date: string;
    }>;
    topMissingKeywords: string[];
    versionCount: number;
    disclaimer: string;
  };
  interviewAnalytics: {
    mockInterviewsCompleted: number;
    averageFeedbackScore: number;
    practiceSessionsCount: number;
    topicBreakdown: Array<{
      topic: string;
      sessions: number;
      averageScore: number;
    }>;
    areasToPractice: string[];
  };
  mentorshipAnalytics: {
    requestsSent: number;
    requestsAccepted: number;
    activeRelationships: number;
    completedSessions: number;
    upcomingSessions: number;
  };
  readinessIndicators: {
    profileCompletenessScore: number;
    verifiedSkillsScore: number;
    projectPortfolioScore: number;
    resumeScore: number;
    interviewScore: number;
    dataCoverageNotes: string[];
  };
  generatedAt: string;
}

export interface CollegePlacementAnalytics {
  collegeId: string;
  collegeName: string;
  institutionOverview: {
    totalRegisteredStudents: number;
    activeStudents: number;
    profileCompletedStudents: number;
    profileIncompleteStudents: number;
    connectedEmployersCount: number;
    activeOpportunitiesCount: number;
    totalApplications: number;
    activePlacementDrivesCount: number;
    participatingStudentsCount: number;
  };
  studentEngagement: {
    dailyActiveStudents: number;
    weeklyActiveStudents: number;
    monthlyActiveStudents: number;
    registrationTrends: Array<{ date: string; count: number }>;
    profileCompletionRate: number;
    learningHubEngagementRate: number;
    assessmentParticipationRate: number;
    mentorshipParticipationRate: number;
  };
  placementMetrics: {
    totalEligibleStudents: number;
    totalAppliedStudents: number;
    totalShortlistedStudents: number;
    totalInterviewedStudents: number;
    totalSelectedStudents: number;
    totalAwaitingDecision: number;
    jobWiseApplicationVolume: Array<{
      driveId: string;
      driveTitle: string;
      companyName: string;
      count: number;
    }>;
    companyWiseActivity: Array<{
      companyName: string;
      openings: number;
      applications: number;
      selected: number;
    }>;
  };
  placementFunnel: {
    type: 'UNIQUE_STUDENTS';
    stages: Array<{
      stage: string;
      count: number;
      conversionPercentage: number;
      description: string;
    }>;
    overallPlacementRate: number;
  };
  skillGapAnalytics: {
    topMissingSkills: Array<{
      skill: string;
      studentCount: number;
      percentageOfCohort: number;
      recommendedLearningPathId?: string;
      recommendedLearningPathTitle?: string;
    }>;
    lowPerformingAssessmentTopics: Array<{
      category: string;
      averageScore: number;
      attemptsCount: number;
    }>;
    highDemandJobSkills: Array<{
      skill: string;
      jobOpeningsCount: number;
    }>;
  };
  departmentBreakdown: Array<{
    department: string;
    registeredCount: number;
    appliedCount: number;
    selectedCount: number;
    averageProfileScore: number;
  }>;
  learningAnalytics: {
    topLearningPaths: Array<{
      pathId: string;
      title: string;
      enrollments: number;
      completions: number;
    }>;
    totalModuleCompletions: number;
    averageQuizScore: number;
  };
  placementDriveReports: Array<{
    driveId: string;
    title: string;
    companyName: string;
    status: string;
    applicationsCount: number;
    shortlistedCount: number;
    interviewedCount: number;
    selectedCount: number;
    applicationDeadline: string;
  }>;
  dataQualityAudit: {
    missingInstitutionCount: number;
    incompleteProfilesCount: number;
    unassessedStudentsCount: number;
    notes: string[];
  };
  generatedAt: string;
}

export interface EmployerRecruitmentAnalytics {
  employerId: string;
  companyName: string;
  overview: {
    totalJobsPosted: number;
    activeJobsCount: number;
    closedJobsCount: number;
    totalApplicationsReceived: number;
    underReviewCount: number;
    shortlistedCount: number;
    interviewCount: number;
    completedInterviewsCount: number;
    finalSelectionsCount: number;
    jobViewsCount?: number;
  };
  jobPerformance: Array<{
    driveId: string;
    title: string;
    postedDate: string;
    status: string;
    applicationsCount: number;
    eligibleCount: number;
    shortlistedCount: number;
    interviewCount: number;
    selectedCount: number;
  }>;
  recruitmentFunnel: Array<{
    stage: string;
    count: number;
    conversionPercentage: number;
  }>;
  applicationTrends: Array<{
    date: string;
    count: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  generatedAt: string;
}

export interface AdminPlatformAnalytics {
  platformOverview: {
    totalStudents: number;
    totalColleges: number;
    totalEmployers: number;
    totalAdmins: number;
    totalActiveUsers: number;
    totalJobs: number;
    totalApplications: number;
    totalPlacementDrives: number;
    totalLearningResources: number;
    totalLearningPathEnrollments: number;
    totalMentorshipRelationships: number;
  };
  userGrowth: Array<{
    date: string;
    students: number;
    colleges: number;
    employers: number;
    total: number;
  }>;
  platformEngagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    featureEngagement: {
      learningHub: number;
      assessments: number;
      resumeAnalyzer: number;
      mockInterviews: number;
      mentorship: number;
    };
  };
  recruitmentOverview: {
    activeJobsCount: number;
    totalApplications: number;
    totalShortlisted: number;
    totalInterviews: number;
    totalVerifiedSelections: number;
    topHiringEmployers: Array<{
      companyName: string;
      drivesCount: number;
      applicationsReceived: number;
      selectionsCount: number;
    }>;
    topParticipatingColleges: Array<{
      collegeName: string;
      studentsCount: number;
      applicationsCount: number;
      selectionsCount: number;
    }>;
  };
  learningOverview: {
    totalResources: number;
    totalPaths: number;
    totalEnrollments: number;
    pathCompletions: number;
    popularCategories: Array<{
      category: string;
      count: number;
    }>;
  };
  mentorshipOverview: {
    totalMentors: number;
    verifiedMentors: number;
    pendingVerifications: number;
    totalSessionsConducted: number;
    averagePlatformRating: number;
  };
  systemHealthTelemetry: {
    status: 'OPERATIONAL' | 'DEGRADED' | 'DOWN';
    databaseStatus: string;
    averageLatencyMs: number;
    errorRatePercentage: number;
    monitoringConfigured: boolean;
    timestamp: string;
  };
  dataQualityOverview: {
    duplicateApplicationCount: number;
    unlinkedStudentCount: number;
    inconsistentStatusCount: number;
    healthyRecordsPercentage: number;
  };
  generatedAt: string;
}

export type ReportFormat = 'CSV' | 'PDF';
export type ReportScopeType = 'STUDENT' | 'COLLEGE' | 'EMPLOYER' | 'ADMIN';

export interface ReportHistoryData {
  id: string;
  title: string;
  reportType: string;
  format: ReportFormat;
  scopeType: ReportScopeType;
  scopeId: string;
  generatedBy: string;
  generatedAt: string;
  period: string;
  filters: Record<string, any>;
  summary: Record<string, any>;
  fileContent: string;
  fileName: string;
  fileSizeBytes: number;
  status: 'COMPLETED' | 'FAILED';
  expiresAt?: string;
}

export interface ScheduledReportData {
  id: string;
  title: string;
  reportType: string;
  scopeType: ReportScopeType;
  scopeId: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  format: ReportFormat;
  recipients: string[];
  filters: Record<string, any>;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  lastRunStatus?: 'SUCCESS' | 'FAILED' | 'PENDING';
  lastRunError?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}








