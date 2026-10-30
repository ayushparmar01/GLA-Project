import {
  SystemHealthResponse,
  AuthResponse,
  SafeUser,
  Role,
  CohortData,
  CohortStudentSummary,
  PlacementDriveData,
  PlacementApplicationData,
  EligibilityResult,
  CollegeStatsData,
  ApplicationStatus,
  EmployerCompanyProfileData,
  CompanyPublicProfileData,
  CollegeEmployerConnectionData,
  InterviewData,
  EmployerDashboardStatsData,
  InterviewType,
  VerificationStatus,
  StudentProfileData,
  ProjectItem,
  ResumeData,
  ResumeTemplate,
  ResumeStructuredContent,
  ProfileCompletionReport,
  SkillData,
  SkillCategory,
  AssessmentData,
  AssessmentAttemptData,
  CareerReadinessReport,
  SkillGapReport,
  SmartMatchingReport,
  AiConversationData,
  LearningRoadmapData,
  RoadmapStatus,
  LearningResourceData,
  ResumeFeedbackReport,
  InterviewPracticeQuestion,
  InterviewFeedbackReport,
  NotificationData,
  CareerEventData,
  EventRegistrationData,
  AnnouncementData,
  AdminDashboardMetrics,
  AuditLogEntry,
  ModerationItemData,
  PlatformAnalyticsReport,
  AdminSystemHealthReport,
  WhatsAppStatusData,
  WhatsAppPreferences,
  WhatsAppLinkRequestResult,
  WhatsAppAdminAnalytics,
  WhatsAppWebhookEventData,
  WhatsAppIntegrationStatusReport,
  JobRecommendationData,
  MatchingWeightsConfig,
  RecommendationConfigurationData,
  SkillGapItem,
  StudentSkillGapAnalysisReport,
  CollegePlacementIntelligenceReport,
  EmployerCandidateMatchData,
  MatchCategory,
  EligibilityStatus,
  MockInterviewType,
  MockInterviewDifficulty,
  MockInterviewSessionStatus,
  MockInterviewQuestionData,
  MockInterviewAnswerData,
  MockInterviewSessionData,
  MockInterviewSessionConfig,
  InterviewCoachQuery,
  InterviewCoachResponse,
  StudentInterviewAnalytics,
  PersonalizedInterviewRoadmap,
  CollegeInterviewAnalyticsReport,
  AdminInterviewQuestionData,
  ResumeDocumentData,
  AtsAnalysisResultData,
  ResumeSuggestionData,
  ResumeVersionData,
  CollegeResumeAnalyticsReport,
  ExtractedStructuredResume,
  MentorProfileData,
  StudentMentorshipProfileData,
  MentorRecommendationData,
  MentorshipRequestData,
  MentorshipRelationshipData,
  MentorshipGoalData,
  MentorshipSessionData,
  MentorshipMessageData,
  MentorshipNoteData,
  MentorshipFeedbackData,
  MentorshipGroupData,
  CollegeMentorshipAnalyticsReport,
  AdminMentorshipAnalyticsReport,
  MentorshipAiAgendaResponse,
  MentorshipAiQuestionsResponse,
  MentorshipAiNotesSummaryResponse,
  MentorshipSessionStatus,
  MentorshipRelationshipStatus,
  LearningHubDashboardData,
  LearningPathData,
  LearningModuleData,
  LearningEnrollmentData,
  ModuleProgressData,
  ResourceBookmarkData,
  ResourceReportData,
  LearningQuizData,
  LearningQuizAttemptData,
  LearningRecommendationData,
  SkillGapLearningRecommendation,
  CollegeLearningAnalyticsReport,
  MetricDefinition,
  StudentCareerAnalytics,
  CollegePlacementAnalytics,
  EmployerRecruitmentAnalytics,
  AdminPlatformAnalytics,
  AnalyticsDateFilter,
  ReportHistoryData,
  ScheduledReportData,
  ReportFormat,
  ReportScopeType,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const getHeaders = (token?: string | null): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const DEFAULT_REQUEST_TIMEOUT_MS = 12000;

/**
 * Fetch wrapper with configurable timeout (AbortController)
 * for graceful degradation over low-bandwidth or spotty rural connections.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      signal: init?.signal || controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error?.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s on slow network.`);
    }
    throw error;
  }
}

/**
 * Parses response and extracts standardized rate-limit notification if HTTP 429 is received.
 */
export async function handleApiResponse<T = any>(response: Response): Promise<T> {
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After') || '60';
    const errorJson = await response.json().catch(() => null);
    const msg = errorJson?.error?.message || `Rate limit reached. Please wait ${retryAfter} seconds before trying again.`;
    throw new Error(msg);
  }
  return response.json();
}

export const fetchSystemHealth = async (): Promise<SystemHealthResponse> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    }, 8000);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: SystemHealthResponse = await response.json();
    return data;
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Backend unreachable';
    return {
      success: false,
      error: {
        code: 'NETWORK_OR_SERVER_OFFLINE',
        message: errMessage,
      },
    };
  }
};

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  preferredLanguage?: string;
  phoneNumber?: string;
  institutionName?: string;
}

export const registerApi = async (payload: RegisterPayload): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data: AuthResponse = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to reach authentication server.',
      },
    };
  }
};

export const loginApi = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data: AuthResponse = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to reach authentication server.',
      },
    };
  }
};

export const logoutApi = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
    });

    return await response.json();
  } catch {
    return { success: true };
  }
};

export const getMeApi = async (token?: string | null): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });

    const data: AuthResponse = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unable to verify session.',
      },
    };
  }
};

export const updateProfileApi = async (
  updates: Partial<SafeUser>,
  token?: string | null
): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    const data: AuthResponse = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unable to update profile.',
      },
    };
  }
};

// ==========================================
// PHASE 3 API METHODS: COHORTS
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string[];
    missingRequirements?: string[];
  };
}

export const fetchCohorts = async (token?: string | null, status?: string): Promise<ApiResponse<CohortData[]>> => {
  try {
    const url = status ? `${API_BASE_URL}/cohorts?status=${encodeURIComponent(status)}` : `${API_BASE_URL}/cohorts`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch cohorts.' },
    };
  }
};

export const createCohortApi = async (
  payload: { name: string; description?: string; academicYear?: string; course?: string; graduationYear?: number },
  token?: string | null
): Promise<ApiResponse<CohortData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/cohorts`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to create cohort.' },
    };
  }
};

export const getCohortDetailsApi = async (cohortId: string, token?: string | null): Promise<ApiResponse<CohortData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/cohorts/${cohortId}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to get cohort.' },
    };
  }
};

export const updateCohortApi = async (
  cohortId: string,
  payload: Partial<CohortData>,
  token?: string | null
): Promise<ApiResponse<CohortData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/cohorts/${cohortId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to update cohort.' },
    };
  }
};

export const archiveCohortApi = async (cohortId: string, token?: string | null): Promise<ApiResponse<CohortData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/cohorts/${cohortId}/archive`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to archive cohort.' },
    };
  }
};

export const listCohortStudentsApi = async (
  cohortId: string,
  token?: string | null
): Promise<ApiResponse<{ cohort: CohortData; students: CohortStudentSummary[] }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/cohorts/${cohortId}/students`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to list cohort students.' },
    };
  }
};

export const enrollStudentApi = async (
  cohortId: string,
  email: string,
  token?: string | null
): Promise<ApiResponse<{ cohort: CohortData; enrolledStudent: { id: string; fullName: string; email: string } }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/cohorts/${cohortId}/students`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to enroll student.' },
    };
  }
};

export const removeStudentApi = async (
  cohortId: string,
  studentId: string,
  token?: string | null
): Promise<ApiResponse<CohortData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/cohorts/${cohortId}/students/${studentId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to remove student.' },
    };
  }
};

// ==========================================
// PHASE 3 API METHODS: PLACEMENT DRIVES
// ==========================================

export const fetchDrives = async (token?: string | null, status?: string): Promise<ApiResponse<PlacementDriveData[]>> => {
  try {
    const url = status ? `${API_BASE_URL}/placement-drives?status=${encodeURIComponent(status)}` : `${API_BASE_URL}/placement-drives`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch placement drives.' },
    };
  }
};

export const fetchDriveDetailsApi = async (driveId: string, token?: string | null): Promise<ApiResponse<PlacementDriveData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/placement-drives/${driveId}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch drive details.' },
    };
  }
};

export const createDriveApi = async (
  payload: Partial<PlacementDriveData>,
  token?: string | null
): Promise<ApiResponse<PlacementDriveData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/placement-drives`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to create placement drive.' },
    };
  }
};

export const updateDriveApi = async (
  driveId: string,
  payload: Partial<PlacementDriveData>,
  token?: string | null
): Promise<ApiResponse<PlacementDriveData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/placement-drives/${driveId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to update drive.' },
    };
  }
};

export const publishDriveApi = async (driveId: string, token?: string | null): Promise<ApiResponse<PlacementDriveData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/placement-drives/${driveId}/publish`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to publish drive.' },
    };
  }
};

export const closeDriveApi = async (driveId: string, token?: string | null): Promise<ApiResponse<PlacementDriveData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/placement-drives/${driveId}/close`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to close drive.' },
    };
  }
};

export const cancelDriveApi = async (driveId: string, token?: string | null): Promise<ApiResponse<PlacementDriveData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/placement-drives/${driveId}/cancel`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to cancel drive.' },
    };
  }
};

export const checkEligibilityApi = async (
  driveId: string,
  token?: string | null
): Promise<ApiResponse<{ drive: PlacementDriveData; eligibility: EligibilityResult }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/placement-drives/${driveId}/eligibility`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to check eligibility.' },
    };
  }
};

// ==========================================
// PHASE 3 API METHODS: APPLICATIONS
// ==========================================

export const applyToDriveApi = async (
  driveId: string,
  token?: string | null
): Promise<ApiResponse<PlacementApplicationData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/placement-drives/${driveId}/apply`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to apply to drive.' },
    };
  }
};

