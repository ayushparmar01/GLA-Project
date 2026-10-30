import React, { useState, useEffect } from 'react';
import {
  Layers,
  ArrowRight,
  Clock,
  Award,
  CheckCircle,
  Users,
  Compass,
  Sparkles,
} from 'lucide-react';
import { LearningPathData } from '../../types';
import { fetchLearningPathsApi, enrollLearningPathApi } from '../../services/api';
import { LearningPathDetailView } from './LearningPathDetailView';

interface LearningPathsViewProps {
  token?: string | null;
  selectedPathId?: string | null;
  onSelectPath?: (pathId: string | null) => void;
}

export const LearningPathsView: React.FC<LearningPathsViewProps> = ({
  token,
  selectedPathId,
  onSelectPath,
}) => {
  const [paths, setPaths] = useState<LearningPathData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePathId, setActivePathId] = useState<string | null>(selectedPathId || null);

  useEffect(() => {
    loadPaths();
  }, []);

  useEffect(() => {
    if (selectedPathId !== undefined) {
      setActivePathId(selectedPathId);
    }
  }, [selectedPathId]);

  const loadPaths = async () => {
    setLoading(true);
    try {
      const res = await fetchLearningPathsApi(token);
      if (res.success && res.data) {
        setPaths(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (pathId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await enrollLearningPathApi(pathId, token);
      if (res.success && res.data) {
        setPaths((prev) =>
          prev.map((p) =>
            p.id === pathId
              ? {
                  ...p,
                  userEnrollment: {
                    id: res.data!.id,
                    status: res.data!.status,
                    progressPercentage: res.data!.progressPercentage,
                    completedModulesCount: res.data!.completedModulesCount,
                    enrolledAt: res.data!.enrolledAt,
                    lastAccessedAt: res.data!.lastAccessedAt,
                    streakDays: res.data!.streakDays,
                  },
                }
              : p
          )
        );
        setActivePathId(pathId);
        if (onSelectPath) onSelectPath(pathId);
      }
    } catch {
      // Ignore
    }
  };

  if (activePathId) {
    return (
      <LearningPathDetailView
        pathId={activePathId}
        token={token}
        onBack={() => {
          setActivePathId(null);
          if (onSelectPath) onSelectPath(null);
          loadPaths();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Structured Career Learning Paths
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Sequential roadmaps designed with industry engineers to take you from foundational basics to hiring-ready proficiency.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading learning paths...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paths.map((path) => {
            const isEnrolled = Boolean(path.userEnrollment);
            const progress = path.userEnrollment?.progressPercentage || 0;
            const isCompleted = path.userEnrollment?.status === 'COMPLETED';

            return (
              <div
                key={path.id}
                onClick={() => {
                  setActivePathId(path.id);
                  if (onSelectPath) onSelectPath(path.id);
                }}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:border-indigo-400 dark:hover:border-indigo-600 transition shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {path.careerRole}
                    </span>

                    <span className="text-xs text-slate-500 font-medium">
                      {path.difficulty}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {path.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {path.description}
                    </p>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {path.targetSkills.slice(0, 4).map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        {sk}
                      </span>
                    ))}
                    {path.targetSkills.length > 4 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{path.targetSkills.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Progress Bar if enrolled */}
                  {isEnrolled && (
                    <div className="pt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          {isCompleted ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          )}
                          {isCompleted ? 'Path Completed' : 'Path in Progress'}
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400">
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer action */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {path.estimatedDuration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      {path.moduleCount || 3} modules
                    </span>
                  </div>

                  {isEnrolled ? (
                    <button className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Continue Learning
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleEnroll(path.id, e)}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1"
                    >
                      Enroll Now
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
