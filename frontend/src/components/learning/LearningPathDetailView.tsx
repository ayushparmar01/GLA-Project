import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  BookOpen,
  Award,
  Layers,
  ChevronRight,
  ExternalLink,
  Code,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import {
  LearningPathData,
  LearningModuleData,
} from '../../types';
import {
  fetchLearningPathDetailApi,
  enrollLearningPathApi,
  updateModuleProgressApi,
} from '../../services/api';
import { LearningQuizModal } from './LearningQuizModal';

interface LearningPathDetailViewProps {
  pathId: string;
  token?: string | null;
  onBack: () => void;
}

export const LearningPathDetailView: React.FC<LearningPathDetailViewProps> = ({
  pathId,
  token,
  onBack,
}) => {
  const [path, setPath] = useState<LearningPathData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [updatingModuleId, setUpdatingModuleId] = useState<string | null>(null);

  useEffect(() => {
    loadPath();
  }, [pathId]);

  const loadPath = async () => {
    setLoading(true);
    try {
      const res = await fetchLearningPathDetailApi(pathId, token);
      if (res.success && res.data) {
        setPath(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      const res = await enrollLearningPathApi(pathId, token);
      if (res.success && res.data) {
        loadPath();
      }
    } catch {
      // Ignore
    }
  };

  const handleMarkCompleted = async (moduleId: string) => {
    setUpdatingModuleId(moduleId);
    try {
      const res = await updateModuleProgressApi(
        pathId,
        moduleId,
        {
          status: 'COMPLETED',
          completionMethod: 'STUDENT_CONFIRMED',
          notes: 'Self-confirmed module completion',
        },
        token
      );
      if (res.success) {
        loadPath();
      }
    } catch {
      // Ignore
    } finally {
      setUpdatingModuleId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin mb-3 text-indigo-600" />
        <p className="text-sm">Loading curriculum and module progress...</p>
      </div>
    );
  }

  if (!path) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-slate-600 dark:text-slate-400">Path not found.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-semibold"
        >
          Back to Paths
        </button>
      </div>
    );
  }

  const isEnrolled = Boolean(path.userEnrollment);
  const progress = path.userEnrollment?.progressPercentage || 0;

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <button
        onClick={onBack}
        className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Learning Paths
      </button>

      {/* Path Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {path.careerRole}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {path.difficulty}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
              {path.title}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {path.description}
            </p>
          </div>

          {!isEnrolled ? (
            <button
              onClick={handleEnroll}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition whitespace-nowrap self-start"
            >
              Enroll in this Path
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 min-w-[200px] text-right space-y-1.5">
              <span className="text-xs font-semibold text-slate-500">Your Progress</span>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {progress}%
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Path Meta Pills */}
        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <Clock className="w-4 h-4 text-indigo-500" />
            Estimated Duration: {path.estimatedDuration} (~{path.estimatedHours} hrs)
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <Layers className="w-4 h-4 text-indigo-500" />
            {path.modules?.length || path.moduleCount} Sequential Modules
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <Award className="w-4 h-4 text-amber-500" />
            Industry Ready Curriculum
          </span>
        </div>
      </div>

      {/* Sequential Modules Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Modules & Learning Progression
        </h3>

        <div className="space-y-4">
          {(path.modules || []).map((mod, idx) => {
            const isCompleted = mod.userProgress?.status === 'COMPLETED';

            return (
              <div
                key={mod.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition p-6 space-y-4 ${
                  isCompleted
                    ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                        isCompleted
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Module {mod.sequence}
                        </span>
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            COMPLETED
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {mod.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                        {mod.description}
                      </p>
                    </div>
                  </div>

                  {/* Complete / Quiz Buttons */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                    {mod.quizId && (
                      <button
                        type="button"
                        onClick={() => setActiveQuizId(mod.quizId || null)}
                        className="px-3.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Knowledge Check
                      </button>
                    )}

                    {!isCompleted && isEnrolled && (
                      <button
                        type="button"
                        onClick={() => handleMarkCompleted(mod.id)}
                        disabled={updatingModuleId === mod.id}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        {updatingModuleId === mod.id ? 'Updating...' : 'Mark Completed'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Linked Verified Resources */}
                {mod.resources && mod.resources.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Study Materials
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {mod.resources.map((res) => (
                        <a
                          key={res.id}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-indigo-400 transition flex items-center justify-between text-xs group"
                        >
                          <div className="truncate mr-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 truncate block">
                              {res.title}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {res.provider} • {res.resourceType}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Practice Activities */}
                {mod.practiceActivities && mod.practiceActivities.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Hands-on Practice & Capstone
                    </span>
                    <div className="space-y-1.5">
                      {mod.practiceActivities.map((act, actIdx) => (
                        <div
                          key={actIdx}
                          className="p-3 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs flex items-start gap-2.5"
                        >
                          <Code className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-indigo-950 dark:text-indigo-200 block">
                              {act.title}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 mt-0.5 block">
                              {act.description}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quiz Modal if active */}
      {activeQuizId && (
        <LearningQuizModal
          quizId={activeQuizId}
          learningPathId={pathId}
          token={token}
          onClose={() => setActiveQuizId(null)}
          onQuizPassed={() => {
            loadPath();
          }}
        />
      )}
    </div>
  );
};