export const fetchMyApplicationsApi = async (token?: string | null): Promise<ApiResponse<PlacementApplicationData[]>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/applications/me`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch my applications.' },
    };
  }
};

export const fetchDriveApplicationsApi = async (
  driveId: string,
  token?: string | null
): Promise<ApiResponse<{ drive: PlacementDriveData; applications: PlacementApplicationData[] }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/placement-drives/${driveId}/applications`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch drive applications.' },
    };
  }
};

export const updateApplicationStatusApi = async (
  applicationId: string,
  status: ApplicationStatus,
  note?: string,
  token?: string | null
): Promise<ApiResponse<PlacementApplicationData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/applications/${applicationId}/status`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ status, note }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to update candidate status.' },
    };
  }
};

export const withdrawApplicationApi = async (
  applicationId: string,
  token?: string | null
): Promise<ApiResponse<PlacementApplicationData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/applications/${applicationId}/withdraw`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to withdraw application.' },
    };
  }
};

// ==========================================
// PHASE 3 API METHODS: COLLEGE STATS
// ==========================================

export const fetchCollegeStatsApi = async (token?: string | null): Promise<ApiResponse<CollegeStatsData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/college/stats`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch college stats.' },
    };
  }
};

// ==========================================
// PHASE 4 API METHODS: EMPLOYER PORTAL
// ==========================================

// --- 1. Company Profile ---
export const fetchEmployerProfileApi = async (token?: string | null): Promise<ApiResponse<EmployerCompanyProfileData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/profile/me`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch company profile.' },
    };
  }
};

export const createEmployerProfileApi = async (
  payload: {
    companyName: string;
    companyDescription: string;
    companyWebsite: string;
    industry: string;
    companySize?: string;
    headquarters?: string;
    companyLogo?: string;
    contactPerson: string;
    designation: string;
  },
  token?: string | null
): Promise<ApiResponse<EmployerCompanyProfileData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/profile`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to create company profile.' },
    };
  }
};

export const updateEmployerProfileApi = async (
  payload: Partial<EmployerCompanyProfileData>,
  token?: string | null
): Promise<ApiResponse<EmployerCompanyProfileData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/profile/me`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to update company profile.' },
    };
  }
};

export const fetchPublicEmployerProfileApi = async (employerId: string): Promise<ApiResponse<CompanyPublicProfileData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/${employerId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch public company profile.' },
    };
  }
};

export const verifyEmployerProfileApi = async (
  employerId: string,
  status: 'VERIFIED' | 'REJECTED',
  token?: string | null
): Promise<ApiResponse<EmployerCompanyProfileData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/${employerId}/verify`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to update verification status.' },
    };
  }
};

// --- 2. Real Employer Dashboard Stats ---
export const fetchEmployerDashboardStatsApi = async (token?: string | null): Promise<ApiResponse<EmployerDashboardStatsData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/dashboard`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch employer dashboard.' },
    };
  }
};

// --- 3. Placement Opportunities ---
export const fetchEmployerOpportunitiesApi = async (token?: string | null): Promise<ApiResponse<PlacementDriveData[]>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/opportunities`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch opportunities.' },
    };
  }
};

export const createEmployerOpportunityApi = async (
  payload: Partial<PlacementDriveData>,
  token?: string | null
): Promise<ApiResponse<PlacementDriveData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/opportunities`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to create opportunity.' },
    };
  }
};

export const fetchEmployerOpportunityByIdApi = async (
  driveId: string,
  token?: string | null
): Promise<ApiResponse<PlacementDriveData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/opportunities/${driveId}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch opportunity details.' },
    };
  }
};

export const updateEmployerOpportunityApi = async (
  driveId: string,
  payload: Partial<PlacementDriveData>,
  token?: string | null
): Promise<ApiResponse<PlacementDriveData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/opportunities/${driveId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to update opportunity.' },
    };
  }
};

export const publishEmployerOpportunityApi = async (
  driveId: string,
  token?: string | null
): Promise<ApiResponse<PlacementDriveData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/opportunities/${driveId}/publish`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to publish opportunity.' },
    };
  }
};

export const closeEmployerOpportunityApi = async (
  driveId: string,
  token?: string | null
): Promise<ApiResponse<PlacementDriveData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/opportunities/${driveId}/close`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to close opportunity.' },
    };
  }
};

export const cancelEmployerOpportunityApi = async (
  driveId: string,
  token?: string | null
): Promise<ApiResponse<PlacementDriveData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/opportunities/${driveId}/cancel`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to cancel opportunity.' },
    };
  }
};

export const fetchPublicOpportunitiesApi = async (): Promise<ApiResponse<PlacementDriveData[]>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/opportunities`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch public opportunities.' },
    };
  }
};

// --- 4. College Connections ---
export const fetchEmployerConnectionsApi = async (token?: string | null): Promise<ApiResponse<CollegeEmployerConnectionData[]>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/connections`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch employer connections.' },
    };
  }
};

export const sendCollegeConnectionApi = async (
  payload: { collegeId: string; message?: string },
  token?: string | null
): Promise<ApiResponse<CollegeEmployerConnectionData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/connections`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to send connection request.' },
    };
  }
};

export const fetchCollegeIncomingConnectionsApi = async (
  collegeId: string,
  token?: string | null
): Promise<ApiResponse<CollegeEmployerConnectionData[]>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/colleges/${collegeId}/connections`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch college connections.' },
    };
  }
};

export const respondToConnectionApi = async (
  connectionId: string,
  status: 'ACCEPTED' | 'REJECTED',
  token?: string | null
): Promise<ApiResponse<CollegeEmployerConnectionData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/connections/${connectionId}/respond`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to respond to connection.' },
    };
  }
};

export const blockConnectionApi = async (
  connectionId: string,
  token?: string | null
): Promise<ApiResponse<CollegeEmployerConnectionData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/connections/${connectionId}/block`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to block connection.' },
    };
  }
};

// --- 5. Candidate Applications Review ---
export const fetchEmployerApplicationsApi = async (token?: string | null): Promise<ApiResponse<PlacementApplicationData[]>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/applications`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch employer applications.' },
    };
  }
};

export const fetchOpportunityApplicationsApi = async (
  driveId: string,
  token?: string | null
): Promise<ApiResponse<PlacementApplicationData[]>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/opportunities/${driveId}/applications`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch opportunity candidates.' },
    };
  }
};

export const updateEmployerCandidateStatusApi = async (
  applicationId: string,
  payload: { status: ApplicationStatus; note?: string },
  token?: string | null
): Promise<ApiResponse<PlacementApplicationData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/applications/${applicationId}/status`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to update candidate status.' },
    };
  }
};

// --- 6. Interview Scheduling ---
export const fetchEmployerInterviewsApi = async (token?: string | null): Promise<ApiResponse<InterviewData[]>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/interviews`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch scheduled interviews.' },
    };
  }
};

export const scheduleInterviewApi = async (
  applicationId: string,
  payload: {
    interviewRound: string;
    interviewType: InterviewType;
    scheduledAt: string;
    durationMinutes?: number;
    meetingLink?: string;
    location?: string;
    instructions?: string;
  },
  token?: string | null
): Promise<ApiResponse<InterviewData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/applications/${applicationId}/interviews`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to schedule interview.' },
    };
  }
};

export const updateInterviewApi = async (
  interviewId: string,
  payload: Partial<InterviewData>,
  token?: string | null
): Promise<ApiResponse<InterviewData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/interviews/${interviewId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to update interview.' },
    };
  }
};

export const cancelInterviewApi = async (
  interviewId: string,
  token?: string | null
): Promise<ApiResponse<InterviewData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/interviews/${interviewId}/cancel`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to cancel interview.' },
    };
  }
};

export const fetchStudentInterviewsApi = async (token?: string | null): Promise<ApiResponse<InterviewData[]>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/me/interviews`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch student interviews.' },
    };
  }
};

// ==========================================
// PHASE 5: CAREER PROFILE, RESUME & PORTFOLIO
// ==========================================

export const fetchCareerProfileApi = async (
  token?: string | null
): Promise<ApiResponse<{ profile: StudentProfileData; user: SafeUser }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/me/career-profile`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to load career profile.' },
    };
  }
};

export const updateCareerProfileApi = async (
  payload: Partial<StudentProfileData>,
  token?: string | null
): Promise<ApiResponse<{ user: SafeUser; profileCompletion: ProfileCompletionReport }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/me/career-profile`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to update career profile.' },
    };
  }
};

export const fetchProfileCompletionApi = async (
  token?: string | null
): Promise<ApiResponse<ProfileCompletionReport>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/me/profile-completion`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to check profile completion.' },
    };
  }
};

export const addProjectApi = async (
  payload: Partial<ProjectItem>,
  token?: string | null
): Promise<ApiResponse<ProjectItem>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/me/projects`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to add project.' },
    };
  }
};

export const updateProjectApi = async (
  projectId: string,
  payload: Partial<ProjectItem>,
  token?: string | null
): Promise<ApiResponse<ProjectItem>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/me/projects/${projectId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to update project.' },
    };
  }
};

export const deleteProjectApi = async (
  projectId: string,
  token?: string | null
): Promise<ApiResponse<{ message: string; projectId: string }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/me/projects/${projectId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to delete project.' },
    };
  }
};

