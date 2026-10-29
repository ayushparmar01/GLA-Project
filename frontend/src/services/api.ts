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

export const fetchSystemHealth = async (): Promise<SystemHealthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

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
