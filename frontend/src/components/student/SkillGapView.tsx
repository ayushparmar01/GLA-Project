import React, { useState, useEffect } from 'react';
import {
  StudentSkillGapAnalysisReport,
  SkillGapItem,
  PlacementDriveData,
} from '../../types';
import {
  fetchStudentSkillGapsApi,
  fetchPublicOpportunitiesApi,
} from '../../services/api';
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ExternalLink,
  Award,
  ArrowRight,
  TrendingUp,
  Filter,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface SkillGapViewProps {
  token?: string | null;
  onNavigateToAssessment?: (assessmentId?: string) => void;
  onNavigateToResources?: () => void;
}

export const SkillGapView: React.FC<SkillGapViewProps> = ({
  token,
  onNavigateToAssessment,
  onNavigateToResources,
}) => {
  const [report, setReport] = useState<StudentSkillGapAnalysisReport | null>(null);
  const [drives, setDrives] = useState<PlacementDriveData[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDrives();
  }, []);

  useEffect(() => {
    loadGapAnalysis();
  }, [selectedDriveId, token]);

  const loadDrives = async () => {
    try {
      const res = await fetchPublicOpportunitiesApi();
      if (res.success && res.data) {
        setDrives(res.data);
      }
    } catch {
      // Ignore background load error
    }
  };

  const loadGapAnalysis = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchStudentSkillGapsApi(selectedDriveId || undefined, token);
      if (res.success && res.data) {
        setReport(res.data);
      } else {
        setError(res.error?.message || 'Failed to analyze skill gaps');
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error loading skill gap analysis');
    } finally {
      setLoading(false);
    }
  };

  const getGapCategoryBadge = (category: string) => {
    switch (category) {
      case 'MISSING_MANDATORY':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-200',
          label: 'Critical Missing Skill (Mandatory)',
        };
      case 'NEEDS_IMPROVEMENT':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          label: 'Unverified / Needs Improvement',
        };
      case 'MISSING_PREFERRED':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          label: 'Preferred Skill Gap',
        };
      case 'MATCHED':
      default:
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          label: 'Verified & Matched',
        };
    }
  };

  const filteredGaps: SkillGapItem[] =
    report?.gaps.filter((g) => {
      if (filterCategory === 'ALL') return true;
      return g.gapCategory === filterCategory;
    }) || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
              <Target className="w-3.5 h-3.5" />
              Explainable Skill Gap Intelligence
            </div>
            <h2 className="text-xl font-bold text-slate-900">Skill Gap Analysis &amp; Learning Pathways</h2>
            <p className="text-xs text-slate-500 max-w-xl mt-1">
              Analyze exactly which mandatory and preferred skills you need to develop for maximum hiring readiness across placement drives.
            </p>
          </div>

          {/* Drive Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Evaluate for:</span>
            <select
              value={selectedDriveId}
              onChange={(e) => setSelectedDriveId(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Active Placement Drives</option>
              {drives.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.organizationName})
                </option>
              ))}
            </select>
            <button
              onClick={() => loadGapAnalysis()}
              className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
              title="Refresh analysis"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Summary Bar */}
        {report && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 text-center">
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="block text-2xl font-bold text-slate-900">{report.overallMatchScoreAverage}%</span>
              <span className="text-xs text-slate-500 font-medium">Avg Skill Coverage</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl">
              <span className="block text-2xl font-bold text-emerald-700">{report.matchingSkillsCount}</span>
              <span className="text-xs text-emerald-600 font-medium">Matching Skills</span>
            </div>
            <div className="bg-rose-50 p-3 rounded-xl">
              <span className="block text-2xl font-bold text-rose-700">{report.missingSkillsCount}</span>
              <span className="text-xs text-rose-600 font-medium">Skill Gaps</span>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl">
              <span className="block text-2xl font-bold text-amber-700">{report.criticalMissingSkills.length}</span>
              <span className="text-xs text-amber-600 font-medium">Critical Mandatory Gaps</span>
            </div>
          </div>
        )}
      </div>

      {/* Critical Missing Skills Warning Banner */}
      {report && report.criticalMissingSkills && report.criticalMissingSkills.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-rose-900">
              High Priority Skill Gaps Detected
            </h4>
            <p className="text-xs text-rose-700">
              The following skills are mandatory requirements across multiple placement drives:
              <span className="font-semibold ml-1">
                {report.criticalMissingSkills.join(', ')}
              </span>
              . Upskilling in these areas will directly unlock job eligibility.
            </p>
          </div>
        </div>
      )}

      {/* Prioritized Learning Sequence */}
      {report && report.prioritizedLearningSequence && report.prioritizedLearningSequence.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 space-y-2">
          <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Recommended Step-by-Step Learning Order
          </h4>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {report.prioritizedLearningSequence.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 text-xs font-semibold shadow-xs"
              >
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                  {idx + 1}
                </span>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 font-semibold mr-1">Filter by Status:</span>
        {['ALL', 'MISSING_MANDATORY', 'NEEDS_IMPROVEMENT', 'MISSING_PREFERRED', 'MATCHED'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filterCategory === cat
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat === 'ALL'
              ? 'All Skills'
              : cat === 'MISSING_MANDATORY'
              ? 'Missing Mandatory'
              : cat === 'NEEDS_IMPROVEMENT'
              ? 'Needs Improvement'
              : cat === 'MISSING_PREFERRED'
              ? 'Missing Preferred'
              : 'Matched'}
          </button>
        ))}
      </div>

      {/* Gap Items Cards */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Analyzing career skill gaps against employers...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {error}
        </div>
      ) : filteredGaps.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No skill gaps in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGaps.map((item, idx) => {
            const meta = getGapCategoryBadge(item.gapCategory);

            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900">{item.skill}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${meta.bg}`}>
                      {meta.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>
                      Type: <strong className="text-slate-700">{item.requirementType}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Proficiency: <strong className="text-slate-700">{item.studentProficiency}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Verified: <strong className={item.verified ? 'text-emerald-600' : 'text-slate-500'}>
                        {item.verified ? 'Yes' : 'No'}
                      </strong>
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {item.recommendedAction}
                  </p>
                </div>

                {/* Curated Learning Resource Card */}
                {item.recommendedLearningResource && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Recommended Resource:</span>
                      <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                        {item.recommendedLearningResource.title}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {item.recommendedLearningResource.difficulty} • {item.recommendedLearningResource.source}
                      </span>
                    </div>

                    <a
                      href={item.recommendedLearningResource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1 transition shrink-0"
                    >
                      Learn <ExternalLink className="w-3 h-3" />
                    </a>
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