export const createResumeApi = async (
  payload: {
    title: string;
    template: ResumeTemplate;
    structuredContent: ResumeStructuredContent;
    isDefault?: boolean;
  },
  token?: string | null
): Promise<ApiResponse<ResumeData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/me/resumes`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to create resume.' },
    };
  }
};

export const fetchResumesApi = async (
  token?: string | null
): Promise<ApiResponse<ResumeData[]>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/me/resumes`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to list resumes.' },
    };
  }
};

export const fetchResumeByIdApi = async (
  resumeId: string,
  token?: string | null
): Promise<ApiResponse<ResumeData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/me/resumes/${resumeId}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to load resume.' },
    };
  }
};

export const updateResumeApi = async (
  resumeId: string,
  payload: Partial<ResumeData>,
  token?: string | null
): Promise<ApiResponse<ResumeData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/me/resumes/${resumeId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to update resume.' },
    };
  }
};

export const deleteResumeApi = async (
  resumeId: string,
  token?: string | null
): Promise<ApiResponse<{ message: string; resumeId: string }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/me/resumes/${resumeId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to delete resume.' },
    };
  }
};

export const downloadResumePdfApi = async (
  resumeId: string,
  filename: string = 'Resume.pdf',
  token?: string | null
): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/me/resumes/${resumeId}/download`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });

    if (!res.ok) throw new Error('Failed to download resume PDF');

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error downloading resume PDF:', error);
    return false;
  }
};

export const downloadCandidateResumeApi = async (
  applicationId: string,
  candidateName: string = 'Candidate',
  token?: string | null
): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/applications/${applicationId}/resume`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });

    if (!res.ok) throw new Error('Failed to download candidate resume');

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${candidateName.replace(/\s+/g, '_')}_Resume.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error downloading candidate resume:', error);
    return false;
  }
};

// ==========================================
// PHASE 6: SKILL TAXONOMY, ASSESSMENTS & READINESS APIS
// ==========================================

export const fetchSkillCategoriesApi = async (): Promise<ApiResponse<SkillCategory[]>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/skills/categories`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch skill categories',
      },
    };
  }
};

export const fetchSkillsApi = async (
  category?: string,
  search?: string
): Promise<ApiResponse<SkillData[]>> => {
  try {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/skills${qs}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch skills taxonomy',
      },
    };
  }
};

export const fetchAssessmentsApi = async (
  category?: string,
  difficulty?: string,
  search?: string
): Promise<ApiResponse<AssessmentData[]>> => {
  try {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (difficulty) params.append('difficulty', difficulty);
    if (search) params.append('search', search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/assessments${qs}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch assessments',
      },
    };
  }
};

export const fetchAssessmentByIdApi = async (
  assessmentId: string
): Promise<ApiResponse<AssessmentData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/assessments/${assessmentId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch assessment details',
      },
    };
  }
};

export const startAssessmentAttemptApi = async (
  assessmentId: string,
  token?: string | null
): Promise<ApiResponse<AssessmentAttemptData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/assessments/${assessmentId}/attempts`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to start assessment attempt',
      },
    };
  }
};

export const saveAssessmentAnswersApi = async (
  assessmentId: string,
  attemptId: string,
  answers: Record<string, string[]>,
  token?: string | null
): Promise<ApiResponse<AssessmentAttemptData>> => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/assessments/${assessmentId}/attempts/${attemptId}/answers`,
      {
        method: 'PATCH',
        headers: getHeaders(token),
        credentials: 'include',
        body: JSON.stringify({ answers }),
      }
    );
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to save answers',
      },
    };
  }
};

export const submitAssessmentAttemptApi = async (
  assessmentId: string,
  attemptId: string,
  answers: Record<string, string[]>,
  token?: string | null
): Promise<ApiResponse<AssessmentAttemptData>> => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/assessments/${assessmentId}/attempts/${attemptId}/submit`,
      {
        method: 'POST',
        headers: getHeaders(token),
        credentials: 'include',
        body: JSON.stringify({ answers }),
      }
    );
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to submit assessment',
      },
    };
  }
};

export const fetchMyAssessmentHistoryApi = async (
  token?: string | null
): Promise<ApiResponse<AssessmentAttemptData[]>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/assessments/my-history`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch assessment history',
      },
    };
  }
};

export const fetchCareerReadinessReportApi = async (
  token?: string | null
): Promise<ApiResponse<CareerReadinessReport>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/me/career-readiness`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch career readiness report',
      },
    };
  }
};

export const fetchSkillGapReportApi = async (
  token?: string | null,
  driveId?: string
): Promise<ApiResponse<SkillGapReport>> => {
  try {
    const qs = driveId ? `?driveId=${encodeURIComponent(driveId)}` : '';
    const res = await fetch(`${API_BASE_URL}/students/me/skill-gaps${qs}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch skill gap analysis',
      },
    };
  }
};

export const fetchRecommendedOpportunitiesApi = async (
  token?: string | null
): Promise<ApiResponse<SmartMatchingReport>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/me/recommended-opportunities`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch recommended opportunities',
      },
    };
  }
};

// ==========================================
// PHASE 7: AI CAREER GUIDE, ROADMAPS & ASSISTANT
// ==========================================

export const sendCareerGuidanceApi = async (
  message: string,
  conversationId?: string,
  contextSnapshot?: Record<string, unknown>,
  token?: string | null
): Promise<ApiResponse<AiConversationData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/career-guidance`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ message, conversationId, contextSnapshot }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to send career guidance query',
      },
    };
  }
};

export const fetchAiConversationsApi = async (
  token?: string | null
): Promise<ApiResponse<AiConversationData[]>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/conversations`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch conversations',
      },
    };
  }
};

export const fetchAiConversationByIdApi = async (
  conversationId: string,
  token?: string | null
): Promise<ApiResponse<AiConversationData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/conversations/${conversationId}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch conversation',
      },
    };
  }
};

export const createLearningRoadmapApi = async (
  targetRole: string,
  token?: string | null
): Promise<ApiResponse<LearningRoadmapData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/me/roadmaps`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ targetRole }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create learning roadmap',
      },
    };
  }
};

export const fetchLearningRoadmapsApi = async (
  token?: string | null
): Promise<ApiResponse<LearningRoadmapData[]>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/me/roadmaps`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch learning roadmaps',
      },
    };
  }
};

export const fetchLearningRoadmapByIdApi = async (
  roadmapId: string,
  token?: string | null
): Promise<ApiResponse<LearningRoadmapData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/me/roadmaps/${roadmapId}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch learning roadmap',
      },
    };
  }
};

export const updateLearningRoadmapMilestoneApi = async (
  roadmapId: string,
  milestoneId: string,
  completed: boolean,
  token?: string | null
): Promise<ApiResponse<LearningRoadmapData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/me/roadmaps/${roadmapId}/milestones`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ milestoneId, completed }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update milestone',
      },
    };
  }
};

export const updateLearningRoadmapStatusApi = async (
  roadmapId: string,
  status: RoadmapStatus,
  token?: string | null
): Promise<ApiResponse<LearningRoadmapData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/me/roadmaps/${roadmapId}/status`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update roadmap status',
      },
    };
  }
};

export const deleteLearningRoadmapApi = async (
  roadmapId: string,
  token?: string | null
): Promise<ApiResponse<void>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/students/me/roadmaps/${roadmapId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete roadmap',
      },
    };
  }
};

export const getAiResumeFeedbackApi = async (
  payload: {
    resumeId?: string;
    targetRole?: string;
    structuredContent?: any;
  },
  token?: string | null
): Promise<ApiResponse<ResumeFeedbackReport>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/resume-feedback`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate resume feedback',
      },
    };
  }
};

export const fetchInterviewQuestionsApi = async (
  role?: string,
  category?: string,
  token?: string | null
): Promise<ApiResponse<InterviewPracticeQuestion[]>> => {
  try {
    const sp = new URLSearchParams();
    if (role) sp.append('role', role);
    if (category) sp.append('category', category);

    const qs = sp.toString() ? `?${sp.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/ai/interview-questions${qs}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch interview questions',
      },
    };
  }
};

export const evaluateInterviewAnswerApi = async (
  questionId: string,
  studentAnswer: string,
  token?: string | null
): Promise<ApiResponse<InterviewFeedbackReport>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/interview-preparation`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ questionId, studentAnswer }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to evaluate interview answer',
      },
    };
  }
};

// ==========================================
// PHASE 8: NOTIFICATIONS, EVENTS & COMMUNICATION
// ==========================================

export const fetchNotificationsApi = async (
  token?: string | null,
  params?: { isRead?: boolean; limit?: number; skip?: number }
): Promise<ApiResponse<NotificationData[]>> => {
  try {
    const sp = new URLSearchParams();
    if (params?.isRead !== undefined) sp.append('isRead', String(params.isRead));
    if (params?.limit) sp.append('limit', String(params.limit));
    if (params?.skip) sp.append('skip', String(params.skip));

    const qs = sp.toString() ? `?${sp.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/notifications${qs}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch notifications',
      },
    };
  }
};

export const fetchUnreadNotificationCountApi = async (
  token?: string | null
): Promise<ApiResponse<{ unreadCount: number }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch unread count',
      },
    };
  }
};

export const markNotificationAsReadApi = async (
  notificationId: string,
  token?: string | null
): Promise<ApiResponse<NotificationData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to mark notification as read',
      },
    };
  }
};

export const markAllNotificationsAsReadApi = async (
  token?: string | null
): Promise<ApiResponse<{ modifiedCount: number }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to mark all notifications as read',
      },
    };
  }
};

export const deleteNotificationApi = async (
  notificationId: string,
  token?: string | null
): Promise<ApiResponse<void>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete notification',
      },
    };
  }
};

