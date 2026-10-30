import React, { useState, useEffect } from 'react';
import {
  EmployerCandidateMatchData,
  PlacementDriveData,
  MatchCategory,
  EligibilityStatus,
} from '../../types';
import {
  fetchEmployerJobCandidatesApi,
  fetchEmployerOpportunitiesApi,
} from '../../services/api';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Award,
  RefreshCw,
  Building,
} from 'lucide-react';

interface EmployerCandidateMatchViewProps {
  token?: string | null;
  initialDriveId?: string | null;
}

export const EmployerCandidateMatchView: React.FC<EmployerCandidateMatchViewProps> = ({
  token,
  initialDriveId,
}) => {
  const [drives, setDrives] = useState<PlacementDriveData[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState<string>(initialDriveId || '');
  const [candidates, setCandidates] = useState<EmployerCandidateMatchData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [matchCategoryFilter, setMatchCategoryFilter] = useState<string>('ALL');
  const [eligibilityFilter, setEligibilityFilter] = useState<string>('ALL');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('ALL');

  useEffect(() => {
    loadDrives();
  }, [token]);

  useEffect(() => {
    if (selectedDriveId) {
      loadCandidates();
    }
  }, [selectedDriveId, matchCategoryFilter, eligibilityFilter, verifiedFilter]);

  const loadDrives = async () => {
    if (!token) return;
    try {
      const res = await fetchEmployerOpportunitiesApi(token);
      if (res.success && res.data) {
        setDrives(res.data);
        if (!selectedDriveId && res.data.length > 0) {
          setSelectedDriveId(res.data[0].id);
        }
      }
    } catch {
      // Ignore background load error
    }
  };

  const loadCandidates = async () => {
    if (!token || !selectedDriveId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchEmployerJobCandidatesApi(
        selectedDriveId,
        {
          matchCategory: matchCategoryFilter !== 'ALL' ? matchCategoryFilter : undefined,
          eligibilityStatus: eligibilityFilter !== 'ALL' ? eligibilityFilter : undefined,
          hasVerifiedAssessments:
            verifiedFilter === 'VERIFIED' ? true : verifiedFilter === 'UNVERIFIED' ? false : undefined,
        },
        token
      );

      if (res.success && res.data) {
        setCandidates(res.data.candidates);
      } else {
        setError(res.error?.message || 'Failed to fetch candidate matches.');
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error fetching candidate matches');
    } finally {
      setLoading(false);
    }
  };

  const getMatchCategoryBadge = (category: MatchCategory) => {
    switch (category) {
      case 'EXCELLENT_MATCH':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'STRONG_MATCH':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'MODERATE_MATCH':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'LOW_MATCH':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getEligibilityBadge = (status: EligibilityStatus) => {
    switch (status) {
      case 'ELIGIBLE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'NOT_ELIGIBLE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'NEEDS_VERIFICATION':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'INCOMPLETE_PROFILE':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Candidate Matching Intelligence · Phase 13
          </div>
          <h3 className="text-xl font-bold text-slate-900">Ranked Candidate Compatibility</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate applicant fit using explainable 6-pillar compatibility scores and verified skill assessments.
          </p>
        </div>

        {/* Drive Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Placement Drive:</span>
          <select
            value={selectedDriveId}
            onChange={(e) => setSelectedDriveId(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500"
          >
            {drives.length === 0 ? (
              <option value="">No published drives</option>
            ) : (
              drives.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.organizationName})
                </option>
              ))
            )}
          </select>
          <button
            onClick={loadCandidates}
            className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
            title="Refresh candidate rankings"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter Candidates:</span>
        </div>

        <select
          value={matchCategoryFilter}
          onChange={(e) => setMatchCategoryFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium"
        >
          <option value="ALL">All Match Categories</option>
          <option value="EXCELLENT_MATCH">Excellent Match (85%+)</option>
          <option value="STRONG_MATCH">Strong Match (70-84%)</option>
          <option value="MODERATE_MATCH">Moderate Match (50-69%)</option>
          <option value="LOW_MATCH">Low Match (&lt;50%)</option>
        </select>

        <select
          value={eligibilityFilter}
          onChange={(e) => setEligibilityFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium"
        >
          <option value="ALL">All Eligibility Statuses</option>
          <option value="ELIGIBLE">Eligible Only</option>
          <option value="NOT_ELIGIBLE">Not Eligible</option>
          <option value="INCOMPLETE_PROFILE">Incomplete Profile</option>
        </select>

        <select
          value={verifiedFilter}
          onChange={(e) => setVerifiedFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium"
        >
          <option value="ALL">All Assessment States</option>
          <option value="VERIFIED">Verified Assessments Only</option>
          <option value="UNVERIFIED">Unverified Only</option>
        </select>

        <span className="ml-auto text-slate-500 font-semibold">
          Candidates Found: {candidates.length}
        </span>
      </div>

      {/* Candidate List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Calculating candidate match scores and eligibility...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          {error}
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">No matching candidates</h4>
          <p className="text-xs text-slate-500 mt-1">
            Either no students have applied for this drive yet, or no candidates match your filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((cand) => (
            <div
              key={cand.studentId}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{cand.fullName}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getMatchCategoryBadge(
                        cand.matchCategory
                      )}`}
                    >
                      {cand.matchCategory.replace('_', ' ')}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getEligibilityBadge(
                        cand.eligibilityStatus
                      )}`}
                    >
                      {cand.eligibilityStatus.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>
                      Course: <strong className="text-slate-700">{cand.course || 'Degree'}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Batch: <strong className="text-slate-700">{cand.graduationYear || 'N/A'}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      CGPA: <strong className="text-slate-700">{cand.cgpa !== undefined ? cand.cgpa : 'N/A'}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Application: <strong className="text-slate-700">{cand.applicationStatus || 'APPLIED'}</strong>
                    </span>
                  </div>
                </div>

                {/* Score Pills */}
                <div className="flex items-center gap-3 text-right">
                  <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-center min-w-[80px]">
                    <span className="block text-base font-extrabold text-slate-900">{cand.matchScore}%</span>
                    <span className="text-[10px] text-slate-500 font-medium">Match Fit</span>
                  </div>

                  <div className="bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-center min-w-[80px]">
                    <span className="block text-base font-extrabold text-emerald-700">{cand.readinessScore}/100</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Readiness</span>
                  </div>
                </div>
              </div>

              {/* Skills breakdown */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-400 font-medium text-[11px]">Matching:</span>
                  {cand.matchingSkills.length > 0 ? (
                    cand.matchingSkills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium"
                      >
                        ✓ {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-[11px]">None</span>
                  )}
                </div>

                {cand.hasVerifiedAssessments && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified Skill Tests
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
