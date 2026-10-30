import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchDrives,
  createDriveApi,
  publishDriveApi,
  closeDriveApi,
  cancelDriveApi,
  fetchDriveApplicationsApi,
  updateApplicationStatusApi,
  fetchCohorts,
} from '../services/api';
import {
  PlacementDriveData,
  PlacementApplicationData,
  CohortData,
  OpportunityType,
  WorkMode,
  DriveStatus,
  ApplicationStatus,
} from '../types';
import {
  Briefcase,
  Plus,
  Send,
  XCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  X,
  FileText,
  Building,
  Check,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

interface DriveManagementViewProps {
  onBack?: () => void;
}

export const DriveManagementView: React.FC<DriveManagementViewProps> = ({ onBack }) => {
  const { token } = useAuth();

  const [drives, setDrives] = useState<PlacementDriveData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | DriveStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Available college cohorts for targeting
  const [availableCohorts, setAvailableCohorts] = useState<CohortData[]>([]);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    organizationName: '',
    description: '',
    opportunityType: 'JOB' as OpportunityType,
    workMode: 'ONSITE' as WorkMode,
    location: 'Pan-India',
    applicationDeadline: '',
    driveDate: '',
    eligibleCourses: 'Diploma in Computer Science, B.Tech CSE, IT',
    eligibleGraduationYears: '2026, 2027',
    requiredSkills: 'JavaScript, React, Node.js, SQL',
    selectedCohortIds: [] as string[],
  });
  const [createSubmitting, setCreateSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Applications Drawer / Modal
  const [selectedDrive, setSelectedDrive] = useState<PlacementDriveData | null>(null);
  const [driveApplications, setDriveApplications] = useState<PlacementApplicationData[]>([]);
  const [loadingApps, setLoadingApps] = useState<boolean>(false);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadDrives = useCallback(async () => {
    setLoading(true);
    setError(null);
    const filterParam = statusFilter === 'ALL' ? undefined : statusFilter;
    const res = await fetchDrives(token, filterParam);

    if (res.success && res.data) {
      setDrives(res.data);
    } else {
      setError(res.error?.message || 'Failed to load placement drives.');
    }
    setLoading(false);
  }, [token, statusFilter]);

  const loadCohortsList = useCallback(async () => {
    const res = await fetchCohorts(token, 'ACTIVE');
    if (res.success && res.data) {
      setAvailableCohorts(res.data);
    }
  }, [token]);

  useEffect(() => {
    loadDrives();
    loadCohortsList();
  }, [loadDrives, loadCohortsList]);

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError(null);

    const coursesArray = createForm.eligibleCourses
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const gradYearsArray = createForm.eligibleGraduationYears
      .split(',')
      .map((y) => parseInt(y.trim(), 10))
      .filter((y) => !isNaN(y) && y >= 1980 && y <= 2040);

    const skillsArray = createForm.requiredSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await createDriveApi(
      {
        title: createForm.title.trim(),
        organizationName: createForm.organizationName.trim(),
        description: createForm.description.trim(),
        opportunityType: createForm.opportunityType,
        workMode: createForm.workMode,
        location: createForm.location.trim() || 'Pan-India',
        applicationDeadline: createForm.applicationDeadline,
        driveDate: createForm.driveDate || undefined,
        eligibleCourses: coursesArray,
        eligibleGraduationYears: gradYearsArray,
        requiredSkills: skillsArray,
        cohortIds: createForm.selectedCohortIds,
      },
      token
    );

    if (res.success && res.data) {
      setDrives((prev) => [res.data!, ...prev]);
      setShowCreateModal(false);
      setCreateForm({
        title: '',
        organizationName: '',
        description: '',
        opportunityType: 'JOB',
        workMode: 'ONSITE',
        location: 'Pan-India',
        applicationDeadline: '',
        driveDate: '',
        eligibleCourses: 'Diploma in Computer Science, B.Tech CSE, IT',
        eligibleGraduationYears: '2026, 2027',
        requiredSkills: 'JavaScript, React, Node.js, SQL',
        selectedCohortIds: [],
      });
    } else {
      setCreateError(res.error?.message || 'Failed to create placement drive.');
    }
    setCreateSubmitting(false);
  };

  const handlePublishDrive = async (driveId: string) => {
    const res = await publishDriveApi(driveId, token);
    if (res.success && res.data) {
      setDrives((prev) => prev.map((d) => (d.id === driveId ? res.data! : d)));
    } else {
      alert(res.error?.message || 'Failed to publish drive.');
    }
  };

  const handleCloseDrive = async (driveId: string) => {
    if (!window.confirm('Close this placement drive? Students will no longer be able to apply.')) return;
    const res = await closeDriveApi(driveId, token);
    if (res.success && res.data) {
      setDrives((prev) => prev.map((d) => (d.id === driveId ? res.data! : d)));
    } else {
      alert(res.error?.message || 'Failed to close drive.');
    }
  };

  const handleCancelDrive = async (driveId: string) => {
    if (!window.confirm('Are you sure you want to cancel this placement drive?')) return;
    const res = await cancelDriveApi(driveId, token);
    if (res.success && res.data) {
      setDrives((prev) => prev.map((d) => (d.id === driveId ? res.data! : d)));
    } else {
      alert(res.error?.message || 'Failed to cancel drive.');
    }
  };

  // Open Applications Review Modal
  const openApplications = async (drive: PlacementDriveData) => {
    setSelectedDrive(drive);
    setLoadingApps(true);
    setActionError(null);

    const res = await fetchDriveApplicationsApi(drive.id, token);
    if (res.success && res.data) {
      setDriveApplications(res.data.applications);
    } else {
      setActionError(res.error?.message || 'Failed to load candidates.');
    }
    setLoadingApps(false);
  };

  const handleUpdateStatus = async (applicationId: string, newStatus: ApplicationStatus) => {
    setUpdatingAppId(applicationId);
    setActionError(null);

    const note = prompt(`Enter optional review note for transitioning to ${newStatus}:`) || undefined;

    const res = await updateApplicationStatusApi(applicationId, newStatus, note, token);
    if (res.success && res.data) {
      setDriveApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? res.data! : app))
      );
    } else {
      alert(res.error?.message || 'Failed to update candidate status.');
    }
    setUpdatingAppId(null);
  };

  const filteredDrives = drives.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.location && d.location.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const getStatusBadge = (status: DriveStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'DRAFT':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'CLOSED':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-800 border-rose-200';
    }
  };

  const getAppStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'APPLIED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SHORTLISTED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'INTERVIEW_SCHEDULED':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'SELECTED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold';
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
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
              <Briefcase className="w-3.5 h-3.5" />
              <span>COLLEGE PLACEMENT HUB</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">Phase 3: Drive Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Campus Placement Drives
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Publish recruitment opportunities, scope to cohorts, monitor applications, and manage student selection workflows.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadDrives()}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Refresh Drives"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-all shadow-md shadow-teal-700/20"
          >
            <Plus className="w-4 h-4" />
            <span>Post Placement Drive</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'PUBLISHED', 'DRAFT', 'CLOSED', 'CANCELLED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'ALL' ? 'All Drives' : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search drive title, company..."
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center space-x-3 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* Drives Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-teal-600" />
          <p className="text-sm font-medium">Loading placement drives...</p>
        </div>
      ) : filteredDrives.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Placement Drives</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            {searchQuery
              ? 'No drives matched your search.'
              : 'Post your first placement or internship opportunity to connect students with employers.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Post First Drive</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrives.map((drive) => {
            const isDeadlinePassed = new Date(drive.applicationDeadline) < new Date();
            return (
              <div
                key={drive.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between"
              >
                <div className="p-6">
                  {/* Top badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(
                        drive.status
                      )}`}
                    >
                      {drive.status}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                      {drive.opportunityType}
                    </span>
                  </div>

                  {/* Company & Title */}
                  <div className="text-xs font-semibold text-teal-700 mb-1 flex items-center space-x-1">
                    <Building className="w-3.5 h-3.5" />
                    <span>{drive.organizationName}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                    {drive.title}
                  </h3>

                  <p className="text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed">
                    {drive.description}
                  </p>

                  {/* Criteria metadata */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>
                        Deadline:{' '}
                        <strong className={isDeadlinePassed ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                          {new Date(drive.applicationDeadline).toLocaleDateString()}
                        </strong>
                        {isDeadlinePassed && ' (Expired)'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{drive.location || 'Pan-India'} ({drive.workMode})</span>
                    </div>

                    {drive.requiredSkills && drive.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {drive.requiredSkills.slice(0, 3).map((s, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-medium"
                          >
                            {s}
                          </span>
                        ))}
                        {drive.requiredSkills.length > 3 && (
                          <span className="text-[10px] text-slate-400">
                            +{drive.requiredSkills.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="px-6 py-3 bg-slate-50 rounded-b-2xl border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openApplications(drive)}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center space-x-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{drive.applicationCount ?? 0} Applications</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    {drive.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePublishDrive(drive.id)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors"
                        title="Publish Drive"
                      >
                        Publish
                      </button>
                    )}
                    {drive.status === 'PUBLISHED' && (
                      <button
                        onClick={() => handleCloseDrive(drive.id)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                        title="Close Drive"
                      >
                        Close
                      </button>
                    )}
                    {(drive.status === 'DRAFT' || drive.status === 'PUBLISHED') && (
                      <button
                        onClick={() => handleCancelDrive(drive.id)}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors"
                        title="Cancel Drive"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================= */}
      {/* POST PLACEMENT DRIVE MODAL */}
      {/* ================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-teal-600 mb-1">
              <Briefcase className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">New Opportunity</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Post Placement Drive</h2>

            {createError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl mb-4 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDrive} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Drive Title *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Associate Software Engineer"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Hiring Organization *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.organizationName}
                    onChange={(e) => setCreateForm({ ...createForm, organizationName: e.target.value })}
                    placeholder="e.g. Infosys / BharatTech"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Opportunity Type
                  </label>
                  <select
                    value={createForm.opportunityType}
                    onChange={(e) => setCreateForm({ ...createForm, opportunityType: e.target.value as OpportunityType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="JOB">Full-Time Job</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="APPRENTICESHIP">Apprenticeship</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Work Mode
                  </label>
                  <select
                    value={createForm.workMode}
                    onChange={(e) => setCreateForm({ ...createForm, workMode: e.target.value as WorkMode })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="ONSITE">Onsite</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="REMOTE">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={createForm.location}
                    onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                    placeholder="e.g. Pune / Nagpur / Pan-India"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Application Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.applicationDeadline}
                    onChange={(e) => setCreateForm({ ...createForm, applicationDeadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Drive Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={createForm.driveDate}
                    onChange={(e) => setCreateForm({ ...createForm, driveDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Eligible Courses (comma-separated)
                </label>
                <input
                  type="text"
                  value={createForm.eligibleCourses}
                  onChange={(e) => setCreateForm({ ...createForm, eligibleCourses: e.target.value })}
                  placeholder="e.g. Diploma in Computer Engineering, B.Tech CSE"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Graduation Years (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={createForm.eligibleGraduationYears}
                    onChange={(e) => setCreateForm({ ...createForm, eligibleGraduationYears: e.target.value })}
                    placeholder="2026, 2027"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Required Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={createForm.requiredSkills}
                    onChange={(e) => setCreateForm({ ...createForm, requiredSkills: e.target.value })}
                    placeholder="JavaScript, SQL, Python"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Cohort Scoping Checkboxes */}
              {availableCohorts.length > 0 && (
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Restrict to Specific Cohorts (Optional - leave empty for all students)
                  </label>
                  <div className="max-h-28 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5 bg-slate-50">
                    {availableCohorts.map((cohort) => {
                      const isChecked = createForm.selectedCohortIds.includes(cohort.id);
                      return (
                        <label
                          key={cohort.id}
                          className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-100 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCreateForm({
                                  ...createForm,
                                  selectedCohortIds: [...createForm.selectedCohortIds, cohort.id],
                                });
                              } else {
                                setCreateForm({
                                  ...createForm,
                                  selectedCohortIds: createForm.selectedCohortIds.filter((id) => id !== cohort.id),
                                });
                              }
                            }}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="font-medium">{cohort.name}</span>
                          <span className="text-[10px] text-slate-400">({cohort.studentCount} students)</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Drive Description & Eligibility Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Detail responsibilities, selection rounds, and compensation..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-all shadow-md shadow-teal-700/20 disabled:opacity-50"
                >
                  {createSubmitting ? 'Saving Draft...' : 'Save Drive (Draft)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* CANDIDATES REVIEW DRAWER / MODAL */}
      {/* ================================================= */}
      {selectedDrive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setSelectedDrive(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2 text-teal-600 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Applicant Review Desk</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{selectedDrive.title}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                <span>Company: <strong className="text-slate-700">{selectedDrive.organizationName}</strong></span>
                <span>Applications: <strong className="text-teal-700">{driveApplications.length} Candidates</strong></span>
                <span>Drive Status: <strong className="text-slate-700">{selectedDrive.status}</strong></span>
              </div>
            </div>

            {/* Candidates list */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingApps ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-teal-600" />
                  <p className="text-xs">Loading applicants...</p>
                </div>
              ) : driveApplications.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-600">No applications received yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ensure the drive is PUBLISHED so students can discover and apply.
                  </p>
                </div>
              ) : (
                driveApplications.map((app) => {
                  const student = app.student;
                  return (
                    <div
                      key={app.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-slate-900">
                              {student?.fullName || 'Student Applicant'}
                            </span>
                            <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${getAppStatusBadge(app.status)}`}>
                              {app.status}
                            </span>
                            {student?.studentProfile?.profileCompletionScore !== undefined && (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {student.studentProfile.profileCompletionScore}% Ready
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{student?.email}</p>
                        </div>

                        {/* Status transition action buttons */}
                        <div className="flex items-center flex-wrap gap-1.5">
                          {app.status === 'APPLIED' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(app.id, 'SHORTLISTED')}
                                disabled={updatingAppId === app.id}
                                className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-semibold transition-colors"
                              >
                                Shortlist
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                                disabled={updatingAppId === app.id}
                                className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {app.status === 'SHORTLISTED' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(app.id, 'INTERVIEW_SCHEDULED')}
                                disabled={updatingAppId === app.id}
                                className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition-colors"
                              >
                                Schedule Interview
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                                disabled={updatingAppId === app.id}
                                className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {app.status === 'INTERVIEW_SCHEDULED' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(app.id, 'SELECTED')}
                                disabled={updatingAppId === app.id}
                                className="px-2.5 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition-colors"
                              >
                                Select Candidate
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                                disabled={updatingAppId === app.id}
                                className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Candidate profile summary */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                        <span>Course: <strong className="text-slate-800">{student?.studentProfile?.course || 'General'}</strong></span>
                        <span>Graduation: <strong className="text-slate-800">{student?.studentProfile?.graduationYear || 'N/A'}</strong></span>
                        {student?.studentProfile?.skills && student.studentProfile.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {student.studentProfile.skills.map((s, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Status history audit trail preview */}
                      {app.statusHistory && app.statusHistory.length > 1 && (
                        <div className="mt-2 text-[11px] text-slate-400 italic">
                          Latest Transition: {app.statusHistory[app.statusHistory.length - 1].fromStatus} &rarr;{' '}
                          {app.statusHistory[app.statusHistory.length - 1].toStatus} on{' '}
                          {new Date(app.statusHistory[app.statusHistory.length - 1].changedAt).toLocaleDateString()}
                          {app.statusHistory[app.statusHistory.length - 1].note && (
                            <span> (Note: "{app.statusHistory[app.statusHistory.length - 1].note}")</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end mt-4">
              <button
                onClick={() => setSelectedDrive(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Close Desk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