export const fetchCareerEventsApi = async (
  params?: {
    eventType?: string;
    status?: string;
    collegeId?: string;
    search?: string;
    upcomingOnly?: boolean;
  },
  token?: string | null
): Promise<ApiResponse<CareerEventData[]>> => {
  try {
    const sp = new URLSearchParams();
    if (params?.eventType) sp.append('eventType', params.eventType);
    if (params?.status) sp.append('status', params.status);
    if (params?.collegeId) sp.append('collegeId', params.collegeId);
    if (params?.search) sp.append('search', params.search);
    if (params?.upcomingOnly !== undefined) sp.append('upcomingOnly', String(params.upcomingOnly));

    const qs = sp.toString() ? `?${sp.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/events${qs}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch career events',
      },
    };
  }
};

export const fetchCareerEventByIdApi = async (
  eventId: string,
  token?: string | null
): Promise<ApiResponse<CareerEventData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch career event',
      },
    };
  }
};

export const createCareerEventApi = async (
  payload: Partial<CareerEventData>,
  token?: string | null
): Promise<ApiResponse<CareerEventData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create career event',
      },
    };
  }
};

export const updateCareerEventApi = async (
  eventId: string,
  payload: Partial<CareerEventData>,
  token?: string | null
): Promise<ApiResponse<CareerEventData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update career event',
      },
    };
  }
};

export const registerForCareerEventApi = async (
  eventId: string,
  token?: string | null
): Promise<ApiResponse<EventRegistrationData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${eventId}/register`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to register for event',
      },
    };
  }
};

export const cancelCareerEventRegistrationApi = async (
  eventId: string,
  token?: string | null
): Promise<ApiResponse<void>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${eventId}/register`, {
      method: 'DELETE',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to cancel registration',
      },
    };
  }
};

export const fetchEventRegistrationsApi = async (
  eventId: string,
  token?: string | null
): Promise<ApiResponse<EventRegistrationData[]>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${eventId}/registrations`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch event registrations',
      },
    };
  }
};

export const fetchAnnouncementsApi = async (
  token?: string | null
): Promise<ApiResponse<AnnouncementData[]>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/announcements`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch announcements',
      },
    };
  }
};

export const createAnnouncementApi = async (
  payload: {
    title: string;
    content: string;
    targetAudience?: string;
    cohortId?: string;
    priority?: string;
    expiresAt?: string;
  },
  token?: string | null
): Promise<ApiResponse<AnnouncementData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/announcements`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create announcement',
      },
    };
  }
};

// ==========================================
// PHASE 9: ADMIN CONTROL CENTRE & GOVERNANCE
// ==========================================

export const fetchAdminDashboardMetricsApi = async (
  token?: string | null
): Promise<ApiResponse<AdminDashboardMetrics>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/dashboard`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch admin dashboard metrics',
      },
    };
  }
};

export const fetchAdminUsersApi = async (
  params?: { role?: string; status?: string; search?: string; page?: number; limit?: number },
  token?: string | null
): Promise<ApiResponse<{ users: SafeUser[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>> => {
  try {
    const query = new URLSearchParams();
    if (params?.role) query.append('role', params.role);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const res = await fetch(`${API_BASE_URL}/admin/users?${query.toString()}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch platform users',
      },
    };
  }
};

export const suspendUserApi = async (
  userId: string,
  reason: string,
  token?: string | null
): Promise<ApiResponse<{ user: SafeUser; message: string }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/suspend`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to suspend user account',
      },
    };
  }
};

export const reactivateUserApi = async (
  userId: string,
  token?: string | null
): Promise<ApiResponse<{ user: SafeUser; message: string }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/reactivate`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({}),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to reactivate user account',
      },
    };
  }
};

export const fetchPendingEmployersApi = async (
  token?: string | null
): Promise<ApiResponse<{ employers: EmployerCompanyProfileData[] }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/employers/pending`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch pending employers',
      },
    };
  }
};

export const verifyEmployerApi = async (
  employerId: string,
  notes?: string,
  token?: string | null
): Promise<ApiResponse<{ profile: EmployerCompanyProfileData; message: string }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/employers/${employerId}/verify`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ notes }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to verify employer',
      },
    };
  }
};

export const rejectEmployerApi = async (
  employerId: string,
  reason: string,
  token?: string | null
): Promise<ApiResponse<{ profile: EmployerCompanyProfileData; message: string }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/employers/${employerId}/reject`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to reject employer verification',
      },
    };
  }
};

export const fetchAdminCollegesApi = async (
  token?: string | null
): Promise<ApiResponse<{ colleges: Array<SafeUser & { stats?: { cohortCount: number; driveCount: number } }> }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/colleges`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch registered colleges',
      },
    };
  }
};

export const verifyCollegeApi = async (
  collegeId: string,
  token?: string | null
): Promise<ApiResponse<{ college: SafeUser; message: string }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/colleges/${collegeId}/verify`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({}),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to verify college institution',
      },
    };
  }
};

export const fetchModerationItemsApi = async (
  params?: { status?: string; targetType?: string },
  token?: string | null
): Promise<ApiResponse<{ items: ModerationItemData[] }>> => {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.targetType) query.append('targetType', params.targetType);

    const res = await fetch(`${API_BASE_URL}/admin/moderation?${query.toString()}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch moderation queue',
      },
    };
  }
};

export const createModerationItemApi = async (
  payload: { targetType: string; targetId: string; targetTitle?: string; reason: string },
  token?: string | null
): Promise<ApiResponse<{ item: ModerationItemData }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/moderation`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to submit report for moderation',
      },
    };
  }
};

export const reviewModerationItemApi = async (
  id: string,
  payload: { status: string; notes?: string },
  token?: string | null
): Promise<ApiResponse<{ item: ModerationItemData; message: string }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/moderation/${id}/review`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to review moderation item',
      },
    };
  }
};

export const fetchPlatformAnalyticsApi = async (
  token?: string | null
): Promise<ApiResponse<PlatformAnalyticsReport>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/analytics`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch platform analytics',
      },
    };
  }
};

export const fetchPlacementReportsApi = async (
  token?: string | null
): Promise<ApiResponse<{
  applicationFunnel: PlatformAnalyticsReport['applicationFunnel'];
  transparentPlacementOutcomes: PlatformAnalyticsReport['transparentPlacementOutcomes'];
  opportunityCategories: PlatformAnalyticsReport['opportunityCategories'];
  topSkillsInDemand: PlatformAnalyticsReport['topSkillsInDemand'];
}>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/placement-reports`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch placement reports',
      },
    };
  }
};

export const fetchAuditLogsApi = async (
  params?: { action?: string; resourceType?: string; page?: number; limit?: number },
  token?: string | null
): Promise<ApiResponse<{ logs: AuditLogEntry[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>> => {
  try {
    const query = new URLSearchParams();
    if (params?.action) query.append('action', params.action);
    if (params?.resourceType) query.append('resourceType', params.resourceType);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const res = await fetch(`${API_BASE_URL}/admin/audit-logs?${query.toString()}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch system audit logs',
      },
    };
  }
};

export const fetchAdminSystemHealthApi = async (
  token?: string | null
): Promise<ApiResponse<AdminSystemHealthReport>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/system-health`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to run admin system health diagnostics',
      },
    };
  }
};

// ==========================================
// PHASE 10: WHATSAPP CAREER ASSISTANT
// ==========================================

export const fetchWhatsAppStatusApi = async (
  token?: string | null
): Promise<ApiResponse<WhatsAppStatusData>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/whatsapp/status`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch WhatsApp status',
      },
    };
  }
};

export const requestWhatsAppLinkCodeApi = async (
  token?: string | null
): Promise<ApiResponse<WhatsAppLinkRequestResult>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/whatsapp/link/request`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({}),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to request WhatsApp linking code',
      },
    };
  }
};

export const verifyWhatsAppLinkCodeApi = async (
  payload: { code: string; phoneNumber: string },
  token?: string | null
): Promise<ApiResponse<{ message: string; accountId?: string }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/whatsapp/link/verify`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to verify WhatsApp linking code',
      },
    };
  }
};

export const unlinkWhatsAppAccountApi = async (
  token?: string | null
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/whatsapp/link`, {
      method: 'DELETE',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to unlink WhatsApp account',
      },
    };
  }
};

export const updateWhatsAppPreferencesApi = async (
  payload: WhatsAppPreferences,
  token?: string | null
): Promise<ApiResponse<{ preferences: WhatsAppPreferences; message: string }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/whatsapp/preferences`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update WhatsApp notification preferences',
      },
    };
  }
};

export const fetchWhatsAppAdminStatusApi = async (
  token?: string | null
): Promise<ApiResponse<WhatsAppIntegrationStatusReport>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/whatsapp/admin/status`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch WhatsApp admin status',
      },
    };
  }
};

export const fetchWhatsAppAdminAnalyticsApi = async (
  token?: string | null
): Promise<ApiResponse<WhatsAppAdminAnalytics>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/whatsapp/admin/analytics`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch WhatsApp admin analytics',
      },
    };
  }
};

export const fetchWhatsAppAdminEventsApi = async (
  params?: { page?: number; limit?: number },
  token?: string | null
): Promise<ApiResponse<{ events: WhatsAppWebhookEventData[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>> => {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const res = await fetch(`${API_BASE_URL}/whatsapp/admin/events?${query.toString()}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch WhatsApp webhook events',
      },
    };
  }
};

export const sendWhatsAppTestMessageApi = async (
  payload: { phoneNumber: string; message: string },
  token?: string | null
): Promise<ApiResponse<{ messageId?: string; isMockDelivery: boolean; message: string }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/whatsapp/admin/test-message`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to send WhatsApp test message',
      },
    };
  }
};

export const updateLanguagePreferenceApi = async (
  preferredLanguage: string,
  token?: string | null
): Promise<ApiResponse<{ preferredLanguage: string; message: string }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/users/preferences/language`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ preferredLanguage }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update language preference',
      },
    };
  }
};

