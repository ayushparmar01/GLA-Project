import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/I18nContext';
import { LanguageSelector } from './common/LanguageSelector';
import {
  fetchDrives,
  checkEligibilityApi,
  applyToDriveApi,
  fetchMyApplicationsApi,
  withdrawApplicationApi,
  fetchCohorts,
  fetchStudentInterviewsApi,
} from '../services/api';
import {
  PlacementDriveData,
  PlacementApplicationData,
  CohortData,
  EligibilityResult,
  ApplicationStatus,
  InterviewData,
} from '../types';
import {
  Briefcase,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  MapPin,
  Building,
  Users,
  Search,
  RefreshCw,
  Send,
  ArrowLeft,
  X,
  FileCheck,
  Ban,
  Sparkles,
  Award,
  Calendar,
  Video,
  ExternalLink,
  UserCheck,
  FolderGit2,
  FileText,
  BrainCircuit,
  CheckSquare,
  Target,
  Compass,
  Bot,
  Map,
  BookOpen,
  HelpCircle,
  Megaphone,
  CalendarDays,
} from 'lucide-react';
import { CareerProfileView } from './student/CareerProfileView';
import { ProjectPortfolioView } from './student/ProjectPortfolioView';
import { ResumeBuilderView } from './student/ResumeBuilderView';
import { SkillsExplorerView } from './student/SkillsExplorerView';
import { AssessmentCatalogueView } from './student/AssessmentCatalogueView';
import { AssessmentAttemptView } from './student/AssessmentAttemptView';
import { AssessmentResultView } from './student/AssessmentResultView';
import { CareerReadinessView } from './student/CareerReadinessView';
import { SkillGapView } from './student/SkillGapView';
import { RecommendedOpportunitiesView } from './student/RecommendedOpportunitiesView';
import { CareerAssistantView } from './student/CareerAssistantView';
import { LearningRoadmapDashboardView } from './student/LearningRoadmapDashboardView';
import { LearningResourceExplorerView } from './student/LearningResourceExplorerView';
import { InterviewPreparationView } from './student/InterviewPreparationView';
import { InterviewPreparationDashboard } from './interview/InterviewPreparationDashboard';
import { AtsResumeAnalyzerDashboard } from './resumeAnalyzer/AtsResumeAnalyzerDashboard';
import { CareerEventsView } from './events/CareerEventsView';
import { CommunicationCentreView } from './communication/CommunicationCentreView';
import { MentorDiscoveryDashboard } from './mentorship/MentorDiscoveryDashboard';
import { MentorshipWorkspaceView } from './mentorship/MentorshipWorkspaceView';
import { MentorshipRequestManagementView } from './mentorship/MentorshipRequestManagementView';
import { LearningHubDashboard } from './learning/LearningHubDashboard';
import { StudentAnalyticsDashboard } from './analytics/StudentAnalyticsDashboard';
import { AssessmentData, AssessmentAttemptData } from '../types';

interface StudentPlacementViewProps {
  onBack?: () => void;
  onNavigateToProfile?: () => void;
  initialTab?: StudentPlacementTab;
  onTabChange?: (tab: StudentPlacementTab) => void;
}

export type StudentPlacementTab =
  | 'DRIVES'
  | 'APPLICATIONS'
  | 'INTERVIEWS'
  | 'COHORTS'
  | 'CAREER_PROFILE'
  | 'PORTFOLIO'
  | 'RESUMES'
  | 'ATS_ANALYZER'
  | 'ASSESSMENTS'
  | 'READINESS'
  | 'SKILL_GAPS'
  | 'MATCHING'
  | 'SKILLS_EXPLORER'
  | 'AI_GUIDE'
  | 'ROADMAPS'
  | 'INTERVIEW_PREP'
  | 'MENTORSHIP'
  | 'LEARNING_HUB'
  | 'ANALYTICS'
  | 'RESOURCES'
  | 'CAREER_EVENTS'
  | 'COMMUNICATION_CENTRE';

