import React, { useState, useEffect } from 'react';
import { AssessmentData, AssessmentAttemptData } from '../../types';
import {
  fetchAssessmentsApi,
  startAssessmentAttemptApi,
  fetchMyAssessmentHistoryApi,
} from '../../services/api';

interface AssessmentCatalogueViewProps {
  token?: string | null;
  onStartAttempt: (attempt: AssessmentAttemptData, assessment: AssessmentData) => void;
  onReviewAttempt: (attempt: AssessmentAttemptData) => void;
}

export const AssessmentCatalogueView: React.FC<AssessmentCatalogueViewProps> = ({
  token,
  onStartAttempt,
  onReviewAttempt,
}) => {
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [history, setHistory] = useState<AssessmentAttemptData[]>([]);
  const [activeTab, setActiveTab] = useState<'CATALOGUE' | 'HISTORY'>('CATALOGUE');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [startingAsmId, setStartingAsmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [asmRes, histRes] = await Promise.all([
        fetchAssessmentsApi(),
        token ? fetchMyAssessmentHistoryApi(token) : Promise.resolve({ success: true, data: [] }),
      ]);

      if (asmRes.success && asmRes.data) {
        setAssessments(asmRes.data);
      } else {
        setError(asmRes.error?.message || 'Failed to fetch assessments');
      }

      if (histRes.success && histRes.data) {
        setHistory(histRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (asm: AssessmentData) => {
    if (!token) {
      alert('Please log in as a student to take assessments.');
      return;
    }
    setStartingAsmId(asm.id);
    setError(null);
    try {
      const res = await startAssessmentAttemptApi(asm.id, token);
      if (res.success && res.data) {
        onStartAttempt(res.data, asm);
      } else {
        setError(res.error?.message || 'Failed to start assessment attempt');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error starting attempt');
    } finally {
      setStartingAsmId(null);
    }
  };

  const filteredAssessments = assessments.filter((asm) => {
    if (difficultyFilter !== 'ALL' && asm.difficulty !== difficultyFilter) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = asm.title.toLowerCase().includes(query);
      const matchDesc = asm.description.toLowerCase().includes(query);
      const matchSkill = asm.skillsTested.some((s) => s.toLowerCase().includes(query));
      return matchTitle || matchDesc || matchSkill;
    }
    return true;
  });

  const getDifficultyBadge = (level: string) => {
    switch (level) {
      case 'BEGINNER':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'INTERMEDIATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ADVANCED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              Objective Skill Assessments
            </span>
            <h2 className="text-2xl font-bold tracking-tight">Verified Skills Catalogue</h2>
            <p className="text-blue-100 text-sm mt-1 max-w-2xl">
              Take standardized tests to prove your competency. Passed assessments grant{' '}
              <strong className="text-white">Assessment-Verified</strong> status and directly boost
              your recruiter matching rank.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/20 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('CATALOGUE')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'CATALOGUE'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Assessments ({assessments.length})
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'HISTORY'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              My Attempts ({history.length})
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {activeTab === 'CATALOGUE' ? (
        <>
          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-80 relative">
              <input
                type="text"
                placeholder="Search assessments or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <svg
                className="w-5 h-5 text-slate-400 absolute left-3 top-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                Difficulty:
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      difficultyFilter === diff
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Assessment Cards Grid */}
          {loading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500">Loading assessments...</p>
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-slate-600 font-medium">No assessments match your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAssessments.map((asm) => (
                <div
                  key={asm.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-bold text-slate-900 text-lg leading-snug">{asm.title}</h3>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${getDifficultyBadge(
                          asm.difficulty
                        )}`}
                      >
                        {asm.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        {asm.category}
                      </span>
                      <span className="text-xs text-slate-500">
                        Pass: {asm.passingPercentage}%
                      </span>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed mb-4">{asm.description}</p>

                    {/* Metadata chips */}
                    <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Duration:</span>
                        <span className="font-semibold text-slate-800">
                          {asm.durationMinutes} Minutes
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Questions:</span>
                        <span className="font-semibold text-slate-800">
                          {asm.questionCount} Objective Questions
                        </span>
                      </div>
                    </div>

                    {/* Skills Tested */}
                    <div className="mb-5">
                      <span className="text-xs font-semibold text-slate-500 block mb-2">
                        Skills Verified Upon Passing:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {asm.skillsTested.map((skill, idx) => (
                          <span
                            key={idx}
                            className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-0.5 rounded-md font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => handleStart(asm)}
                      disabled={startingAsmId === asm.id}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      {startingAsmId === asm.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Initializing Test Environment...</span>
                        </>
                      ) : (
                        <>
                          <span>Start Assessment</span>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* History Tab */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Your Assessment Attempts</h3>
            <span className="text-xs text-slate-500">
              Total attempts: {history.length}
            </span>
          </div>

          {history.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              You haven't attempted any skill assessments yet. Browse the catalogue to begin!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {history.map((att) => (
                <div
                  key={att.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <h4 className="font-bold text-slate-900 text-sm">{att.assessmentTitle}</h4>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          att.status === 'SUBMITTED'
                            ? att.passed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                            : att.status === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {att.status === 'SUBMITTED'
                          ? att.passed
                            ? 'PASSED'
                            : 'NEEDS RETAKE'
                          : att.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>Category: {att.category}</span>
                      <span>Difficulty: {att.difficulty}</span>
                      <span>
                        Date: {new Date(att.startedAt).toLocaleDateString()}
                      </span>
                      {att.status === 'SUBMITTED' && (
                        <span className="font-semibold text-slate-700">
                          Score: {att.score}/{att.totalMarks} ({att.percentage}%)
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    {att.status === 'SUBMITTED' ? (
                      <button
                        onClick={() => onReviewAttempt(att)}
                        className="px-4 py-2 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap"
                      >
                        Review Scorecard
                      </button>
                    ) : att.status === 'IN_PROGRESS' ? (
                      <button
                        onClick={() => {
                          const asm = assessments.find((a) => a.id === att.assessmentId);
                          if (asm) onStartAttempt(att, asm);
                        }}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg transition-colors whitespace-nowrap"
                      >
                        Resume Attempt
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Expired</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