// ==========================================
// PHASE 13: ADVANCED AI JOB MATCHING & RECOMMENDATIONS
// ==========================================

export interface FetchRecommendationsParams {
  role?: string;
  skills?: string[];
  location?: string;
  workMode?: string;
  eligibilityStatus?: string;
  matchCategory?: string;
  minMatchScore?: number;
  sortBy?: 'matchScore' | 'deadline' | 'latest';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  forceRefresh?: boolean;
}

export const fetchRecommendedJobsApi = async (
  params: FetchRecommendationsParams = {},
  token?: string | null
): Promise<
  ApiResponse<{
    recommendations: JobRecommendationData[];
    total: number;
    readinessScore: number;
    count: number;
  }>
> => {
  try {
    const query = new URLSearchParams();
    if (params.role) query.set('role', params.role);
    if (params.skills && params.skills.length > 0) query.set('skills', params.skills.join(','));
    if (params.location) query.set('location', params.location);
    if (params.workMode) query.set('workMode', params.workMode);
    if (params.eligibilityStatus) query.set('eligibilityStatus', params.eligibilityStatus);
    if (params.matchCategory) query.set('matchCategory', params.matchCategory);
    if (params.minMatchScore !== undefined) query.set('minMatchScore', String(params.minMatchScore));
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    if (params.forceRefresh) query.set('forceRefresh', 'true');

    const res = await fetchWithTimeout(`${API_BASE_URL}/recommendations?${query.toString()}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch recommendations',
      },
    };
  }
};

export const fetchRecommendationSummaryApi = async (
  token?: string | null
): Promise<
  ApiResponse<{
    totalOpportunitiesEvaluated: number;
    readinessScore: number;
    eligibleOpportunitiesCount: number;
    excellentMatchesCount: number;
    strongMatchesCount: number;
    moderateMatchesCount: number;
    lowMatchesCount: number;
  }>
> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/recommendations/summary`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch recommendation summary',
      },
    };
  }
};

export const fetchStudentSkillGapsApi = async (
  driveId?: string,
  token?: string | null
): Promise<ApiResponse<StudentSkillGapAnalysisReport>> => {
  try {
    const url = driveId
      ? `${API_BASE_URL}/recommendations/skill-gaps?driveId=${encodeURIComponent(driveId)}`
      : `${API_BASE_URL}/recommendations/skill-gaps`;

    const res = await fetchWithTimeout(url, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch skill gap analysis',
      },
    };
  }
};

export const fetchJobRecommendationDetailApi = async (
  jobId: string,
  token?: string | null
): Promise<ApiResponse<JobRecommendationData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/recommendations/${jobId}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch recommendation detail',
      },
    };
  }
};

export const refreshRecommendationsApi = async (
  token?: string | null
): Promise<
  ApiResponse<{
    message: string;
    total: number;
    readinessScore: number;
  }>
> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/recommendations/refresh`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to refresh recommendations',
      },
    };
  }
};

export const fetchEmployerJobCandidatesApi = async (
  jobId: string,
  filters: {
    minMatchScore?: number;
    matchCategory?: string;
    eligibilityStatus?: string;
    hasVerifiedAssessments?: boolean;
  } = {},
  token?: string | null
): Promise<
  ApiResponse<{
    candidates: EmployerCandidateMatchData[];
    count: number;
  }>
> => {
  try {
    const query = new URLSearchParams();
    if (filters.minMatchScore !== undefined) query.set('minMatchScore', String(filters.minMatchScore));
    if (filters.matchCategory) query.set('matchCategory', filters.matchCategory);
    if (filters.eligibilityStatus) query.set('eligibilityStatus', filters.eligibilityStatus);
    if (filters.hasVerifiedAssessments !== undefined) {
      query.set('hasVerifiedAssessments', String(filters.hasVerifiedAssessments));
    }

    const res = await fetchWithTimeout(
      `${API_BASE_URL}/recommendations/employer/jobs/${jobId}/candidates?${query.toString()}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        credentials: 'include',
      }
    );
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch candidate matches',
      },
    };
  }
};

export const fetchCollegePlacementIntelligenceApi = async (
  token?: string | null
): Promise<ApiResponse<CollegePlacementIntelligenceReport>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/recommendations/college/placement-intelligence`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch placement intelligence',
      },
    };
  }
};

export const fetchMatchingConfigApi = async (
  token?: string | null
): Promise<ApiResponse<RecommendationConfigurationData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/recommendations/admin/config`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch matching configuration',
      },
    };
  }
};

export const updateMatchingConfigApi = async (
  scoringWeights: Partial<MatchingWeightsConfig>,
  token?: string | null
): Promise<ApiResponse<RecommendationConfigurationData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/recommendations/admin/config`, {
      method: 'PUT',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ scoringWeights }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update matching configuration',
      },
    };
  }
};

export const fetchMatchingAnalyticsApi = async (
  token?: string | null
): Promise<
  ApiResponse<{
    totalRecommendationsGenerated: number;
    averageMatchScore: number;
    distribution: {
      excellent: number;
      strong: number;
      moderate: number;
      low: number;
    };
    calculatedAt: string;
  }>
> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/recommendations/admin/analytics`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch matching analytics',
      },
    };
  }
};

// ==========================================
// PHASE 14: AI MOCK INTERVIEWS & EVALUATION
// ==========================================

export const createMockInterviewSessionApi = async (
  config: MockInterviewSessionConfig,
  token?: string | null
): Promise<ApiResponse<MockInterviewSessionData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/interviews/sessions`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(config),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create interview session',
      },
    };
  }
};

export const fetchStudentInterviewSessionsApi = async (
  filters: {
    interviewType?: string;
    status?: string;
    difficulty?: string;
    limit?: number;
    offset?: number;
  } = {},
  token?: string | null
): Promise<ApiResponse<MockInterviewSessionData[]> & { total?: number }> => {
  try {
    const query = new URLSearchParams();
    if (filters.interviewType) query.set('interviewType', filters.interviewType);
    if (filters.status) query.set('status', filters.status);
    if (filters.difficulty) query.set('difficulty', filters.difficulty);
    if (filters.limit) query.set('limit', String(filters.limit));
    if (filters.offset) query.set('offset', String(filters.offset));

    const res = await fetchWithTimeout(`${API_BASE_URL}/interviews/sessions?${query.toString()}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch interview sessions',
      },
    };
  }
};

export const fetchInterviewSessionByIdApi = async (
  sessionId: string,
  token?: string | null
): Promise<ApiResponse<MockInterviewSessionData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/interviews/sessions/${sessionId}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch interview session',
      },
    };
  }
};

export const startMockInterviewSessionApi = async (
  sessionId: string,
  token?: string | null
): Promise<ApiResponse<MockInterviewSessionData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/interviews/sessions/${sessionId}/start`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to start interview session',
      },
    };
  }
};

export const saveMockInterviewAnswerApi = async (
  sessionId: string,
  answerData: {
    questionId: string;
    answerText: string;
    answerType?: 'TEXT' | 'CODE';
    codeLanguage?: string;
    timeSpentSeconds?: number;
  },
  token?: string | null
): Promise<ApiResponse<MockInterviewSessionData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/interviews/sessions/${sessionId}/answers`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(answerData),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to save answer',
      },
    };
  }
};

export const submitMockInterviewSessionApi = async (
  sessionId: string,
  token?: string | null
): Promise<ApiResponse<MockInterviewSessionData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/interviews/sessions/${sessionId}/submit`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to submit interview session',
      },
    };
  }
};

export const consultInterviewCoachApi = async (
  query: InterviewCoachQuery,
  token?: string | null
): Promise<ApiResponse<InterviewCoachResponse>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/interviews/coach`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(query),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to consult interview coach',
      },
    };
  }
};

export const fetchStudentInterviewAnalyticsApi = async (
  token?: string | null
): Promise<ApiResponse<StudentInterviewAnalytics>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/interviews/analytics`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch interview analytics',
      },
    };
  }
};

export const fetchPersonalizedInterviewRoadmapApi = async (
  token?: string | null
): Promise<ApiResponse<PersonalizedInterviewRoadmap>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/interviews/roadmap`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch interview roadmap',
      },
    };
  }
};

export const fetchQuestionBankApi = async (
  filters: {
    category?: string;
    role?: string;
    difficulty?: string;
    topic?: string;
  } = {},
  token?: string | null
): Promise<ApiResponse<MockInterviewQuestionData[]>> => {
  try {
    const query = new URLSearchParams();
    if (filters.category) query.set('category', filters.category);
    if (filters.role) query.set('role', filters.role);
    if (filters.difficulty) query.set('difficulty', filters.difficulty);
    if (filters.topic) query.set('topic', filters.topic);

    const res = await fetchWithTimeout(`${API_BASE_URL}/interviews/questions?${query.toString()}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch question bank',
      },
    };
  }
};

export const fetchCollegeInterviewAnalyticsApi = async (
  token?: string | null
): Promise<ApiResponse<CollegeInterviewAnalyticsReport>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/interviews/college/analytics`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch college interview analytics',
      },
    };
  }
};