export const StudentPlacementView: React.FC<StudentPlacementViewProps> = ({
  onBack,
  onNavigateToProfile,
  initialTab,
  onTabChange,
}) => {
  const { token, user } = useAuth();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<StudentPlacementTab>(initialTab || 'DRIVES');
  const [selectedMentorshipId, setSelectedMentorshipId] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab: StudentPlacementTab) => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  // Phase 6 Assessment states
  const [activeAttempt, setActiveAttempt] = useState<AssessmentAttemptData | null>(null);
  const [activeAssessment, setActiveAssessment] = useState<AssessmentData | null>(null);
  const [reviewedAttempt, setReviewedAttempt] = useState<AssessmentAttemptData | null>(null);

  // Drives state
  const [drives, setDrives] = useState<PlacementDriveData[]>([]);
  const [loadingDrives, setLoadingDrives] = useState<boolean>(true);
  const [drivesError, setDrivesError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Applications state
  const [applications, setApplications] = useState<PlacementApplicationData[]>([]);
  const [loadingApps, setLoadingApps] = useState<boolean>(false);
  const [appsError, setAppsError] = useState<string | null>(null);

  // Student Cohorts state
  const [enrolledCohorts, setEnrolledCohorts] = useState<CohortData[]>([]);
  const [loadingCohorts, setLoadingCohorts] = useState<boolean>(false);

  // Student Interviews state (Phase 4)
  const [interviews, setInterviews] = useState<InterviewData[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState<boolean>(false);

  // Eligibility Modal state
  const [selectedDriveForEligibility, setSelectedDriveForEligibility] = useState<PlacementDriveData | null>(null);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [loadingEligibility, setLoadingEligibility] = useState<boolean>(false);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  // Apply state
  const [applyingDriveId, setApplyingDriveId] = useState<string | null>(null);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);
  const [applyErrorMessage, setApplyErrorMessage] = useState<string | null>(null);

  // Withdraw state
  const [withdrawingAppId, setWithdrawingAppId] = useState<string | null>(null);

  const loadDrives = useCallback(async () => {
    setLoadingDrives(true);
    setDrivesError(null);
    const res = await fetchDrives(token);
    if (res.success && res.data) {
      setDrives(res.data);
    } else {
      setDrivesError(res.error?.message || 'Failed to load available drives.');
    }
    setLoadingDrives(false);
  }, [token]);

  const loadApplications = useCallback(async () => {
    setLoadingApps(true);
    setAppsError(null);
    const res = await fetchMyApplicationsApi(token);
    if (res.success && res.data) {
      setApplications(res.data);
    } else {
      setAppsError(res.error?.message || 'Failed to load applications.');
    }
    setLoadingApps(false);
  }, [token]);

  const loadCohorts = useCallback(async () => {
    setLoadingCohorts(true);
    const res = await fetchCohorts(token);
    if (res.success && res.data) {
      setEnrolledCohorts(res.data);
    }
    setLoadingCohorts(false);
  }, [token]);

  const loadInterviews = useCallback(async () => {
    setLoadingInterviews(true);
    const res = await fetchStudentInterviewsApi(token);
    if (res.success && res.data) {
      setInterviews(res.data);
    }
    setLoadingInterviews(false);
  }, [token]);

  useEffect(() => {
    loadDrives();
    loadApplications();
    loadCohorts();
    loadInterviews();
  }, [loadDrives, loadApplications, loadCohorts, loadInterviews]);

  // Check Eligibility Handler
  const handleCheckEligibility = async (drive: PlacementDriveData) => {
    setSelectedDriveForEligibility(drive);
    setLoadingEligibility(true);
    setEligibilityResult(null);
    setEligibilityError(null);

    const res = await checkEligibilityApi(drive.id, token);
    if (res.success && res.data) {
      setEligibilityResult(res.data.eligibility);
    } else {
      setEligibilityError(res.error?.message || 'Failed to evaluate eligibility.');
    }
    setLoadingEligibility(false);
  };

  // Submit Application Handler
  const handleApply = async (driveId: string) => {
    setApplyingDriveId(driveId);
    setApplySuccessMessage(null);
    setApplyErrorMessage(null);

    const res = await applyToDriveApi(driveId, token);
    if (res.success && res.data) {
      setApplySuccessMessage('Application submitted successfully! Track updates in "My Applications".');
      setApplications((prev) => [res.data!, ...prev]);
      if (selectedDriveForEligibility) {
        setSelectedDriveForEligibility(null);
      }
    } else {
      const errDetail = Array.isArray(res.error?.details) ? res.error.details.join(' ') : res.error?.message;
      setApplyErrorMessage(errDetail || 'Failed to submit application.');
    }
    setApplyingDriveId(null);
  };

  // Withdraw Application Handler
  const handleWithdraw = async (applicationId: string) => {
    if (!window.confirm('Are you sure you want to withdraw your application? This action cannot be undone.')) {
      return;
    }

    setWithdrawingAppId(applicationId);
    const res = await withdrawApplicationApi(applicationId, token);
    if (res.success && res.data) {
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? res.data! : app))
      );
    } else {
      alert(res.error?.message || 'Failed to withdraw application.');
    }
    setWithdrawingAppId(null);
  };

  const alreadyAppliedMap = new Set(Array.isArray(applications) ? applications.map((app) => app.driveId) : []);

  const filteredDrives = drives.filter((d) => {
    return (
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.location && d.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const getAppStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'APPLIED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SHORTLISTED':
        return 'bg-purple-50 text-purple-700 border-purple-200 font-semibold';
      case 'INTERVIEW_SCHEDULED':
        return 'bg-amber-50 text-amber-800 border-amber-200 font-bold';
      case 'SELECTED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-black';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'WITHDRAWN':
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Briefcase className="w-3.5 h-3.5" />
              <span>STUDENT PLACEMENT DESK</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">Phase 3: Automated Drives & Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Campus Placement Opportunities
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Discover placement drives, verify your eligibility with explainable criteria, apply directly, and track interview progress.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <LanguageSelector variant="compact" />
          <button
            onClick={() => {
              loadDrives();
              loadApplications();
              loadCohorts();
            }}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title={t('actions.refresh')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs - Horizontally scrollable and responsive across mobile screens */}
      <div className="flex overflow-x-auto scrollbar-none items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-full mb-6 whitespace-nowrap">
        <button
          onClick={() => setActiveTab('DRIVES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'DRIVES'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Open Drives ({drives.length})
        </button>
        <button
          onClick={() => setActiveTab('APPLICATIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'APPLICATIONS'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Applications ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('INTERVIEWS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'INTERVIEWS'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Interviews ({interviews.length})
        </button>
        <button
          onClick={() => setActiveTab('COHORTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'COHORTS'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Cohorts ({enrolledCohorts.length})
        </button>
        <button
          onClick={() => setActiveTab('CAREER_PROFILE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'CAREER_PROFILE'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" /> Career Profile
        </button>
        <button
          onClick={() => setActiveTab('PORTFOLIO')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'PORTFOLIO'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" /> Project Portfolio
        </button>
        <button
          onClick={() => setActiveTab('RESUMES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'RESUMES'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> ATS Resumes
        </button>
        <button
          onClick={() => setActiveTab('ATS_ANALYZER')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'ATS_ANALYZER'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> ATS Analyzer
        </button>
        <button
          onClick={() => {
            setActiveAttempt(null);
            setReviewedAttempt(null);
            setActiveTab('ASSESSMENTS');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'ASSESSMENTS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" /> Skill Assessments
        </button>
        <button
          onClick={() => setActiveTab('READINESS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'READINESS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Target className="w-3.5 h-3.5" /> Career Readiness
        </button>
        <button
          onClick={() => setActiveTab('SKILL_GAPS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'SKILL_GAPS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5" /> Skill Gaps
        </button>
        <button
          onClick={() => setActiveTab('MATCHING')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'MATCHING'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5" /> Recommended Opportunities
        </button>
        <button
          onClick={() => setActiveTab('SKILLS_EXPLORER')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'SKILLS_EXPLORER'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" /> Skill Explorer
        </button>
        <button
          onClick={() => setActiveTab('AI_GUIDE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'AI_GUIDE'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bot className="w-3.5 h-3.5" /> AI Career Guide
        </button>
        <button
          onClick={() => setActiveTab('ROADMAPS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'ROADMAPS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Map className="w-3.5 h-3.5" /> Learning Roadmaps
        </button>
        <button
          onClick={() => setActiveTab('INTERVIEW_PREP')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'INTERVIEW_PREP'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" /> Interview Prep
        </button>
        <button
          onClick={() => {
            setActiveTab('MENTORSHIP');
            setSelectedMentorshipId(null);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'MENTORSHIP'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Mentorship & Alumni
        </button>
        <button
          onClick={() => setActiveTab('LEARNING_HUB')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'LEARNING_HUB'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Learning Hub
        </button>
        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'ANALYTICS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📊 Career Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('RESOURCES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'RESOURCES'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Learning Library
        </button>
        <button
          onClick={() => setActiveTab('CAREER_EVENTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'CAREER_EVENTS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" /> Career Events
        </button>
        <button
          onClick={() => setActiveTab('COMMUNICATION_CENTRE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'COMMUNICATION_CENTRE'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" /> Noticeboard
        </button>
      </div>

      {/* Alerts */}
      {applySuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 text-sm flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span>{applySuccessMessage}</span>
          </div>
          <button
            onClick={() => setApplySuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {applyErrorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800 text-sm flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <span>{applyErrorMessage}</span>
          </div>
          <button
            onClick={() => setApplyErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================================================= */}
      {/* TAB 1: OPEN DRIVES */}
      {/* ================================================= */}
      {activeTab === 'DRIVES' && (
        <div>
          {/* Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drives, skills, company..."
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              />
            </div>
            <div className="text-xs text-slate-500">
              Showing <strong>{filteredDrives.length}</strong> available drives
            </div>
          </div>

          {loadingDrives ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-emerald-600" />
              <p className="text-sm font-medium">Loading placement opportunities...</p>
            </div>
          ) : filteredDrives.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
              <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">No Placement Drives Active</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Your college placement desk hasn't published any active placement drives matching your cohort yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDrives.map((drive) => {
                const hasApplied = alreadyAppliedMap.has(drive.id);
                const isDeadlinePassed = new Date(drive.applicationDeadline) < new Date();

                return (
                  <div
                    key={drive.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {drive.opportunityType}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span className={isDeadlinePassed ? 'text-rose-600 font-bold' : ''}>
                            {new Date(drive.applicationDeadline).toLocaleDateString()}
                          </span>
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-500 flex items-center space-x-1 mb-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{drive.organizationName}</span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                        {drive.title}
                      </h3>

                      <p className="text-slate-500 text-xs line-clamp-3 mb-4 leading-relaxed">
                        {drive.description}
                      </p>

                      <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{drive.location || 'Pan-India'} &bull; {drive.workMode}</span>
                        </div>

                        {drive.requiredSkills && drive.requiredSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {drive.requiredSkills.map((s, idx) => (
                              <span
                                key={idx}
                                className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-medium"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="px-6 py-3 bg-slate-50 rounded-b-2xl border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleCheckEligibility(drive)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Check Eligibility</span>
                      </button>

                      {hasApplied ? (
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          Applied
                        </span>
                      ) : isDeadlinePassed ? (
                        <span className="text-xs text-slate-400">Closed</span>
                      ) : (
                        <button
                          onClick={() => handleApply(drive.id)}
                          disabled={applyingDriveId === drive.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                        >
                          {applyingDriveId === drive.id ? 'Submitting...' : 'Apply Now'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================= */}
      {/* TAB 2: MY APPLICATIONS */}
      {/* ================================================= */}
      {activeTab === 'APPLICATIONS' && (
        <div className="space-y-4">
          {loadingApps ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-emerald-600" />
              <p className="text-sm font-medium">Loading your applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
              <Send className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">No Applications Submitted</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                You haven't applied to any placement opportunities yet. Explore the "Open Drives" tab to apply.
              </p>
              <button
                onClick={() => setActiveTab('DRIVES')}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all"
              >
                <span>Browse Placement Drives</span>
              </button>
            </div>
          ) : (
            applications.map((app) => {
              const drive = app.drive;
              return (
                <div
                  key={app.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-3 py-0.5 rounded-full border ${getAppStatusBadge(app.status)}`}>
                        {app.status}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Applied: {new Date(app.appliedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">
                      {drive?.title || 'Placement Drive Opportunity'}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>Company: <strong className="text-slate-700">{drive?.organizationName || 'Hiring Partner'}</strong></span>
                      <span>Type: <strong className="text-slate-700">{drive?.opportunityType || 'Job'}</strong></span>
                      <span>Location: <strong className="text-slate-700">{drive?.location || 'Pan-India'}</strong></span>
                    </div>

                    {/* Status history summary */}
                    {app.statusHistory && app.statusHistory.length > 0 && (
                      <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                        <span className="font-semibold text-slate-700">Workflow Audit Log:</span>{' '}
                        {app.statusHistory.map((h, idx) => (
                          <span key={idx} className="mr-2">
                            &bull; {h.toStatus} on {new Date(h.changedAt).toLocaleDateString()}
                            {h.note && ` ("${h.note}")`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    {app.status === 'APPLIED' && (
                      <button
                        onClick={() => handleWithdraw(app.id)}
                        disabled={withdrawingAppId === app.id}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        {withdrawingAppId === app.id ? 'Withdrawing...' : 'Withdraw'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ================================================= */}
      {/* TAB 3: MY INTERVIEWS (PHASE 4) */}
      {/* ================================================= */}
      {activeTab === 'INTERVIEWS' && (
        <div className="space-y-4">
          {loadingInterviews ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-emerald-600" />
              <p className="text-sm font-medium">Loading your scheduled interviews...</p>
            </div>
          ) : interviews.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
              <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">No Interviews Scheduled Yet</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                When recruiters shortlist your applications and set up technical assessments or HR rounds, your interview timings and meeting links will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {interviews.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                          {item.interviewRound}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-2">
                          {item.driveTitle || 'Campus Placement Opportunity'}
                        </h3>
                        <div className="text-xs text-slate-500 font-medium">
                          {item.companyName || 'Recruiting Partner'}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <span className="font-semibold text-slate-800">
                          {new Date(item.scheduledAt).toLocaleString()} ({item.durationMinutes} mins)
                        </span>
                      </div>

                      {item.interviewType === 'ONLINE' ? (
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          {item.meetingLink ? (
                            <a
                              href={item.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1"
                            >
                              Join Video Meeting <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span>Online Video Assessment</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>Venue: {item.location || 'College Placement Cell'}</span>
                        </div>
                      )}

                      {item.instructions && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 text-xs mt-2">
                          <span className="font-bold text-slate-700">Instructions: </span>
                          {item.instructions}
                        </div>
                      )}
                    </div>
                  </div>

                  {item.meetingLink && item.interviewType === 'ONLINE' && item.status !== 'CANCELLED' && (
                    <div className="pt-4 border-t border-slate-100 mt-4">
                      <a
                        href={item.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-1.5"
                      >
                        <Video className="w-4 h-4" />
                        Enter Interview Room
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================= */}
      {/* TAB 4: MY COHORTS */}
      {/* ================================================= */}
      {activeTab === 'COHORTS' && (
        <div className="space-y-4">
          {loadingCohorts ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-emerald-600" />
              <p className="text-sm font-medium">Loading your enrolled cohorts...</p>
            </div>
          ) : enrolledCohorts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">No Cohort Memberships</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                You are not enrolled in any department cohorts yet. Your college placement coordinator can enroll you by email.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCohorts.map((cohort) => (
                <div
                  key={cohort.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {cohort.status}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {cohort.studentCount} Peers Enrolled
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {cohort.name}
                  </h3>

                  {cohort.description && (
                    <p className="text-xs text-slate-500 mb-3">{cohort.description}</p>
                  )}

                  <div className="space-y-1 text-xs text-slate-600 pt-3 border-t border-slate-100">
                    <div>Degree: <strong className="text-slate-800">{cohort.course || 'All'}</strong></div>
                    <div>Graduation: <strong className="text-slate-800">{cohort.graduationYear || 'N/A'}</strong></div>
                    <div>Academic Year: <strong className="text-slate-800">{cohort.academicYear || 'N/A'}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================= */}
      {/* PHASE 5: CAREER PROFILE VIEW */}
      {/* ================================================= */}
      {activeTab === 'CAREER_PROFILE' && (
        <CareerProfileView
          onNavigateToProjects={() => setActiveTab('PORTFOLIO')}
          onNavigateToResumes={() => setActiveTab('RESUMES')}
        />
      )}

      {/* ================================================= */}
      {/* PHASE 5: PROJECT PORTFOLIO VIEW */}
      {/* ================================================= */}
      {activeTab === 'PORTFOLIO' && <ProjectPortfolioView />}

      {/* ================================================= */}
      {/* PHASE 5: ATS RESUME BUILDER VIEW */}
      {/* ================================================= */}
      {activeTab === 'RESUMES' && <ResumeBuilderView />}

      {/* ================================================= */}
      {/* PHASE 15: AI ATS RESUME ANALYZER DASHBOARD */}
      {/* ================================================= */}
      {activeTab === 'ATS_ANALYZER' && (
        <AtsResumeAnalyzerDashboard
          token={token}
          onNavigateToResumeBuilder={() => setActiveTab('RESUMES')}
          onBackToPlacementDrives={() => setActiveTab('DRIVES')}
        />
      )}

      {/* ================================================= */}
      {/* PHASE 6: SKILL ASSESSMENTS VIEW */}
      {/* ================================================= */}
      {activeTab === 'ASSESSMENTS' && (
        <>
          {activeAttempt && activeAssessment ? (
            <AssessmentAttemptView
              attempt={activeAttempt}
              assessment={activeAssessment}
              token={token}
              onFinishAttempt={(completed) => {
                setActiveAttempt(null);
                setActiveAssessment(null);
                setReviewedAttempt(completed);
              }}
              onExit={() => {
                setActiveAttempt(null);
                setActiveAssessment(null);
              }}
            />
          ) : reviewedAttempt ? (
            <AssessmentResultView
              attempt={reviewedAttempt}
              onBackToCatalogue={() => {
                setReviewedAttempt(null);
              }}
              onViewCareerReadiness={() => {
                setReviewedAttempt(null);
                setActiveTab('READINESS');
              }}
            />
          ) : (
            <AssessmentCatalogueView
              token={token}
              onStartAttempt={(attempt, asm) => {
                setActiveAttempt(attempt);
                setActiveAssessment(asm);
                setReviewedAttempt(null);
              }}
              onReviewAttempt={(attempt) => {
                setReviewedAttempt(attempt);
                setActiveAttempt(null);
              }}
            />
          )}
        </>
      )}

      {/* ================================================= */}
      {/* PHASE 6: CAREER READINESS SCORECARD VIEW */}
      {/* ================================================= */}
      {activeTab === 'READINESS' && (
        <CareerReadinessView
          token={token}
          onNavigateToTab={(tab) => {
            if (tab === 'assessments') setActiveTab('ASSESSMENTS');
            else if (tab === 'projects') setActiveTab('PORTFOLIO');
            else if (tab === 'resumes') setActiveTab('RESUMES');
          }}
        />
      )}

      {/* ================================================= */}
      {/* PHASE 6: SKILL GAP & LEARNING PATHWAYS VIEW */}
      {/* ================================================= */}
      {activeTab === 'SKILL_GAPS' && (
        <SkillGapView
          token={token}
          onNavigateToAssessment={() => setActiveTab('ASSESSMENTS')}
        />
      )}

      {/* ================================================= */}
      {/* PHASE 6: SMART RECOMMENDED OPPORTUNITIES VIEW */}
      {/* ================================================= */}
      {activeTab === 'MATCHING' && (
        <RecommendedOpportunitiesView
          token={token}
          onApplyToDrive={(driveId) => {
            const driveMatch = drives.find((d) => d.id === driveId);
            if (driveMatch) {
              handleCheckEligibility(driveMatch);
            }
          }}
          onViewDriveDetails={(driveId) => {
            const driveMatch = drives.find((d) => d.id === driveId);
            if (driveMatch) {
              handleCheckEligibility(driveMatch);
            }
          }}
          onNavigateToTab={(tab) => {
            if (tab === 'assessments') setActiveTab('ASSESSMENTS');
            else if (tab === 'SKILL_GAPS') setActiveTab('SKILL_GAPS');
          }}
        />
      )}

      {/* ================================================= */}
      {/* PHASE 6: SKILL TAXONOMY EXPLORER VIEW */}
      {/* ================================================= */}
      {activeTab === 'SKILLS_EXPLORER' && (
        <SkillsExplorerView
          onSelectSkillForAssessment={() => setActiveTab('ASSESSMENTS')}
        />
      )}

      {/* ================================================= */}
      {/* PHASE 7: AI CAREER ASSISTANT & CHAT VIEW */}
      {/* ================================================= */}
      {activeTab === 'AI_GUIDE' && (
        <CareerAssistantView
          token={token}
          onNavigateToRoadmaps={() => setActiveTab('ROADMAPS')}
          onNavigateToInterview={() => setActiveTab('INTERVIEW_PREP')}
          onNavigateToResources={() => setActiveTab('RESOURCES')}
        />
      )}

      {/* ================================================= */}
      {/* PHASE 7: PERSONALIZED LEARNING ROADMAPS VIEW */}
      {/* ================================================= */}
      {activeTab === 'ROADMAPS' && (
        <LearningRoadmapDashboardView token={token} />
      )}

      {/* ================================================= */}
      {/* PHASE 14: AI MOCK INTERVIEW PREPARATION PLATFORM */}
      {/* ================================================= */}
      {activeTab === 'INTERVIEW_PREP' && (
        <InterviewPreparationDashboard token={token} />
      )}

      {/* ================================================= */}
      {/* PHASE 16: MENTORSHIP & INDUSTRY CONNECT PLATFORM */}
      {/* ================================================= */}
      {activeTab === 'MENTORSHIP' && (
        selectedMentorshipId && selectedMentorshipId !== 'REQUESTS' ? (
          <MentorshipWorkspaceView
            relationshipId={selectedMentorshipId}
            currentUserId={user?.id}
            onBack={() => setSelectedMentorshipId(null)}
            token={token}
          />
        ) : selectedMentorshipId === 'REQUESTS' ? (
          <MentorshipRequestManagementView
            currentUserId={user?.id}
            isMentor={user?.role === 'MENTOR'}
            onOpenWorkspace={(relId) => setSelectedMentorshipId(relId)}
            token={token}
          />
        ) : (
          <MentorDiscoveryDashboard
            token={token}
            onOpenWorkspace={() => setSelectedMentorshipId('REQUESTS')}
            onRequestCreated={() => {}}
          />
        )
      )}

      {/* ================================================= */}
      {/* PHASE 17: ADVANCED LEARNING & RESOURCE HUB VIEW */}
      {/* ================================================= */}
      {activeTab === 'LEARNING_HUB' && (
        <LearningHubDashboard token={token} />
      )}

      {/* ================================================= */}
      {/* PHASE 18: ADVANCED STUDENT CAREER ANALYTICS */}
      {/* ================================================= */}
      {activeTab === 'ANALYTICS' && (
        <StudentAnalyticsDashboard
          token={token}
          onNavigateToLearning={() => setActiveTab('LEARNING_HUB')}
          onNavigateToResume={() => setActiveTab('ATS_ANALYZER')}
          onNavigateToInterviews={() => setActiveTab('INTERVIEW_PREP')}
        />
      )}

      {/* ================================================= */}
      {/* PHASE 7: CURATED LEARNING LIBRARY VIEW */}
      {/* ================================================= */}
      {activeTab === 'RESOURCES' && (
        <LearningResourceExplorerView />
      )}

      {/* ================================================= */}
      {/* PHASE 8: CAREER EVENTS & WORKSHOPS VIEW */}
      {/* ================================================= */}
      {activeTab === 'CAREER_EVENTS' && (
        <CareerEventsView token={token} userRole={user?.role} userId={user?.id} />
      )}

      {/* ================================================= */}
      {/* PHASE 8: COMMUNICATION CENTRE & NOTICEBOARD VIEW */}
      {/* ================================================= */}
      {activeTab === 'COMMUNICATION_CENTRE' && (
        <CommunicationCentreView token={token} userRole={user?.role} />
      )}

      {/* ================================================= */}
      {/* ELIGIBILITY SCORECARD MODAL */}
      {/* ================================================= */}
      {selectedDriveForEligibility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedDriveForEligibility(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-emerald-600 mb-1">
              <FileCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Explainable Criteria</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Eligibility Scorecard</h2>
            <p className="text-xs text-slate-500 mb-4">{selectedDriveForEligibility.title} &bull; {selectedDriveForEligibility.organizationName}</p>

            {loadingEligibility ? (
              <div className="py-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-emerald-600" />
                <p className="text-xs">Evaluating your academic and skill eligibility...</p>
              </div>
            ) : eligibilityResult ? (
              <div className="space-y-4">
                {/* Result Hero Banner */}
                <div
                  className={`p-4 rounded-xl border flex items-center space-x-3 ${
                    eligibilityResult.eligible
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  {eligibilityResult.eligible ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm">
                      {eligibilityResult.eligible
                        ? 'You Are Eligible for this Placement Drive!'
                        : 'Eligibility Requirements Pending'}
                    </h4>
                    <p className="text-xs mt-0.5 opacity-90">
                      {eligibilityResult.eligible
                        ? 'All academic background, skills, and cohort restrictions have been satisfied.'
                        : 'Review the detailed requirement evaluation below.'}
                    </p>
                  </div>
                </div>

                {/* Explanations List */}
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Evaluation Breakdown
                  </h5>
                  <ul className="space-y-2 text-xs">
                    {eligibilityResult.reasons.map((reason, idx) => (
                      <li
                        key={idx}
                        className="flex items-start space-x-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100"
                      >
                        {eligibilityResult.eligible ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        )}
                        <span className="text-slate-700">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Specific missing requirements */}
                {eligibilityResult.missingRequirements && eligibilityResult.missingRequirements.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl">
                    <h5 className="text-xs font-bold text-rose-800 mb-1.5">
                      Missing Qualifications:
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {eligibilityResult.missingRequirements.map((req, idx) => (
                        <span
                          key={idx}
                          className="bg-white text-rose-700 text-xs px-2.5 py-1 rounded-md font-medium border border-rose-200"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                    {onNavigateToProfile && (
                      <button
                        onClick={() => {
                          setSelectedDriveForEligibility(null);
                          onNavigateToProfile();
                        }}
                        className="mt-3 text-xs font-bold text-rose-800 underline hover:text-rose-950 block"
                      >
                        Update your skills and course in "Edit Profile" &rarr;
                      </button>
                    )}
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedDriveForEligibility(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                  >
                    Close
                  </button>

                  {eligibilityResult.eligible && !alreadyAppliedMap.has(selectedDriveForEligibility.id) && (
                    <button
                      onClick={() => handleApply(selectedDriveForEligibility.id)}
                      disabled={applyingDriveId === selectedDriveForEligibility.id}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-700/20"
                    >
                      {applyingDriveId === selectedDriveForEligibility.id ? 'Submitting...' : 'Confirm & Apply'}
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
