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

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
}

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface DatabaseStatus {
  status: 'connected' | 'disconnected' | 'connecting';
  state: string;
  host?: string;
  name?: string;
}

export interface IcanSandboxStatus {
  status: 'ready' | 'unconfigured';
  configured: boolean;
  targetEnvironment: string;
  note: string;
}

export interface HealthCheckData {
  service: string;
  version: string;
  status: HealthStatus;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  services: {
    database: DatabaseStatus;
    icanSandbox: IcanSandboxStatus;
  };
}

// ==========================================
// Phase 3: Cohorts, Drives & Applications
// ==========================================

export type CohortStatus = 'ACTIVE' | 'ARCHIVED';

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