export const createAdminQuestionApi = async (
  payload: Partial<AdminInterviewQuestionData>,
  token?: string | null
): Promise<ApiResponse<AdminInterviewQuestionData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/interviews/admin/questions`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create question',
      },
    };
  }
};

export const updateAdminQuestionApi = async (
  questionId: string,
  payload: Partial<AdminInterviewQuestionData>,
  token?: string | null
): Promise<ApiResponse<AdminInterviewQuestionData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/interviews/admin/questions/${questionId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update question',
      },
    };
  }
};

export const deleteAdminQuestionApi = async (
  questionId: string,
  token?: string | null
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/interviews/admin/questions/${questionId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to archive question',
      },
    };
  }
};

export const fetchAdminInterviewAnalyticsApi = async (
  token?: string | null
): Promise<
  ApiResponse<{
    totalSessionsInitiated: number;
    totalSessionsCompleted: number;
    activeQuestionsInBank: number;
    averageEvaluationScore: number;
    calculatedAt: string;
  }>
> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/interviews/admin/analytics`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch admin interview analytics',
      },
    };
  }
};

// ==========================================
// PHASE 15: ADVANCED AI ATS RESUME ANALYZER APIs
// ==========================================

export const uploadResumeDocumentApi = async (
  fileName: string,
  fileBase64: string,
  token?: string | null
): Promise<ApiResponse<ResumeDocumentData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/resume-analyzer/upload`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ fileName, fileBase64 }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to upload and parse resume',
      },
    };
  }
};

export const fetchResumeDocumentsApi = async (
  token?: string | null
): Promise<ApiResponse<ResumeDocumentData[]>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/resume-analyzer/documents`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch resume documents',
      },
    };
  }
};

export const fetchResumeDocumentByIdApi = async (
  documentId: string,
  token?: string | null
): Promise<ApiResponse<ResumeDocumentData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/resume-analyzer/documents/${documentId}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch resume document details',
      },
    };
  }
};

export const deleteResumeDocumentApi = async (
  documentId: string,
  token?: string | null
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/resume-analyzer/documents/${documentId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete resume document',
      },
    };
  }
};

export const analyzeResumeApi = async (
  params: {
    documentId: string;
    jobId?: string;
    customJobTitle?: string;
    customJobDescription?: string;
    customCompanyName?: string;
  },
  token?: string | null
): Promise<ApiResponse<AtsAnalysisResultData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/resume-analyzer/analyze`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to analyze resume',
      },
    };
  }
};

export const fetchResumeAnalysisByIdApi = async (
  analysisId: string,
  token?: string | null
): Promise<ApiResponse<AtsAnalysisResultData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/resume-analyzer/analyses/${analysisId}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch resume analysis report',
      },
    };
  }
};

export const fetchResumeAnalysesApi = async (
  token?: string | null
): Promise<ApiResponse<AtsAnalysisResultData[]>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/resume-analyzer/analyses`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch resume analysis history',
      },
    };
  }
};

export const fetchResumeSuggestionsApi = async (
  analysisId: string,
  token?: string | null
): Promise<ApiResponse<ResumeSuggestionData[]>> => {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/resume-analyzer/analyses/${analysisId}/suggestions`,
      {
        method: 'GET',
        headers: getHeaders(token),
        credentials: 'include',
      }
    );
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch resume suggestions',
      },
    };
  }
};

export const updateResumeSuggestionStatusApi = async (
  suggestionId: string,
  status: 'ACCEPTED' | 'REJECTED',
  token?: string | null
): Promise<ApiResponse<ResumeSuggestionData>> => {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/resume-analyzer/suggestions/${suggestionId}`,
      {
        method: 'PATCH',
        headers: getHeaders(token),
        credentials: 'include',
        body: JSON.stringify({ status }),
      }
    );
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update suggestion status',
      },
    };
  }
};

export const createResumeVersionApi = async (
  params: {
    documentId: string;
    structuredData: ExtractedStructuredResume;
    changeSummary?: string;
  },
  token?: string | null
): Promise<ApiResponse<ResumeVersionData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/resume-analyzer/versions`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to save resume version',
      },
    };
  }
};

export const fetchResumeVersionsApi = async (
  documentId: string,
  token?: string | null
): Promise<ApiResponse<ResumeVersionData[]>> => {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/resume-analyzer/versions/${documentId}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        credentials: 'include',
      }
    );
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch version history',
      },
    };
  }
};

export const exportImprovedResumePdfApi = async (
  params: {
    title?: string;
    structuredData: ExtractedStructuredResume;
    template?: string;
  },
  token?: string | null
): Promise<Blob | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/resume-analyzer/export-improved-pdf`, {
      method: 'POST',
      headers: {
        ...getHeaders(token),
        Accept: 'application/pdf',
      },
      credentials: 'include',
      body: JSON.stringify(params),
    });
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
};

export const fetchCollegeResumeAnalyticsApi = async (
  token?: string | null
): Promise<ApiResponse<CollegeResumeAnalyticsReport>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/resume-analyzer/college/analytics`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch college resume analytics',
      },
    };
  }
};

export const fetchEmployerCandidateResumeApi = async (
  applicationId: string,
  token?: string | null
): Promise<
  ApiResponse<{
    applicationId: string;
    studentName: string;
    jobTitle: string;
    extractedResume: ExtractedStructuredResume;
    keywordAlignment: {
      matched: string[];
      missing: string[];
    };
  }>
> => {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/resume-analyzer/employer/candidate-resume/${applicationId}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        credentials: 'include',
      }
    );
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch candidate resume',
      },
    };
  }
};

// ==========================================
// PHASE 16: MENTORSHIP & INDUSTRY CONNECT
// ==========================================

export const fetchVerifiedMentorsApi = async (
  filters: {
    industry?: string;
    topic?: string;
    language?: string;
    isAlumni?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {},
  token?: string | null
): Promise<
  ApiResponse<{
    mentors: MentorProfileData[];
    total: number;
    page: number;
    totalPages: number;
  }>
> => {
  try {
    const params = new URLSearchParams();
    if (filters.industry) params.set('industry', filters.industry);
    if (filters.topic) params.set('topic', filters.topic);
    if (filters.language) params.set('language', filters.language);
    if (filters.isAlumni !== undefined) params.set('isAlumni', String(filters.isAlumni));
    if (filters.search) params.set('search', filters.search);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));

    const res = await fetchWithTimeout(
      `${API_BASE_URL}/mentorship/mentors?${params.toString()}`,
      {
        method: 'GET',
        headers: getHeaders(token),
        credentials: 'include',
      }
    );
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch mentors' },
    };
  }
};

export const fetchMentorRecommendationsApi = async (
  token?: string | null
): Promise<ApiResponse<MentorRecommendationData[]>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/recommendations`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch mentor recommendations' },
    };
  }
};

export const fetchMentorByIdApi = async (
  mentorProfileId: string,
  token?: string | null
): Promise<ApiResponse<MentorProfileData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/mentors/${mentorProfileId}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch mentor profile' },
    };
  }
};

export const fetchMyMentorProfileApi = async (
  token?: string | null
): Promise<ApiResponse<MentorProfileData | null>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/profile/mentor/me`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch profile' },
    };
  }
};

export const upsertMentorProfileApi = async (
  data: Partial<MentorProfileData>,
  token?: string | null
): Promise<ApiResponse<MentorProfileData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/profile/mentor`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to save mentor profile' },
    };
  }
};

export const fetchStudentMentorshipProfileApi = async (
  token?: string | null
): Promise<ApiResponse<StudentMentorshipProfileData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/profile/student`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch student mentorship profile' },
    };
  }
};

export const updateStudentMentorshipProfileApi = async (
  data: Partial<StudentMentorshipProfileData>,
  token?: string | null
): Promise<ApiResponse<StudentMentorshipProfileData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/profile/student`, {
      method: 'PUT',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to update preferences' },
    };
  }
};

export const createMentorshipRequestApi = async (
  data: {
    mentorProfileId: string;
    topic: string;
    objective: string;
    introduction: string;
    preferredFormat?: 'ONE_ON_ONE' | 'GROUP';
  },
  token?: string | null
): Promise<ApiResponse<MentorshipRequestData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/requests`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to create request' },
    };
  }
};

export const fetchIncomingMentorshipRequestsApi = async (
  token?: string | null
): Promise<ApiResponse<MentorshipRequestData[]>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/requests/incoming`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch requests' },
    };
  }
};

export const fetchOutgoingMentorshipRequestsApi = async (
  token?: string | null
): Promise<ApiResponse<MentorshipRequestData[]>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/requests/outgoing`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch requests' },
    };
  }
};

export const respondToMentorshipRequestApi = async (
  requestId: string,
  data: { status: 'ACCEPTED' | 'REJECTED'; responseMessage?: string },
  token?: string | null
): Promise<ApiResponse<{ request: MentorshipRequestData; relationship?: MentorshipRelationshipData }>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/requests/${requestId}/respond`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to respond to request' },
    };
  }
};

export const fetchUserRelationshipsApi = async (
  token?: string | null
): Promise<ApiResponse<MentorshipRelationshipData[]>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/relationships`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch relationships' },
    };
  }
};

export const fetchRelationshipByIdApi = async (
  relationshipId: string,
  token?: string | null
): Promise<ApiResponse<MentorshipRelationshipData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/relationships/${relationshipId}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch relationship' },
    };
  }
};

export const updateRelationshipStatusApi = async (
  relationshipId: string,
  status: MentorshipRelationshipStatus,
  token?: string | null
): Promise<ApiResponse<MentorshipRelationshipData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/relationships/${relationshipId}/status`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to update status' },
    };
  }
};

export const fetchMentorshipGoalsApi = async (
  relationshipId: string,
  token?: string | null
): Promise<ApiResponse<MentorshipGoalData[]>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/relationships/${relationshipId}/goals`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch goals' },
    };
  }
};

export const createMentorshipGoalApi = async (
  relationshipId: string,
  goalData: { title: string; description?: string; priority?: 'HIGH' | 'MEDIUM' | 'LOW'; targetDate?: string },
  token?: string | null
): Promise<ApiResponse<MentorshipGoalData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/relationships/${relationshipId}/goals`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(goalData),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to create goal' },
    };
  }
};

