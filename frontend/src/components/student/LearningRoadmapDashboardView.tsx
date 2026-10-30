import React, { useState, useEffect } from 'react';
import {
  fetchLearningRoadmapsApi,
  createLearningRoadmapApi,
} from '../../services/api';
import { LearningRoadmapData, RoadmapStatus } from '../../types';
import { RoadmapDetailsView } from './RoadmapDetailsView';
import {
  Compass,
  Sparkles,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  AlertCircle,
  Award,
  BookOpen,
} from 'lucide-react';

interface LearningRoadmapDashboardViewProps {
  token: string | null;
}

const COMMON_ROLES = [
  'Full-Stack Software Engineer',
  'Frontend Developer',
  'Backend Engineer',
  'Cloud & DevOps Engineer',
  'Data Analyst',
  'Cybersecurity Analyst',
];

export const LearningRoadmapDashboardView: React.FC<LearningRoadmapDashboardViewProps> = ({
  token,
}) => {
  const [roadmaps, setRoadmaps] = useState<LearningRoadmapData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedRoadmap, setSelectedRoadmap] = useState<LearningRoadmapData | null>(null);
  const [targetRoleInput, setTargetRoleInput] = useState<string>(COMMON_ROLES[0]);
  const [customRole, setCustomRole] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  useEffect(() => {
    loadRoadmaps();
  }, []);

  const loadRoadmaps = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetchLearningRoadmapsApi(token);
      if (res.success && res.data) {
        setRoadmaps(res.data);
      } else {
        setErrorMessage(res.error?.message || 'Failed to load learning roadmaps');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error fetching roadmaps');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoadmap = async () => {
    const role = (customRole.trim() || targetRoleInput).trim();
    if (!role || creating) return;

    setCreating(true);
    setErrorMessage(null);

    try {
      const res = await createLearningRoadmapApi(role, token);
      if (res.success && res.data) {
        setRoadmaps((prev) => [res.data!, ...prev]);
        setSelectedRoadmap(res.data);
        setShowCreateModal(false);
        setCustomRole('');
      } else {
        setErrorMessage(res.error?.message || 'Failed to create roadmap');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error generating roadmap');
    } finally {
      setCreating(false);
    }
  };

  const handleRoadmapUpdate = (updated: LearningRoadmapData) => {
    setRoadmaps((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSelectedRoadmap(updated);
  };

  const handleRoadmapDelete = (deletedId: string) => {
    setRoadmaps((prev) => prev.filter((r) => r.id !== deletedId));
    setSelectedRoadmap(null);
  };

  if (selectedRoadmap) {
    return (
      <RoadmapDetailsView
        roadmap={selectedRoadmap}
        token={token}
        onBack={() => setSelectedRoadmap(null)}
        onUpdate={handleRoadmapUpdate}
        onDelete={handleRoadmapDelete}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
              Personalized Career Curricula
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Free & Open-Source Grounded
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Personalized Learning Roadmaps
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Targeted weekly preparation milestones synthesized around your skill assessment results and verified industry expectations.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm transition-colors shadow-lg shadow-indigo-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Generate New Roadmap
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Roadmaps Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          Loading your learning roadmaps...
        </div>
      ) : roadmaps.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Compass className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">No Roadmaps Created Yet</h3>
            <p className="text-xs text-slate-400 mt-1">
              Select your dream role to generate a step-by-step weekly roadmap tailored to your skill gaps.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Generate My First Roadmap
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roadmaps.map((r) => {
            const completedMilestones = r.milestones.filter((m) => m.completed).length;
            const totalMilestones = r.milestones.length;

            return (
              <div
                key={r.id}
                onClick={() => setSelectedRoadmap(r)}
                className="p-5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                        r.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : r.status === 'PAUSED'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}
                    >
                      {r.status}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {r.estimatedDuration || '12 Weeks'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {r.targetRole}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {totalMilestones} curriculum milestones • Level: {r.currentSkillLevel}
                  </p>

                  {/* Progress bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-white font-medium">{r.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${r.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {completedMilestones} of {totalMilestones} steps completed
                  </span>
                  <span className="text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    View <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Generate Learning Roadmap
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Select your intended placement job role to build a weekly milestones roadmap.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Role Preset:
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                {COMMON_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setTargetRoleInput(role);
                      setCustomRole('');
                    }}
                    className={`text-left text-xs px-3.5 py-2.5 rounded-xl border transition-all ${
                      targetRoleInput === role && !customRole
                        ? 'bg-indigo-600 text-white border-indigo-500 font-medium'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Or Enter Custom Role:
                </label>
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="e.g. Android Developer, Embedded Systems"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateRoadmap}
                disabled={creating}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md flex items-center gap-2"
              >
                {creating ? 'Synthesizing...' : 'Generate Roadmap'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
