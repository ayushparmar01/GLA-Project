import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ExternalLink,
  Target,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Layers,
} from 'lucide-react';
import { SkillGapLearningRecommendation } from '../../types';
import { fetchSkillGapLearningMapApi } from '../../services/api';

interface SkillGapLearningViewProps {
  token?: string | null;
  onSelectPath?: (pathId: string) => void;
}

export const SkillGapLearningView: React.FC<SkillGapLearningViewProps> = ({
  token,
  onSelectPath,
}) => {
  const [gaps, setGaps] = useState<SkillGapLearningRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMapping();
  }, []);

  const loadMapping = async () => {
    setLoading(true);
    try {
      const res = await fetchSkillGapLearningMapApi(token);
      if (res.success && res.data) {
        setGaps(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Skill Gap to Learning Path Bridge
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Targeted curriculum recommendations mapped automatically from your skill assessments, resume scans, and career readiness scores.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          Analyzing skill gaps and compiling targeted learning roadmaps...
        </div>
      ) : gaps.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <CheckCircle className="w-12 h-12 mx-auto text-emerald-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Critical Skill Gaps Detected!
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your verified skill profile matches requirements for entry-level engineering drives. Explore advanced career paths to deepen specialization.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {gaps.map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {item.skill}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Identified via {item.source.toLowerCase()} audit • Priority skill
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 self-start sm:self-auto">
                  {item.gapStatus}
                </span>
              </div>

              {/* Recommended Paths */}
              {item.recommendedPaths && item.recommendedPaths.length > 0 && (
                <div className="pt-2 space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Recommended Learning Paths
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {item.recommendedPaths.map((path) => (
                      <div
                        key={path.id}
                        onClick={() => onSelectPath && onSelectPath(path.id)}
                        className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-950/80 bg-indigo-50/40 dark:bg-indigo-950/20 hover:border-indigo-400 transition cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <h4 className="font-bold text-xs text-indigo-950 dark:text-indigo-200 group-hover:text-indigo-600">
                            {path.title}
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            {path.careerRole} • {path.estimatedDuration}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Resources */}
              {item.recommendedResources && item.recommendedResources.length > 0 && (
                <div className="pt-2 space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Curated Bridging Study Materials
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {item.recommendedResources.map((res) => (
                      <a
                        key={res.id}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-indigo-400 transition flex items-center justify-between text-xs group"
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
