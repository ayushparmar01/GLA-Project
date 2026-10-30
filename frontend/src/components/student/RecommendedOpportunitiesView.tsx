import React, { useState, useEffect } from 'react';
import {
  JobRecommendationData,
  MatchCategory,
  EligibilityStatus,
} from '../../types';
import {
  fetchRecommendedJobsApi,
  refreshRecommendationsApi,
} from '../../services/api';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  MapPin,
  Building,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Award,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';

interface RecommendedOpportunitiesViewProps {
  token?: string | null;
  onApplyToDrive?: (driveId: string) => void;
  onViewDriveDetails?: (driveId: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const RecommendedOpportunitiesView: React.FC<RecommendedOpportunitiesViewProps> = ({
  token,
  onApplyToDrive,
  onViewDriveDetails,
  onNavigateToTab,
}) => {
  const [recommendations, setRecommendations] = useState<JobRecommendationData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [readinessScore, setReadinessScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [matchCategoryFilter, setMatchCategoryFilter] = useState<string>('ALL');
  const [eligibilityFilter, setEligibilityFilter] = useState<string>('ALL');
  const [workModeFilter, setWorkModeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'matchScore' | 'deadline' | 'latest'>('matchScore');

  // Expanded explanations
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, [token, matchCategoryFilter, eligibilityFilter, workModeFilter, sortBy]);

  const loadRecommendations = async (isRefresh: boolean = false) => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      if (isRefresh) {
        await refreshRecommendationsApi(token);
      }

      const res = await fetchRecommendedJobsApi(
        {
          role: searchQuery.trim() || undefined,
          matchCategory: matchCategoryFilter !== 'ALL' ? matchCategoryFilter : undefined,
          eligibilityStatus: eligibilityFilter !== 'ALL' ? eligibilityFilter : undefined,
          workMode: workModeFilter !== 'ALL' ? workModeFilter : undefined,
          sortBy,
          limit: 50,
        },
        token
      );

      if (res.success && res.data) {
        setRecommendations(res.data.recommendations);
        setTotalCount(res.data.total);
        setReadinessScore(res.data.readinessScore);
      } else {
        setError(res.error?.message || 'Failed to fetch recommendations.');
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error fetching recommendations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRecommendations();
  };

  const getMatchCategoryBadge = (category: MatchCategory) => {
    switch (category) {
      case 'EXCELLENT_MATCH':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          label: 'Excellent Match (85%+)',
          bar: 'bg-emerald-500',
        };
      case 'STRONG_MATCH':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-300',
          label: 'Strong Match (70-84%)',
          bar: 'bg-blue-500',
        };
      case 'MODERATE_MATCH':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          label: 'Moderate Match (50-69%)',
          bar: 'bg-amber-500',
        };
      case 'LOW_MATCH':
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-300',
          label: 'Low Match (<50%)',
          bar: 'bg-slate-400',
        };
    }
  };

  const getEligibilityBadge = (status: EligibilityStatus) => {
    switch (status) {
      case 'ELIGIBLE':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />,
          label: 'Eligible to Apply',
        };
      case 'NOT_ELIGIBLE':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />,
          label: 'Not Eligible',
        };
      case 'NEEDS_VERIFICATION':
        return {
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <AlertCircle className="w-3.5 h-3.5 mr-1 text-purple-600" />,
          label: 'Needs Verification',
        };
      case 'INCOMPLETE_PROFILE':
      default:
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: <HelpCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />,
          label: 'Incomplete Profile',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Three Core Evaluation Pillars (Separated) */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-emerald-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Phase 13 AI Job Recommendation Engine
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Intelligent Opportunity Matching</h2>
            <p className="text-slate-300 text-sm max-w-xl">
              Transparent, explainable recommendations separating mandatory eligibility, profile compatibility, and verified career readiness.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[110px]">
              <span className="block text-2xl font-bold text-emerald-400">{readinessScore}/100</span>
              <span className="text-xs text-slate-300 font-medium">Readiness Score</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[110px]">
              <span className="block text-2xl font-bold text-white">{totalCount}</span>
              <span className="text-xs text-slate-300 font-medium">Opportunities</span>
            </div>

            <button
              onClick={() => loadRecommendations(true)}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
              title="Force recalculation of matches"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Matches'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job role, title, keywords..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Match Category Filter */}
          <select
            value={matchCategoryFilter}
            onChange={(e) => setMatchCategoryFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Match Categories</option>
            <option value="EXCELLENT_MATCH">Excellent Match (85%+)</option>
            <option value="STRONG_MATCH">Strong Match (70-84%)</option>
            <option value="MODERATE_MATCH">Moderate Match (50-69%)</option>
            <option value="LOW_MATCH">Low Match (&lt;50%)</option>
          </select>

          {/* Eligibility Filter */}
          <select
            value={eligibilityFilter}
            onChange={(e) => setEligibilityFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Eligibility Statuses</option>
            <option value="ELIGIBLE">Eligible Only</option>
            <option value="NOT_ELIGIBLE">Not Eligible</option>
            <option value="INCOMPLETE_PROFILE">Incomplete Profile</option>
          </select>

          {/* Work Mode Filter */}
          <select
            value={workModeFilter}
            onChange={(e) => setWorkModeFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Work Modes</option>
            <option value="ONSITE">Onsite</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
          </select>

          {/* Sorting */}
          <div className="ml-auto flex items-center gap-1.5 text-slate-500 font-medium">
            <span>Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500"
            >
              <option value="matchScore">Match Score (Highest)</option>
              <option value="deadline">Application Deadline</option>
              <option value="latest">Latest Drives</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Evaluating 6-pillar compatibility and eligibility...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-3">
          <Building className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">No matching opportunities found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search filters or update your student career profile to match with more placement drives.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => {
            const drive = rec.drive;
            const categoryMeta = getMatchCategoryBadge(rec.matchCategory);
            const eligibilityMeta = getEligibilityBadge(rec.eligibilityStatus);
            const isExpanded = expandedJobId === rec.jobId;

            return (
              <div
                key={rec.jobId}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden"
              >
                <div className="p-5 md:p-6">
                  {/* Card Header */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryMeta.bg}`}>
                          {categoryMeta.label}
                        </span>

                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${eligibilityMeta.bg}`}>
                          {eligibilityMeta.icon}
                          {eligibilityMeta.label}
                        </span>

                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200" title="Profile Data Coverage">
                          Coverage: {rec.scoreCoverage}%
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 hover:text-emerald-600 transition cursor-pointer" onClick={() => onViewDriveDetails?.(rec.jobId)}>
                        {drive?.title || 'Placement Opportunity'}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {drive?.organizationName || 'Verified Employer'}
                        </span>

                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {drive?.location || 'Pan-India'} ({drive?.workMode || 'ONSITE'})
                        </span>

                        {drive?.applicationDeadline && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Deadline: {new Date(drive.applicationDeadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Compatibility Score Meter */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="text-3xl font-extrabold text-slate-900">{rec.matchScore}</span>
                          <span className="text-xs font-medium text-slate-400">/100</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 block">Compatibility</span>
                      </div>

                      <div className="w-12 h-12 rounded-full border-4 border-slate-100 flex items-center justify-center relative">
                        <div
                          className={`w-full h-full rounded-full flex items-center justify-center font-bold text-xs ${
                            rec.matchScore >= 85 ? 'text-emerald-600' : rec.matchScore >= 70 ? 'text-blue-600' : 'text-amber-600'
                          }`}
                        >
                          {rec.matchScore}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skills Summary Chips */}
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    {/* Matching Skills */}
                    {rec.explanation.matchingSkills && rec.explanation.matchingSkills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-slate-500 font-semibold mr-1">Matching Skills:</span>
                        {rec.explanation.matchingSkills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium"
                          >
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Missing Skills */}
                    {rec.explanation.missingSkills && rec.explanation.missingSkills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-slate-500 font-semibold mr-1">Skill Gaps:</span>
                        {rec.explanation.missingSkills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-medium"
                          >
                            ✗ {s}
                          </span>
                        ))}
                        {onNavigateToTab && (
                          <button
                            onClick={() => onNavigateToTab('SKILL_GAPS')}
                            className="ml-1 text-emerald-600 hover:text-emerald-700 font-semibold underline text-[11px]"
                          >
                            View gap analysis &amp; courses →
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Feature 3: Transparent "Why this job matches you" Explainable Matching Checklist */}
                  <div className="mt-3.5 p-3.5 rounded-xl bg-slate-50/90 border border-slate-200 text-xs space-y-1.5">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Why this job matches you:</span>
                    </div>
                    <ul className="space-y-1 pl-1">
                      {(rec.explanation.checklist && rec.explanation.checklist.length > 0
                        ? rec.explanation.checklist
                        : [
                            drive?.minimumQualification
                              ? `✓ ${drive.minimumQualification} matches the requirement.`
                              : `✓ General qualification matches the requirement.`,
                            drive?.location
                              ? `✓ Job location (${drive.location}) matches preferred geographic range.`
                              : `- Distance could not be verified (Exact coordinates not provided).`,
                            drive?.salaryRange
                              ? `✓ Employer has listed a stipend / salary (${drive.salaryRange}).`
                              : `- Stipend / salary details not specified by employer.`,
                            rec.explanation.matchingSkills && rec.explanation.matchingSkills.length > 0
                              ? `✓ Your ${rec.explanation.matchingSkills.slice(0, 2).join(', ')} skill(s) match the job description.`
                              : `- Focus on core skill preparation.`,
                          ]
                      ).map((point, pIdx) => {
                        const isPositive = point.startsWith('✓');
                        const isNegative = point.startsWith('✗');
                        return (
                          <li
                            key={pIdx}
                            className={`flex items-start gap-1.5 leading-relaxed ${
                              isPositive ? 'text-emerald-800 font-medium' : isNegative ? 'text-rose-700 font-medium' : 'text-slate-600'
                            }`}
                          >
                            <span className="font-bold shrink-0">{point.slice(0, 1)}</span>
                            <span>{point.slice(2)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Card Actions & Toggle */}
                  <div className="mt-4 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <button
                      onClick={() => setExpandedJobId(isExpanded ? null : rec.jobId)}
                      className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-emerald-600 transition"
                    >
                      {isExpanded ? (
                        <>
                          Hide Explanation Breakdown <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          Why Recommended? View 6-Pillar Breakdown <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => onViewDriveDetails?.(rec.jobId)}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold transition"
                      >
                        Details
                      </button>

                      {rec.eligibility.eligible ? (
                        <button
                          onClick={() => onApplyToDrive?.(rec.jobId)}
                          className="flex-1 sm:flex-none px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm transition"
                        >
                          Apply Now
                        </button>
                      ) : (
                        <button
                          disabled
                          className="flex-1 sm:flex-none px-4 py-1.5 rounded-lg bg-slate-200 text-slate-500 font-semibold cursor-not-allowed"
                          title="Review missing mandatory requirements to become eligible"
                        >
                          Ineligible to Apply
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Explainability Drawer */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-200 p-5 md:p-6 space-y-5 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: 6-Pillar Score Breakdown */}
                      <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-indigo-600" />
                            6-Pillar Compatibility Breakdown
                          </h4>
                          <span className="text-[11px] text-slate-500">Configurable Weights</span>
                        </div>

                        <div className="space-y-2.5 text-xs">
                          {/* 1. Skills */}
                          <div>
                            <div className="flex justify-between font-medium text-slate-700 mb-1">
                              <span>Technical &amp; Required Skills</span>
                              <span>{rec.scoreBreakdown.skillsScore} / 35 pts</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-600 h-2 rounded-full"
                                style={{ width: `${(rec.scoreBreakdown.skillsScore / 35) * 100}%` }}
                              />
                            </div>
                          </div>

                          {/* 2. Education */}
                          <div>
                            <div className="flex justify-between font-medium text-slate-700 mb-1">
                              <span>Academic &amp; Branch Fit</span>
                              <span>{rec.scoreBreakdown.educationScore} / 20 pts</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(rec.scoreBreakdown.educationScore / 20) * 100}%` }}
                              />
                            </div>
                          </div>

                          {/* 3. Assessment Readiness */}
                          <div>
                            <div className="flex justify-between font-medium text-slate-700 mb-1">
                              <span>Verified Assessment Readiness</span>
                              <span>{rec.scoreBreakdown.assessmentScore} / 15 pts</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-600 h-2 rounded-full"
                                style={{ width: `${(rec.scoreBreakdown.assessmentScore / 15) * 100}%` }}
                              />
                            </div>
                          </div>

                          {/* 4. Experience & Projects */}
                          <div>
                            <div className="flex justify-between font-medium text-slate-700 mb-1">
                              <span>Experience &amp; Project Portfolio</span>
                              <span>{rec.scoreBreakdown.experienceScore} / 10 pts</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-500 h-2 rounded-full"
                                style={{ width: `${(rec.scoreBreakdown.experienceScore / 10) * 100}%` }}
                              />
                            </div>
                          </div>

                          {/* 5. Location */}
                          <div>
                            <div className="flex justify-between font-medium text-slate-700 mb-1">
                              <span>Location Preference</span>
                              <span>{rec.scoreBreakdown.locationScore} / 10 pts</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{ width: `${(rec.scoreBreakdown.locationScore / 10) * 100}%` }}
                              />
                            </div>
                          </div>

                          {/* 6. Role Preference */}
                          <div>
                            <div className="flex justify-between font-medium text-slate-700 mb-1">
                              <span>Career Role Preference</span>
                              <span>{rec.scoreBreakdown.rolePreferenceScore} / 10 pts</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-teal-600 h-2 rounded-full"
                                style={{ width: `${(rec.scoreBreakdown.rolePreferenceScore / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Transparent Explanations & Next Actions */}
                      <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="border-b border-slate-100 pb-2">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Detailed Rationale
                          </h4>
                        </div>

                        <div className="space-y-3 text-xs text-slate-600">
                          <div>
                            <span className="font-semibold text-slate-800 block mb-0.5">Academic Compatibility:</span>
                            <p>{rec.explanation.academicCompatibility}</p>
                          </div>

                          <div>
                            <span className="font-semibold text-slate-800 block mb-0.5">Assessment Compatibility:</span>
                            <p>{rec.explanation.assessmentCompatibility}</p>
                          </div>

                          <div>
                            <span className="font-semibold text-slate-800 block mb-0.5">Preferences Alignment:</span>
                            <p>{rec.explanation.preferenceCompatibility}</p>
                          </div>

                          {rec.recommendedActions && rec.recommendedActions.length > 0 && (
                            <div className="pt-2 border-t border-slate-100">
                              <span className="font-semibold text-emerald-800 block mb-1">Recommended Steps:</span>
                              <ul className="list-disc list-inside space-y-1 text-slate-700">
                                {rec.recommendedActions.map((act, aIdx) => (
                                  <li key={aIdx}>{act}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
