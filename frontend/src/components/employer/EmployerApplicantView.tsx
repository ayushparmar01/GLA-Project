import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchEmployerApplicationsApi,
  fetchOpportunityApplicationsApi,
  updateEmployerCandidateStatusApi,
  scheduleInterviewApi,
  downloadCandidateResumeApi,
} from '../../services/api';
import {
  PlacementApplicationData,
  ApplicationStatus,
  InterviewType,
} from '../../types';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  X,
  RefreshCw,
  Eye,
  GraduationCap,
  Award,
  ChevronRight,
  ShieldCheck,
  Send,
  Link,
  MapPin,
  Download,
  FileText,
  Sparkles,
} from 'lucide-react';
import { EmployerCandidateMatchView } from './EmployerCandidateMatchView';

interface EmployerApplicantViewProps {
  initialDriveId?: string | null;
  onNavigateToInterviews?: () => void;
}

const STATUS_OPTIONS: ApplicationStatus[] = [
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'SELECTED',
  'REJECTED',
];

export const EmployerApplicantView: React.FC<EmployerApplicantViewProps> = ({
  initialDriveId,
  onNavigateToInterviews,
}) => {
  const { token } = useAuth();
  const [applications, setApplications] = useState<PlacementApplicationData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | ApplicationStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected candidate review modal
  const [selectedApplication, setSelectedApplication] = useState<PlacementApplicationData | null>(null);
  const [targetStatus, setTargetStatus] = useState<ApplicationStatus>('SHORTLISTED');
  const [recruiterNote, setRecruiterNote] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [downloadingResume, setDownloadingResume] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Interview scheduling modal within applicant view
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [scheduling, setScheduling] = useState<boolean>(false);
  const [showMatchingIntelligence, setShowMatchingIntelligence] = useState<boolean>(false);
  const [interviewForm, setInterviewForm] = useState({
    interviewRound: 'Technical Round 1',
    interviewType: 'ONLINE' as InterviewType,
    scheduledAt: '',
    durationMinutes: 45,
    meetingLink: 'https://meet.google.com/',
    location: '',
    instructions: 'Please be ready with your code editor and web camera enabled.',
  });

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = initialDriveId
        ? await fetchOpportunityApplicationsApi(initialDriveId, token)
        : await fetchEmployerApplicationsApi(token);

      if (res.success && res.data) {
        setApplications(res.data);
      } else {
        setError(res.error?.message || 'Failed to load candidates.');
      }
    } catch {
      setError('An error occurred while loading candidate applications.');
    } finally {
      setLoading(false);
    }
  }, [initialDriveId, token]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleOpenReview = (app: PlacementApplicationData) => {
    setSelectedApplication(app);
    setTargetStatus(app.status === 'APPLIED' ? 'SHORTLISTED' : app.status);
    setRecruiterNote('');
    setActionError(null);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplication) return;

    setUpdatingStatus(true);
    setActionError(null);

    try {
      const res = await updateEmployerCandidateStatusApi(
        selectedApplication.id,
        {
          status: targetStatus,
          note: recruiterNote.trim() || undefined,
        },
        token
      );

      if (res.success && res.data) {
        setSuccessMessage(`Candidate status updated to ${targetStatus.replace('_', ' ')}.`);
        setSelectedApplication(res.data);
        loadApplications();
      } else {
        setActionError(res.error?.message || 'Failed to update candidate status.');
      }
    } catch {
      setActionError('An error occurred during status transition.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplication) return;

    if (!interviewForm.scheduledAt) {
      setActionError('Interview date and time is required.');
      return;
    }

    if (interviewForm.interviewType === 'ONLINE' && !interviewForm.meetingLink) {
      setActionError('Meeting link URL is required for online interviews.');
      return;
    }

    if (interviewForm.interviewType === 'OFFLINE' && !interviewForm.location) {
      setActionError('Physical location / room is required for offline interviews.');
      return;
    }

    setScheduling(true);
    setActionError(null);

    try {
      const res = await scheduleInterviewApi(
        selectedApplication.id,
        {
          interviewRound: interviewForm.interviewRound.trim(),
          interviewType: interviewForm.interviewType,
          scheduledAt: new Date(interviewForm.scheduledAt).toISOString(),
          durationMinutes: interviewForm.durationMinutes,
          meetingLink: interviewForm.interviewType === 'ONLINE' ? interviewForm.meetingLink.trim() : undefined,
          location: interviewForm.interviewType === 'OFFLINE' ? interviewForm.location.trim() : undefined,
          instructions: interviewForm.instructions.trim() || undefined,
        },
        token
      );

      if (res.success && res.data) {
        setSuccessMessage('Interview scheduled successfully! Candidate has been updated to INTERVIEW_SCHEDULED.');
        setShowScheduleModal(false);
        loadApplications();
      } else {
        setActionError(res.error?.message || 'Failed to schedule interview.');
      }
    } catch {
      setActionError('An error occurred while scheduling interview.');
    } finally {
      setScheduling(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const studentName = app.student?.fullName || '';
    const studentCourse = app.student?.studentProfile?.course || '';
    const driveTitle = app.drive?.title || '';
    const matchesSearch =
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      studentCourse.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driveTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'SELECTED':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'SHORTLISTED':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'INTERVIEW_SCHEDULED':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
      case 'WITHDRAWN':
        return 'bg-slate-800 text-slate-500 border border-slate-700';
      default:
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" />
            Recruiter Candidate Desk
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Review applicant profiles, shortlist candidates, and schedule interview rounds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowMatchingIntelligence(!showMatchingIntelligence)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            {showMatchingIntelligence ? 'Application Roster' : 'AI Candidate Matching'}
          </button>

          {onNavigateToInterviews && (
            <button
              onClick={onNavigateToInterviews}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition-all border border-slate-700 flex items-center gap-2 self-start sm:self-auto"
            >
              <Calendar className="w-4 h-4 text-purple-400" />
              View Scheduled Interviews
            </button>
          )}
        </div>
      </div>

      {showMatchingIntelligence ? (
        <EmployerCandidateMatchView token={token} initialDriveId={initialDriveId} />
      ) : (
        <>

      {/* Global Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {(['ALL', 'APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED'] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            )
          )}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by student name, course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Applications Table / Cards */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm">Loading candidates...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-white font-semibold">No candidate submissions found</div>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL'
              ? 'No applicants match the current filter criteria.'
              : 'When students apply for your published opportunities, their submissions will appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/80 text-slate-400 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">Target Opportunity</th>
                  <th className="px-6 py-4">Degree & Skills</th>
                  <th className="px-6 py-4">Applied Date</th>
                  <th className="px-6 py-4">Stage</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">
                        {app.student?.fullName || 'Anonymous Candidate'}
                      </div>
                      <div className="text-xs text-slate-500">{app.student?.email}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200">
                        {app.drive?.title || 'Recruitment Drive'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {app.drive?.opportunityType} • {app.drive?.workMode}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-300">
                        {app.student?.studentProfile?.course || 'Technical Degree'}
                        {app.student?.studentProfile?.graduationYear &&
                          ` (${app.student.studentProfile.graduationYear})`}
                      </div>
                      {app.student?.studentProfile?.skills && app.student.studentProfile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {app.student.studentProfile.skills.slice(0, 3).map((sk, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusBadge(
                          app.status
                        )}`}
                      >
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenReview(app)}
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Candidate Review & Stage Transition Modal */}
      {selectedApplication && !showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 lg:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Review Candidate: {selectedApplication.student?.fullName}
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Applied for <span className="text-slate-200 font-semibold">{selectedApplication.drive?.title}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedApplication(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Candidate Profile Details (Phone number omitted) */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-white text-sm">Academic Profile</div>
                <div className="text-xs text-indigo-400 font-semibold">
                  Profile Score: {selectedApplication.student?.studentProfile?.profileCompletionScore ?? 100}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                <div>
                  <span className="text-slate-500">Degree/Course:</span>{' '}
                  <span className="font-medium text-slate-200">
                    {selectedApplication.student?.studentProfile?.course || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Graduation Year:</span>{' '}
                  <span className="font-medium text-slate-200">
                    {selectedApplication.student?.studentProfile?.graduationYear || '2026'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Email:</span>{' '}
                  <span className="font-medium text-slate-200">{selectedApplication.student?.email}</span>
                </div>
                <div>
                  <span className="text-slate-500">Privacy Status:</span>{' '}
                  <span className="text-emerald-400 font-medium">Protected (Direct Chat/Interview)</span>
                </div>
              </div>

              {selectedApplication.student?.studentProfile?.skills && (
                <div>
                  <span className="text-xs text-slate-500 block mb-1.5">Verified Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApplication.student.studentProfile.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Phase 5: Verified Candidate ATS Resume Download */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedApplication) return;
                    setDownloadingResume(true);
                    await downloadCandidateResumeApi(
                      selectedApplication.id,
                      selectedApplication.student?.fullName || 'Candidate',
                      token
                    );
                    setDownloadingResume(false);
                  }}
                  disabled={downloadingResume}
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl py-2 px-3 text-xs font-semibold transition disabled:opacity-50"
                >
                  {downloadingResume ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  Download Verified Candidate Resume (ATS PDF)
                </button>
              </div>
            </div>

            {/* Stage Transition Form */}
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Update Recruitment Stage
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as ApplicationStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Recruiter Evaluation Note (Internal Audit Log)
                </label>
                <textarea
                  rows={3}
                  value={recruiterNote}
                  onChange={(e) => setRecruiterNote(e.target.value)}
                  placeholder="e.g. Strong foundational knowledge in web fundamentals. Cleared initial screening."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(true)}
                  className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule Interview
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedApplication(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
                  >
                    {updatingStatus ? 'Updating...' : 'Save Stage'}
                  </button>
                </div>
              </div>
            </form>

            {/* Audit History Timeline */}
            {selectedApplication.statusHistory && selectedApplication.statusHistory.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Recruitment Audit Trail
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedApplication.statusHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-950/40 border border-slate-800/60 rounded-lg text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="font-semibold text-slate-200">
                          {item.fromStatus} → {item.toStatus}
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          {new Date(item.changedAt).toLocaleString()}
                        </span>
                      </div>
                      {item.note && <p className="text-slate-400 text-[11px] italic">"{item.note}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleModal && selectedApplication && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 lg:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Schedule Interview</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  For {selectedApplication.student?.fullName} ({selectedApplication.drive?.title})
                </p>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleScheduleInterview} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Interview Round Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={interviewForm.interviewRound}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({ ...prev, interviewRound: e.target.value }))
                  }
                  placeholder="e.g. Technical Round 1, Culture Fit"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Interview Type
                  </label>
                  <select
                    value={interviewForm.interviewType}
                    onChange={(e) =>
                      setInterviewForm((prev) => ({
                        ...prev,
                        interviewType: e.target.value as InterviewType,
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="ONLINE">Online Meeting</option>
                    <option value="OFFLINE">Offline / Campus</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="240"
                    value={interviewForm.durationMinutes}
                    onChange={(e) =>
                      setInterviewForm((prev) => ({
                        ...prev,
                        durationMinutes: parseInt(e.target.value) || 30,
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Scheduled Date & Time <span className="text-rose-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={interviewForm.scheduledAt}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({ ...prev, scheduledAt: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              {interviewForm.interviewType === 'ONLINE' ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Meeting Link URL <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="url"
                    value={interviewForm.meetingLink}
                    onChange={(e) =>
                      setInterviewForm((prev) => ({ ...prev, meetingLink: e.target.value }))
                    }
                    placeholder="https://meet.google.com/xyz-abcd-efg"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Physical Campus Location / Room <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={interviewForm.location}
                    onChange={(e) =>
                      setInterviewForm((prev) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="e.g. Placement Cell Conference Room 102"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Instructions for Candidate
                </label>
                <textarea
                  rows={2}
                  value={interviewForm.instructions}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({ ...prev, instructions: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  {scheduling ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};