export const updateMentorshipGoalApi = async (
  relationshipId: string,
  goalId: string,
  updates: { progress?: number; status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'; title?: string; description?: string; priority?: 'HIGH' | 'MEDIUM' | 'LOW' },
  token?: string | null
): Promise<ApiResponse<MentorshipGoalData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/relationships/${relationshipId}/goals/${goalId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to update goal' },
    };
  }
};

export const deleteMentorshipGoalApi = async (
  relationshipId: string,
  goalId: string,
  token?: string | null
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/relationships/${relationshipId}/goals/${goalId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to delete goal' },
    };
  }
};

export const fetchMentorshipSessionsApi = async (
  relationshipId: string,
  token?: string | null
): Promise<ApiResponse<MentorshipSessionData[]>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/relationships/${relationshipId}/sessions`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch sessions' },
    };
  }
};

export const scheduleMentorshipSessionApi = async (
  relationshipId: string,
  sessionData: {
    title: string;
    sessionTopic: string;
    scheduledStart: string;
    scheduledEnd: string;
    durationMinutes?: number;
    sessionType?: 'ONE_ON_ONE' | 'GROUP';
    meetingLink?: string;
    agenda?: string[];
  },
  token?: string | null
): Promise<ApiResponse<MentorshipSessionData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/relationships/${relationshipId}/sessions`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(sessionData),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to schedule session' },
    };
  }
};

export const updateMentorshipSessionStatusApi = async (
  relationshipId: string,
  sessionId: string,
  status: MentorshipSessionStatus,
  cancellationReason?: string,
  token?: string | null
): Promise<ApiResponse<MentorshipSessionData>> => {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/mentorship/relationships/${relationshipId}/sessions/${sessionId}/status`,
      {
        method: 'PATCH',
        headers: getHeaders(token),
        credentials: 'include',
        body: JSON.stringify({ status, cancellationReason }),
      }
    );
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to update session' },
    };
  }
};

export const fetchMentorshipMessagesApi = async (
  relationshipId: string,
  token?: string | null
): Promise<ApiResponse<MentorshipMessageData[]>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/relationships/${relationshipId}/messages`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch messages' },
    };
  }
};

export const sendMentorshipMessageApi = async (
  relationshipId: string,
  content: string,
  token?: string | null
): Promise<ApiResponse<MentorshipMessageData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/relationships/${relationshipId}/messages`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ content }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to send message' },
    };
  }
};

export const fetchMentorshipNotesApi = async (
  relationshipId: string,
  token?: string | null
): Promise<ApiResponse<MentorshipNoteData[]>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/relationships/${relationshipId}/notes`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch notes' },
    };
  }
};

export const createMentorshipNoteApi = async (
  relationshipId: string,
  data: { content: string; visibility?: 'PRIVATE' | 'SHARED'; sessionId?: string },
  token?: string | null
): Promise<ApiResponse<MentorshipNoteData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/relationships/${relationshipId}/notes`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to create note' },
    };
  }
};

export const deleteMentorshipNoteApi = async (
  relationshipId: string,
  noteId: string,
  token?: string | null
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/relationships/${relationshipId}/notes/${noteId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to delete note' },
    };
  }
};

export const submitMentorshipFeedbackApi = async (
  relationshipId: string,
  data: {
    sessionId?: string;
    rating: number;
    writtenFeedback: string;
    strengthsHighlight?: string[];
    areasToImprove?: string[];
  },
  token?: string | null
): Promise<ApiResponse<MentorshipFeedbackData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/relationships/${relationshipId}/feedback`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to submit feedback' },
    };
  }
};

export const fetchMentorFeedbackApi = async (
  mentorProfileId: string,
  token?: string | null
): Promise<ApiResponse<MentorshipFeedbackData[]>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/mentors/${mentorProfileId}/feedback`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch feedback' },
    };
  }
};

export const fetchGroupMentorshipSessionsApi = async (
  token?: string | null
): Promise<ApiResponse<MentorshipGroupData[]>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/groups`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch group sessions' },
    };
  }
};

export const createGroupMentorshipSessionApi = async (
  data: {
    title: string;
    description: string;
    topic: string;
    maximumParticipants?: number;
    scheduledStart: string;
    scheduledEnd: string;
    meetingLink?: string;
  },
  token?: string | null
): Promise<ApiResponse<MentorshipGroupData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/groups`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to create group session' },
    };
  }
};

export const joinGroupMentorshipSessionApi = async (
  groupId: string,
  token?: string | null
): Promise<ApiResponse<MentorshipGroupData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/groups/${groupId}/join`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to join group session' },
    };
  }
};

export const leaveGroupMentorshipSessionApi = async (
  groupId: string,
  token?: string | null
): Promise<ApiResponse<MentorshipGroupData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/groups/${groupId}/leave`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to leave group session' },
    };
  }
};

export const aiPrepareMentorshipAgendaApi = async (
  data: { topic: string; objective: string; studentBackground?: string; mentorDesignation?: string },
  token?: string | null
): Promise<ApiResponse<MentorshipAiAgendaResponse>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/ai/prepare-agenda`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to prepare agenda' },
    };
  }
};

export const aiSuggestMentorshipQuestionsApi = async (
  data: { topic: string; objective: string; mentorIndustry?: string },
  token?: string | null
): Promise<ApiResponse<MentorshipAiQuestionsResponse>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/ai/suggest-questions`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to suggest questions' },
    };
  }
};

export const aiSummarizeMentorshipNotesApi = async (
  data: { rawNotes: string; topic: string },
  token?: string | null
): Promise<ApiResponse<MentorshipAiNotesSummaryResponse>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/ai/summarize-notes`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to summarize notes' },
    };
  }
};

export const fetchCollegeMentorshipAnalyticsApi = async (
  token?: string | null
): Promise<ApiResponse<CollegeMentorshipAnalyticsReport>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/college/analytics`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch college analytics' },
    };
  }
};

export const fetchAdminMentorVerificationQueueApi = async (
  status?: string,
  token?: string | null
): Promise<ApiResponse<MentorProfileData[]>> => {
  try {
    const param = status ? `?status=${status}` : '';
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/admin/verifications${param}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch verification queue' },
    };
  }
};

export const reviewAdminMentorVerificationApi = async (
  mentorProfileId: string,
  data: { status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED'; rejectionReason?: string },
  token?: string | null
): Promise<ApiResponse<MentorProfileData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/admin/verifications/${mentorProfileId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to review verification' },
    };
  }
};

export const fetchAdminMentorshipAnalyticsApi = async (
  token?: string | null
): Promise<ApiResponse<AdminMentorshipAnalyticsReport>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/mentorship/admin/analytics`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch admin analytics' },
    };
  }
};

// ==========================================
// PHASE 17: ADVANCED LEARNING & RESOURCE HUB APIS
// ==========================================

export const fetchLearningHubDashboardApi = async (
  token?: string | null
): Promise<ApiResponse<LearningHubDashboardData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/learning/dashboard`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch learning hub dashboard' },
    };
  }
};

export interface LearningResourceFilterParams {
  category?: string;
  resourceType?: string;
  difficulty?: string;
  skill?: string;
  search?: string;
  verificationStatus?: string;
  isFree?: boolean;
}

export const fetchLearningResourcesApi = async (
  filters: LearningResourceFilterParams = {},
  token?: string | null
): Promise<ApiResponse<LearningResourceData[]>> => {
  try {
    const query = new URLSearchParams();
    if (filters.category) query.set('category', filters.category);
    if (filters.resourceType) query.set('resourceType', filters.resourceType);
    if (filters.difficulty) query.set('difficulty', filters.difficulty);
    if (filters.skill) query.set('skill', filters.skill);
    if (filters.isFree !== undefined) query.set('isFree', String(filters.isFree));
    if (filters.search) query.set('search', filters.search);
    if (filters.verificationStatus) query.set('verificationStatus', filters.verificationStatus);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetchWithTimeout(`${API_BASE_URL}/learning/resources${queryString}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch learning resources' },
    };
  }
};

export const fetchLearningResourceDetailApi = async (
  resourceId: string,
  token?: string | null
): Promise<ApiResponse<LearningResourceData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/learning/resources/${resourceId}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch resource detail' },
    };
  }
};

export const toggleResourceBookmarkApi = async (
  resourceId: string,
  payload: { personalNote?: string; category?: string } = {},
  token?: string | null
): Promise<ApiResponse<ResourceBookmarkData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/learning/resources/${resourceId}/bookmark`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to toggle bookmark' },
    };
  }
};

export const fetchResourceBookmarksApi = async (
  token?: string | null
): Promise<ApiResponse<ResourceBookmarkData[]>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/learning/bookmarks`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch bookmarks' },
    };
  }
};

export const reportLearningResourceApi = async (
  resourceId: string,
  payload: { reason: string; details: string },
  token?: string | null
): Promise<ApiResponse<ResourceReportData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/learning/resources/${resourceId}/report`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to report resource' },
    };
  }
};

export const fetchLearningPathsApi = async (
  token?: string | null
): Promise<ApiResponse<LearningPathData[]>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/learning/paths`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch learning paths' },
    };
  }
};

export const fetchLearningPathDetailApi = async (
  pathId: string,
  token?: string | null
): Promise<ApiResponse<LearningPathData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/learning/paths/${pathId}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch path detail' },
    };
  }
};

