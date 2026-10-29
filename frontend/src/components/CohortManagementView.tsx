import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchCohorts,
  createCohortApi,
  archiveCohortApi,
  listCohortStudentsApi,
  enrollStudentApi,
  removeStudentApi,
} from '../services/api';
import { CohortData, CohortStudentSummary } from '../types';
import {
  Users,
  Plus,
  BookOpen,
  Calendar,
  GraduationCap,
  Archive,
  UserPlus,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface CohortManagementViewProps {
  onBack?: () => void;
}

export const CohortManagementView: React.FC<CohortManagementViewProps> = ({ onBack }) => {
  const { token, user } = useAuth();

  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    course: '',
    academicYear: '2025-2026',
    graduationYear: '2026',
    description: '',
  });
  const [createSubmitting, setCreateSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Roster / Member Modal State
  const [selectedCohort, setSelectedCohort] = useState<CohortData | null>(null);
  const [rosterStudents, setRosterStudents] = useState<CohortStudentSummary[]>([]);
  const [loadingRoster, setLoadingRoster] = useState<boolean>(false);
  const [enrollEmail, setEnrollEmail] = useState<string>('');
  const [enrollSubmitting, setEnrollSubmitting] = useState<boolean>(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadCohorts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const filterParam = statusFilter === 'ALL' ? undefined : statusFilter;
    const res = await fetchCohorts(token, filterParam);

    if (res.success && res.data) {
      setCohorts(res.data);
    } else {
      setError(res.error?.message || 'Failed to load cohorts.');
    }
    setLoading(false);
  }, [token, statusFilter]);

  useEffect(() => {
    loadCohorts();
  }, [loadCohorts]);

  // Handle open roster modal
  const openRoster = async (cohort: CohortData) => {
    setSelectedCohort(cohort);
    setLoadingRoster(true);
    setEnrollError(null);
    setEnrollSuccess(null);
    setEnrollEmail('');

    const res = await listCohortStudentsApi(cohort.id, token);
    if (res.success && res.data) {
      setRosterStudents(res.data.students);
    } else {
      setEnrollError(res.error?.message || 'Failed to load student roster.');
    }
    setLoadingRoster(false);
  };

  const handleCreateCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError(null);

    const gradYearNum = createForm.graduationYear ? parseInt(createForm.graduationYear, 10) : undefined;

    const res = await createCohortApi(
      {
        name: createForm.name.trim(),
        course: createForm.course.trim() || undefined,
        academicYear: createForm.academicYear.trim() || undefined,
        graduationYear: gradYearNum,
        description: createForm.description.trim() || undefined,
      },
      token
    );

    if (res.success && res.data) {
      setCohorts((prev) => [res.data!, ...prev]);
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        course: '',
        academicYear: '2025-2026',
        graduationYear: '2026',
        description: '',
      });
    } else {
      setCreateError(res.error?.message || 'Failed to create cohort.');
    }
    setCreateSubmitting(false);
  };

  const handleArchiveCohort = async (cohortId: string) => {
    if (!window.confirm('Are you sure you want to archive this cohort? Active drives restricted to this cohort will be preserved, but new students cannot be enrolled.')) {
      return;
    }

    setActionLoadingId(cohortId);
    const res = await archiveCohortApi(cohortId, token);
    if (res.success && res.data) {
      setCohorts((prev) =>
        prev.map((c) => (c.id === cohortId ? { ...c, status: 'ARCHIVED' } : c))
      );
    } else {
      alert(res.error?.message || 'Failed to archive cohort.');
    }
    setActionLoadingId(null);
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCohort || !enrollEmail.trim()) return;

    setEnrollSubmitting(true);
    setEnrollError(null);
    setEnrollSuccess(null);

    const res = await enrollStudentApi(selectedCohort.id, enrollEmail.trim(), token);
    if (res.success && res.data) {
      setEnrollSuccess(`Successfully enrolled ${res.data.enrolledStudent.fullName} (${res.data.enrolledStudent.email})!`);
      setEnrollEmail('');
      // Reload roster
      const updatedRoster = await listCohortStudentsApi(selectedCohort.id, token);
      if (updatedRoster.success && updatedRoster.data) {
        setRosterStudents(updatedRoster.data.students);
        // update local cohort studentCount
        setCohorts((prev) =>
          prev.map((c) =>
            c.id === selectedCohort.id ? { ...c, studentCount: updatedRoster.data!.students.length } : c
          )
        );
      }
    } else {
      setEnrollError(res.error?.message || 'Failed to enroll student.');
    }
    setEnrollSubmitting(false);
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!selectedCohort) return;
    if (!window.confirm(`Remove ${studentName} from this cohort?`)) return;

    const res = await removeStudentApi(selectedCohort.id, studentId, token);
    if (res.success) {
      setRosterStudents((prev) => prev.filter((s) => s.id !== studentId));
      setCohorts((prev) =>
        prev.map((c) =>
          c.id === selectedCohort.id ? { ...c, studentCount: Math.max(0, c.studentCount - 1) } : c
        )
      );
    } else {
      alert(res.error?.message || 'Failed to remove student.');
    }
  };

  const filteredCohorts = cohorts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.course && c.course.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.academicYear && c.academicYear.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header bar */}
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
              <Users className="w-3.5 h-3.5" />
              <span>COLLEGE PLACEMENT CELL</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">Phase 3: Cohort Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Cohorts & Batches
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Organize students into department batches, manage roster memberships, and map cohorts to placement drives.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadCohorts()}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Refresh Cohorts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-all shadow-md shadow-teal-700/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Cohort</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          {(['ALL', 'ACTIVE', 'ARCHIVED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'ALL' ? 'All Cohorts' : tab === 'ACTIVE' ? 'Active' : 'Archived'}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cohort, course, year..."
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50"
          />
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center space-x-3 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* Cohort Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-teal-600" />
          <p className="text-sm font-medium">Loading institutional cohorts...</p>
        </div>
      ) : filteredCohorts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Cohorts Found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            {searchQuery
              ? 'No cohorts matched your search criteria.'
              : 'Create your first cohort to organize students by degree branch or graduation batch.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Cohort</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCohorts.map((cohort) => (
            <div
              key={cohort.id}
              className={`bg-white rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between ${
                cohort.status === 'ARCHIVED'
                  ? 'border-slate-200 opacity-75'
                  : 'border-slate-200 shadow-xs hover:border-teal-300'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      cohort.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {cohort.status}
                  </span>
                  <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{cohort.studentCount} Students</span>
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">
                  {cohort.name}
                </h3>

                {cohort.description && (
                  <p className="text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed">
                    {cohort.description}
                  </p>
                )}

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  {cohort.course && (
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{cohort.course}</span>
                    </div>
                  )}
                  {cohort.graduationYear && (
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>Class of {cohort.graduationYear}</span>
                    </div>
                  )}
                  {cohort.academicYear && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>AY {cohort.academicYear}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-3 bg-slate-50 rounded-b-2xl border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => openRoster(cohort)}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center space-x-1 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Manage Roster</span>
                </button>

                {cohort.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleArchiveCohort(cohort.id)}
                    disabled={actionLoadingId === cohort.id}
                    className="text-xs text-slate-400 hover:text-amber-600 flex items-center space-x-1 transition-colors"
                    title="Archive Cohort"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archive</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================================================= */}
      {/* CREATE COHORT MODAL */}
      {/* ================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-teal-600 mb-1">
              <Users className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">New Academic Cohort</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create Student Cohort</h2>

            {createError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl mb-4 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCohort} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Cohort Name *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Diploma CSE 2026 Batch"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Degree / Department Branch
                </label>
                <input
                  type="text"
                  value={createForm.course}
                  onChange={(e) => setCreateForm({ ...createForm, course: e.target.value })}
                  placeholder="e.g. Computer Engineering / Mechanical"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    min="1980"
                    max="2040"
                    value={createForm.graduationYear}
                    onChange={(e) => setCreateForm({ ...createForm, graduationYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={createForm.academicYear}
                    onChange={(e) => setCreateForm({ ...createForm, academicYear: e.target.value })}
                    placeholder="2025-2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Cohort Description
                </label>
                <textarea
                  rows={2}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Optional brief description of this student group..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-all shadow-md shadow-teal-700/20 disabled:opacity-50"
                >
                  {createSubmitting ? 'Creating...' : 'Create Cohort'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* COHORT ROSTER & ENROLLMENT MODAL */}
      {/* ================================================= */}
      {selectedCohort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setSelectedCohort(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2 text-teal-600 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Cohort Student Roster</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{selectedCohort.name}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                <span>Course: <strong className="text-slate-700">{selectedCohort.course || 'All'}</strong></span>
                <span>Graduation: <strong className="text-slate-700">{selectedCohort.graduationYear || 'N/A'}</strong></span>
                <span>Total Enrolled: <strong className="text-teal-700">{rosterStudents.length} Students</strong></span>
              </div>
            </div>

            {/* Enroll by email form */}
            {selectedCohort.status === 'ACTIVE' && (
              <form onSubmit={handleEnrollStudent} className="mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center space-x-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-teal-600" />
                  <span>Enroll Student by Registered Email</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="email"
                    required
                    value={enrollEmail}
                    onChange={(e) => setEnrollEmail(e.target.value)}
                    placeholder="student.email@district.edu"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                  <button
                    type="submit"
                    disabled={enrollSubmitting}
                    className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center space-x-1"
                  >
                    <span>{enrollSubmitting ? 'Enrolling...' : 'Enroll Student'}</span>
                  </button>
                </div>

                {enrollError && (
                  <div className="text-xs text-red-600 mt-2 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{enrollError}</span>
                  </div>
                )}
                {enrollSuccess && (
                  <div className="text-xs text-emerald-600 mt-2 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{enrollSuccess}</span>
                  </div>
                )}
              </form>
            )}

            {/* Student Roster List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingRoster ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-teal-600" />
                  <p className="text-xs">Loading cohort members...</p>
                </div>
              ) : rosterStudents.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-600">No students enrolled yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enroll students using their registered email above.
                  </p>
                </div>
              ) : (
                rosterStudents.map((student) => (
                  <div
                    key={student.id}
                    className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {student.fullName}
                        </span>
                        <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono border border-emerald-200">
                          {student.profileCompletionScore}% Ready
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{student.email}</p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                          {student.course}
                        </span>
                        {student.skills && student.skills.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-teal-50 text-teal-800 px-2 py-0.5 rounded font-medium border border-teal-200"
                          >
                            {skill}
                          </span>
                        ))}
                        {student.skills && student.skills.length > 3 && (
                          <span className="text-[10px] text-slate-400">
                            +{student.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {selectedCohort.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleRemoveStudent(student.id, student.fullName)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove student from cohort"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end mt-4">
              <button
                onClick={() => setSelectedCohort(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
