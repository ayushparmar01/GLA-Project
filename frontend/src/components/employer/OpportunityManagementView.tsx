import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchEmployerOpportunitiesApi,
  createEmployerOpportunityApi,
  publishEmployerOpportunityApi,
  closeEmployerOpportunityApi,
  cancelEmployerOpportunityApi,
} from '../../services/api';
import {
  PlacementDriveData,
  DriveStatus,
  OpportunityType,
  WorkMode,
} from '../../types';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  X,
  Send,
  Layers,
  GraduationCap,
} from 'lucide-react';

interface OpportunityManagementViewProps {
  onSelectDriveApplicants?: (driveId: string) => void;
}

export const OpportunityManagementView: React.FC<OpportunityManagementViewProps> = ({
  onSelectDriveApplicants,
}) => {
  const { token, user } = useAuth();
  const [opportunities, setOpportunities] = useState<PlacementDriveData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter State
  const [statusFilter, setStatusFilter] = useState<'ALL' | DriveStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    opportunityType: 'JOB' as OpportunityType,
    workMode: 'ONSITE' as WorkMode,
    location: '',
    description: '',
    requiredSkills: '',
    preferredSkills: '',
    minimumQualification: 'B.Tech / B.E. / BCA / MCA / Diploma',
    minimumCGPA: 6.0,
    salaryRange: '₹3.5 - 6.0 LPA',
    internshipDuration: '6 Months',
    numberOfOpenings: 5,
    applicationDeadline: '',
    recruitmentProcess: '1. Online Assessment\n2. Technical Round\n3. HR Round',
  });

  const loadOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchEmployerOpportunitiesApi(token);
      if (res.success && res.data) {
        setOpportunities(res.data);
      } else {
        setError(res.error?.message || 'Failed to fetch opportunities.');
      }
    } catch {
      setError('An error occurred while loading opportunities.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'minimumCGPA' || name === 'numberOfOpenings' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim() || formData.title.trim().length < 3) {
      setFormError('Job title is required (minimum 3 characters).');
      return;
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setFormError('Description is required (minimum 10 characters).');
      return;
    }

    if (!formData.applicationDeadline) {
      setFormError('Application deadline is required.');
      return;
    }

    const deadlineDate = new Date(formData.applicationDeadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate.getTime() <= Date.now()) {
      setFormError('Application deadline must be a valid future date.');
      return;
    }

    setCreating(true);
    try {
      const payload: Partial<PlacementDriveData> = {
        title: formData.title.trim(),
        opportunityType: formData.opportunityType,
        workMode: formData.workMode,
        location: formData.location.trim() || 'Pan-India',
        description: formData.description.trim(),
        requiredSkills: formData.requiredSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        preferredSkills: formData.preferredSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        minimumQualification: formData.minimumQualification.trim(),
        minimumCGPA: formData.minimumCGPA,
        salaryRange: formData.salaryRange.trim(),
        internshipDuration: formData.internshipDuration.trim(),
        numberOfOpenings: formData.numberOfOpenings,
        applicationDeadline: new Date(formData.applicationDeadline).toISOString(),
        recruitmentProcess: formData.recruitmentProcess
          .split('\n')
          .map((p) => p.trim())
          .filter(Boolean),
      };

      const res = await createEmployerOpportunityApi(payload, token);
      if (res.success && res.data) {
        setShowCreateModal(false);
        setSuccessMessage('Opportunity created as draft. You can publish it when ready.');
        loadOpportunities();
      } else {
        setFormError(res.error?.message || 'Failed to create opportunity.');
      }
    } catch {
      setFormError('An error occurred during submission.');
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async (driveId: string) => {
    setActionLoadingId(driveId);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await publishEmployerOpportunityApi(driveId, token);
      if (res.success) {
        setSuccessMessage('Opportunity published successfully! Students can now view and apply.');
        loadOpportunities();
      } else {
        setError(res.error?.message || 'Failed to publish opportunity.');
      }
    } catch {
      setError('An error occurred while publishing.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleClose = async (driveId: string) => {
    if (!window.confirm('Are you sure you want to close this opportunity to new applications?')) return;
    setActionLoadingId(driveId);
    try {
      const res = await closeEmployerOpportunityApi(driveId, token);
      if (res.success) {
        setSuccessMessage('Opportunity marked as closed.');
        loadOpportunities();
      } else {
        setError(res.error?.message || 'Failed to close opportunity.');
      }
    } catch {
      setError('An error occurred while closing.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (driveId: string) => {
    if (!window.confirm('Are you sure you want to cancel this opportunity? This cannot be undone.')) return;
    setActionLoadingId(driveId);
    try {
      const res = await cancelEmployerOpportunityApi(driveId, token);
      if (res.success) {
        setSuccessMessage('Opportunity cancelled.');
        loadOpportunities();
      } else {
        setError(res.error?.message || 'Failed to cancel opportunity.');
      }
    } catch {
      setError('An error occurred while cancelling.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesStatus = statusFilter === 'ALL' || opp.status === statusFilter;
    const matchesSearch =
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.workMode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-indigo-400" />
            Recruitment Opportunities
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Post and manage campus hiring drives, job postings, and internships.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Post New Opportunity
        </button>
      </div>

      {/* Alerts */}
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
          {(['ALL', 'PUBLISHED', 'DRAFT', 'CLOSED', 'CANCELLED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title, skills, mode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Opportunity Cards List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm">Loading opportunities...</p>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Briefcase className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-white font-semibold">No opportunities found</div>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Try adjusting your search query or filter criteria.'
              : 'Post your first recruitment opportunity to start hiring students.'}
          </p>
          {statusFilter === 'ALL' && !searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 mt-2"
            >
              <Plus className="w-4 h-4" /> Post Opportunity
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 space-y-4 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[11px] font-semibold tracking-wider uppercase border border-indigo-500/20">
                      {opp.opportunityType}
                    </span>
                    <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">
                      {opp.title}
                    </h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase ${
                      opp.status === 'PUBLISHED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : opp.status === 'DRAFT'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {opp.status}
                  </span>
                </div>

                <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                  {opp.description}
                </p>

                {/* Badges / Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span>{opp.workMode} {opp.location ? `• ${opp.location}` : ''}</span>
                  </div>
                  {opp.salaryRange && (
                    <div className="flex items-center gap-1.5 truncate">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>{opp.salaryRange}</span>
                    </div>
                  )}
                  {opp.minimumCGPA !== undefined && (
                    <div className="flex items-center gap-1.5 truncate">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>Min CGPA: {opp.minimumCGPA}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 truncate">
                    <Clock className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    <span>Deadline: {new Date(opp.applicationDeadline).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Skills Preview */}
                {opp.requiredSkills && opp.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {opp.requiredSkills.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {opp.requiredSkills.length > 4 && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800/50 text-slate-500 text-[10px]">
                        +{opp.requiredSkills.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectDriveApplicants?.(opp.id)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  View Applicants ({opp.applicationCount ?? 0})
                </button>

                <div className="flex items-center gap-2">
                  {opp.status === 'DRAFT' && (
                    <button
                      onClick={() => handlePublish(opp.id)}
                      disabled={actionLoadingId === opp.id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Publish
                    </button>
                  )}

                  {opp.status === 'PUBLISHED' && (
                    <>
                      <button
                        onClick={() => handleClose(opp.id)}
                        disabled={actionLoadingId === opp.id}
                        className="px-2.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        title="Close applications"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => handleCancel(opp.id)}
                        disabled={actionLoadingId === opp.id}
                        className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        title="Cancel opportunity"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Opportunity Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 lg:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Post New Opportunity</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Creates a recruitment drive visible to partner college students once published.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateOpportunity} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Opportunity Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Associate Software Engineer, Cloud Trainee"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Opportunity Type
                  </label>
                  <select
                    name="opportunityType"
                    value={formData.opportunityType}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="JOB">Full Time Job</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="APPRENTICESHIP">Apprenticeship</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Work Mode
                  </label>
                  <select
                    name="workMode"
                    value={formData.workMode}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ONSITE">Onsite</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="REMOTE">Fully Remote</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Work Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Pune, Bengaluru, Remote"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Salary / Compensation
                  </label>
                  <input
                    type="text"
                    name="salaryRange"
                    value={formData.salaryRange}
                    onChange={handleInputChange}
                    placeholder="e.g. ₹4.0 - 6.5 LPA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Job Description <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Outline responsibilities, tech stack, and ideal background..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                    required
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Required Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    name="requiredSkills"
                    value={formData.requiredSkills}
                    onChange={handleInputChange}
                    placeholder="e.g. React, TypeScript, Node.js, SQL"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Minimum CGPA (0 - 10)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    name="minimumCGPA"
                    value={formData.minimumCGPA}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Number of Openings
                  </label>
                  <input
                    type="number"
                    min="1"
                    name="numberOfOpenings"
                    value={formData.numberOfOpenings}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Application Deadline <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="applicationDeadline"
                    value={formData.applicationDeadline}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {creating ? 'Creating...' : 'Create Draft Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