export const enrollLearningPathApi = async (
  pathId: string,
  token?: string | null
): Promise<ApiResponse<LearningEnrollmentData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/learning/paths/${pathId}/enroll`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to enroll in learning path' },
    };
  }
};

export const updateModuleProgressApi = async (
  pathId: string,
  moduleId: string,
  payload: {
    status: 'IN_PROGRESS' | 'COMPLETED';
    completionMethod?: 'STUDENT_CONFIRMED' | 'QUIZ_VERIFIED' | 'AUTO';
    notes?: string;
  },
  token?: string | null
): Promise<ApiResponse<{ moduleProgress: ModuleProgressData; enrollment: LearningEnrollmentData }>> => {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/learning/paths/${pathId}/modules/${moduleId}/progress`,
      {
        method: 'PATCH',
        headers: getHeaders(token),
        credentials: 'include',
        body: JSON.stringify(payload),
      }
    );
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to update module progress' },
    };
  }
};

export const fetchLearningQuizApi = async (
  quizId: string,
  token?: string | null
): Promise<ApiResponse<LearningQuizData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/learning/quizzes/${quizId}`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch quiz' },
    };
  }
};

export const submitLearningQuizApi = async (
  quizId: string,
  answers: Record<string, string>,
  learningPathId?: string,
  token?: string | null
): Promise<ApiResponse<LearningQuizAttemptData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/learning/quizzes/${quizId}/submit`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ answers, learningPathId }),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to submit quiz' },
    };
  }
};

export const fetchLearningRecommendationsApi = async (
  token?: string | null
): Promise<ApiResponse<LearningRecommendationData[]>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/learning/recommendations`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch recommendations' },
    };
  }
};

export const fetchSkillGapLearningMapApi = async (
  token?: string | null
): Promise<ApiResponse<SkillGapLearningRecommendation[]>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/learning/skill-gap-map`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch skill gap map' },
    };
  }
};

export const fetchCollegeLearningAnalyticsApi = async (
  token?: string | null
): Promise<ApiResponse<CollegeLearningAnalyticsReport>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/learning/college/analytics`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch college analytics' },
    };
  }
};

export const fetchAdminLearningReportsApi = async (
  token?: string | null
): Promise<ApiResponse<ResourceReportData[]>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/learning/admin/reports`, {
      method: 'GET',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch reports' },
    };
  }
};

export const resolveAdminLearningReportApi = async (
  reportId: string,
  payload: { status: 'REVIEWED' | 'RESOLVED' | 'DISMISSED'; adminNotes?: string },
  token?: string | null
): Promise<ApiResponse<ResourceReportData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/learning/admin/reports/${reportId}/resolve`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to resolve report' },
    };
  }
};

export const verifyAdminLearningResourceApi = async (
  resourceId: string,
  payload: {
    verificationStatus: 'DRAFT' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED' | 'ARCHIVED';
    isPublished?: boolean;
  },
  token?: string | null
): Promise<ApiResponse<LearningResourceData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/learning/admin/resources/${resourceId}/verify`, {
      method: 'PATCH',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to verify resource' },
    };
  }
};

export const upsertAdminLearningResourceApi = async (
  payload: Partial<LearningResourceData>,
  token?: string | null
): Promise<ApiResponse<LearningResourceData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/learning/admin/resources`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to upsert resource' },
    };
  }
};

export const seedAdminLearningDataApi = async (
  token?: string | null
): Promise<ApiResponse<{
  categoriesCount: number;
  resourcesCount: number;
  pathsCount: number;
  modulesCount: number;
  quizzesCount: number;
}>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/learning/admin/seed`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to seed learning data' },
    };
  }
};

// ==========================================
// PHASE 18: ADVANCED ANALYTICS & REPORTING
// ==========================================

function buildAnalyticsQuery(filter?: AnalyticsDateFilter): string {
  if (!filter) return '';
  const params = new URLSearchParams();
  if (filter.preset) params.append('preset', filter.preset);
  if (filter.from) params.append('from', filter.from);
  if (filter.to) params.append('to', filter.to);
  const q = params.toString();
  return q ? `?${q}` : '';
}

export const getMetricsDefinitionsApi = async (): Promise<ApiResponse<Record<string, MetricDefinition>>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/metrics-definitions`, {
      headers: getHeaders(),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch metric definitions' },
    };
  }
};

export const getStudentAnalyticsApi = async (
  filter?: AnalyticsDateFilter,
  token?: string | null
): Promise<ApiResponse<StudentCareerAnalytics>> => {
  try {
    const query = buildAnalyticsQuery(filter);
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/student${query}`, {
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch student analytics' },
    };
  }
};

export const getCollegeAnalyticsApi = async (
  filter?: AnalyticsDateFilter,
  token?: string | null
): Promise<ApiResponse<CollegePlacementAnalytics>> => {
  try {
    const query = buildAnalyticsQuery(filter);
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/college${query}`, {
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch college analytics' },
    };
  }
};

export const getCollegeFunnelApi = async (
  filter?: AnalyticsDateFilter,
  token?: string | null
): Promise<ApiResponse<CollegePlacementAnalytics['placementFunnel']>> => {
  try {
    const query = buildAnalyticsQuery(filter);
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/college/funnel${query}`, {
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch college funnel' },
    };
  }
};

export const getCollegeSkillGapsApi = async (
  filter?: AnalyticsDateFilter,
  token?: string | null
): Promise<ApiResponse<CollegePlacementAnalytics['skillGapAnalytics']>> => {
  try {
    const query = buildAnalyticsQuery(filter);
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/college/skill-gaps${query}`, {
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch college skill gaps' },
    };
  }
};

export const getEmployerAnalyticsApi = async (
  filter?: AnalyticsDateFilter,
  token?: string | null
): Promise<ApiResponse<EmployerRecruitmentAnalytics>> => {
  try {
    const query = buildAnalyticsQuery(filter);
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/employer${query}`, {
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch employer analytics' },
    };
  }
};

export const getEmployerJobsApi = async (
  filter?: AnalyticsDateFilter,
  token?: string | null
): Promise<ApiResponse<EmployerRecruitmentAnalytics['jobPerformance']>> => {
  try {
    const query = buildAnalyticsQuery(filter);
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/employer/jobs${query}`, {
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch employer job analytics' },
    };
  }
};

export const getEmployerFunnelApi = async (
  filter?: AnalyticsDateFilter,
  token?: string | null
): Promise<ApiResponse<EmployerRecruitmentAnalytics['recruitmentFunnel']>> => {
  try {
    const query = buildAnalyticsQuery(filter);
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/employer/funnel${query}`, {
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch employer funnel' },
    };
  }
};

export const getAdminAnalyticsApi = async (
  filter?: AnalyticsDateFilter,
  token?: string | null
): Promise<ApiResponse<AdminPlatformAnalytics>> => {
  try {
    const query = buildAnalyticsQuery(filter);
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/admin${query}`, {
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch admin platform analytics' },
    };
  }
};

export const getAdminUserGrowthApi = async (
  filter?: AnalyticsDateFilter,
  token?: string | null
): Promise<ApiResponse<AdminPlatformAnalytics['userGrowth']>> => {
  try {
    const query = buildAnalyticsQuery(filter);
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/admin/user-growth${query}`, {
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch user growth data' },
    };
  }
};

export const getAdminSystemHealthApi = async (
  filter?: AnalyticsDateFilter,
  token?: string | null
): Promise<ApiResponse<AdminPlatformAnalytics['systemHealthTelemetry']>> => {
  try {
    const query = buildAnalyticsQuery(filter);
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/admin/system-health${query}`, {
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch system health telemetry' },
    };
  }
};

export const generateReportApi = async (
  payload: {
    title?: string;
    reportType?: string;
    format: ReportFormat;
    scopeType: ReportScopeType;
    scopeId?: string;
    filter?: AnalyticsDateFilter;
  },
  token?: string | null
): Promise<ApiResponse<ReportHistoryData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/reports/generate`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to generate report' },
    };
  }
};

export const listReportsApi = async (
  scopeType?: ReportScopeType,
  token?: string | null
): Promise<ApiResponse<ReportHistoryData[]>> => {
  try {
    const query = scopeType ? `?scopeType=${scopeType}` : '';
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/reports${query}`, {
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to list reports' },
    };
  }
};

export const downloadReportApi = async (
  reportId: string,
  token?: string | null
): Promise<{ success: boolean; content?: string; filename?: string; error?: string }> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/reports/${reportId}/download`, {
      headers: getHeaders(token),
      credentials: 'include',
    });
    if (!res.ok) {
      return { success: false, error: 'Failed to download report' };
    }
    const content = await res.text();
    const disposition = res.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="?([^";]+)"?/);
    const filename = match ? match[1] : `report_${reportId}.csv`;
    return { success: true, content, filename };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download network error',
    };
  }
};

export const deleteReportApi = async (
  reportId: string,
  token?: string | null
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/reports/${reportId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to delete report' },
    };
  }
};

export const listSchedulesApi = async (
  scopeType?: ReportScopeType,
  token?: string | null
): Promise<ApiResponse<ScheduledReportData[]>> => {
  try {
    const query = scopeType ? `?scopeType=${scopeType}` : '';
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/schedules${query}`, {
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to list report schedules' },
    };
  }
};

export const createScheduleApi = async (
  payload: Partial<ScheduledReportData>,
  token?: string | null
): Promise<ApiResponse<ScheduledReportData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/schedules`, {
      method: 'POST',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to create report schedule' },
    };
  }
};

export const updateScheduleApi = async (
  scheduleId: string,
  payload: Partial<ScheduledReportData>,
  token?: string | null
): Promise<ApiResponse<ScheduledReportData>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/schedules/${scheduleId}`, {
      method: 'PUT',
      headers: getHeaders(token),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to update report schedule' },
    };
  }
};

export const deleteScheduleApi = async (
  scheduleId: string,
  token?: string | null
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
      credentials: 'include',
    });
    return await res.json();
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Failed to delete report schedule' },
    };
  }
};













