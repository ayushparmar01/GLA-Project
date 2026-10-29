export type Role = 'STUDENT' | 'EMPLOYER' | 'COLLEGE';

export interface StudentProfileData {
  educationLevel?: string;
  collegeName?: string;
  course?: string;
  graduationYear?: number;
  skills?: string[];
  careerInterests?: string[];
  preferredWorkLocation?: string[];
  profileCompletionScore?: number;
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
}

export interface SafeUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  preferredLanguage: string;
  phoneNumber?: string;
  isActive: boolean;
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
export type DriveStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED';

export interface PlacementDriveData {
  id: string;
  title: string;
  description: string;
  collegeId: string;
  createdBy: string;
  organizationName: string;
  opportunityType: OpportunityType;
  workMode: WorkMode;
  location?: string;
  eligibleCourses?: string[];
  eligibleGraduationYears?: number[];
  requiredSkills?: string[];
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
  collegeId: string;
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
  reasons: string[];
  missingRequirements: string[];
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
