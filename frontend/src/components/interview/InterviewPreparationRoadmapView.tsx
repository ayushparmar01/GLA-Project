import React, { useState, useEffect } from 'react';
import { PersonalizedInterviewRoadmap } from '../../types';
import { fetchPersonalizedInterviewRoadmapApi } from '../../services/api';
import {
  TrendingUp,
  Target,
  BookOpen,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  BrainCircuit,
} from 'lucide-react';

interface InterviewPreparationRoadmapViewProps {
  token: string | null;
  onStartTargetedPractice: (topic: string) => void;
}

export const InterviewPreparationRoadmapView: React.FC<InterviewPreparationRoadmapViewProps> = ({
  token,
  onStartTargetedPractice,
}) => {
  const [roadmap, setRoadmap] = useState<PersonalizedInterviewRoadmap | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoadmap();
  }, [token]);

  const loadRoadmap = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPersonalizedInterviewRoadmapApi(token);
      if (res.success && res.data) {
        setRoadmap(res.data);
      } else {
        setError(res.error?.message || 'Failed to load preparation roadmap.');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading roadmap.');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'LOW':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Generating personalized interview preparation roadmap...</p>
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs text-center">
        {error || 'Unable to generate preparation roadmap.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-emerald-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
            <BrainCircuit className="w-3.5 h-3.5" />
            AI-Driven Curriculum Synthesis
          </div>
          <h3 className="text-xl font-bold text-white">Targeted {roadmap.targetRole} Preparation Roadmap</h3>
          <p className="text-xs text-slate-300 max-w-lg">
            Prioritized recommendations dynamically synthesized from your previous mock interview performance and corporate placement drive skill gaps.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[120px]">
          <span className="block text-2xl font-bold text-emerald-400">{roadmap.overallReadiness}%</span>
          <span className="text-[11px] text-slate-300 font-semibold">Interview Readiness</span>
        </div>
      </div>

      {/* Recommended Topics List */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Target className="w-4 h-4 text-indigo-600" />
          Prioritized Learning Steps ({roadmap.recommendedTopics.length} steps)
        </h4>

        <div className="space-y-3">
          {roadmap.recommendedTopics.map((topic, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h5 className="text-sm font-bold text-slate-900">{topic.topic}</h5>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(topic.priority)}`}>
                      {topic.priority} PRIORITY
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 pl-7 leading-relaxed">{topic.reason}</p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {topic.learningResourceUrl && (
                    <a
                      href={topic.learningResourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      Study <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  )}

                  <button
                    onClick={() => onStartTargetedPractice(topic.topic)}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition"
                  >
                    Practice Topic <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
