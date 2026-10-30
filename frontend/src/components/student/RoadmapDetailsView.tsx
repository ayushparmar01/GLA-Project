import React, { useState } from 'react';
import {
  updateLearningRoadmapMilestoneApi,
  updateLearningRoadmapStatusApi,
  deleteLearningRoadmapApi,
} from '../../services/api';
import { LearningRoadmapData, RoadmapMilestone, RoadmapStatus } from '../../types';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  ExternalLink,
  Code2,
  Calendar,
  Layers,
  Trash2,
  AlertCircle,
  BookOpen,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface RoadmapDetailsViewProps {
  roadmap: LearningRoadmapData;
  token: string | null;
  onBack: () => void;
  onUpdate: (updated: LearningRoadmapData) => void;
  onDelete: (deletedId: string) => void;
}

export const RoadmapDetailsView: React.FC<RoadmapDetailsViewProps> = ({
  roadmap,
  token,
  onBack,
  onUpdate,
  onDelete,
}) => {
  const [currentRoadmap, setCurrentRoadmap] = useState<LearningRoadmapData>(roadmap);
  const [togglingMilestoneId, setTogglingMilestoneId] = useState<string | null>(null);
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({
    [roadmap.milestones[0]?.id || '']: true,
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const toggleExpand = (id: string) => {
    setExpandedMilestones((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleMilestone = async (milestone: RoadmapMilestone) => {
    setTogglingMilestoneId(milestone.id);
    setActionError(null);

    const nextCompleted = !milestone.completed;
    try {
      const res = await updateLearningRoadmapMilestoneApi(
        currentRoadmap.id,
        milestone.id,
        nextCompleted,
        token
      );

      if (res.success && res.data) {
        setCurrentRoadmap(res.data);
        onUpdate(res.data);
      } else {
        setActionError(res.error?.message || 'Failed to update milestone progress');
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error updating milestone');
    } finally {
      setTogglingMilestoneId(null);
    }
  };

  const handleStatusChange = async (newStatus: RoadmapStatus) => {
    setActionError(null);
    try {
      const res = await updateLearningRoadmapStatusApi(currentRoadmap.id, newStatus, token);
      if (res.success && res.data) {
        setCurrentRoadmap(res.data);
        onUpdate(res.data);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to change roadmap status');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this learning roadmap?')) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      const res = await deleteLearningRoadmapApi(currentRoadmap.id, token);
      if (res.success) {
        onDelete(currentRoadmap.id);
        onBack();
      } else {
        setActionError(res.error?.message || 'Failed to delete roadmap');
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error deleting roadmap');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs sm:text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Roadmaps
        </button>

        <div className="flex items-center gap-3">
          <select
            value={currentRoadmap.status}
            onChange={(e) => handleStatusChange(e.target.value as RoadmapStatus)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="ACTIVE">Status: Active</option>
            <option value="COMPLETED">Status: Completed</option>
            <option value="PAUSED">Status: Paused</option>
            <option value="ARCHIVED">Status: Archived</option>
          </select>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            title="Delete Roadmap"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Roadmap Overview Hero Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                Target Role
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Level: {currentRoadmap.currentSkillLevel}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {currentRoadmap.targetRole} Roadmap
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Estimated Duration: {currentRoadmap.estimatedDuration || '12 Weeks'} • {currentRoadmap.milestones.length} Strategic Milestones
            </p>
          </div>

          {/* Progress Circular/Pill Gauge */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center gap-4 min-w-[200px]">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Completion</span>
                <span className="text-white font-bold">{currentRoadmap.progress}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${currentRoadmap.progress}%` }}
                />
              </div>
            </div>
            {currentRoadmap.progress === 100 && (
              <Award className="w-8 h-8 text-amber-400 shrink-0" />
            )}
          </div>
        </div>

        {/* Skill Gap Analysis Summary */}
        {currentRoadmap.skillGaps && currentRoadmap.skillGaps.length > 0 && (
          <div className="pt-3 border-t border-slate-800/80">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Skill Alignment Breakdown:
            </p>
            <div className="flex flex-wrap gap-2">
              {currentRoadmap.skillGaps.map((sg, idx) => (
                <span
                  key={idx}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 ${
                    sg.status === 'ASSESSMENT_VERIFIED'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : sg.status === 'SELF_DECLARED'
                      ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {sg.skill}
                  <span className="text-[10px] opacity-75">
                    ({sg.status === 'ASSESSMENT_VERIFIED' ? 'Verified' : sg.status === 'SELF_DECLARED' ? 'Declared' : 'Target Gap'})
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Milestones Timeline */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          Milestones & Weekly Curriculum
        </h3>

        <div className="space-y-3">
          {currentRoadmap.milestones.map((milestone, index) => {
            const isExpanded = Boolean(expandedMilestones[milestone.id]);
            const isToggling = togglingMilestoneId === milestone.id;

            return (
              <div
                key={milestone.id}
                className={`rounded-xl border transition-all ${
                  milestone.completed
                    ? 'bg-slate-900/40 border-emerald-900/30'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                {/* Milestone Header */}
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleMilestone(milestone)}
                      disabled={isToggling}
                      className="text-slate-400 hover:text-emerald-400 transition-colors"
                      title={milestone.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {milestone.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500 hover:text-indigo-400" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-indigo-400">
                          Step {milestone.order || index + 1}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          • {milestone.estimatedWeeks} {milestone.estimatedWeeks === 1 ? 'Week' : 'Weeks'}
                        </span>
                        {milestone.completed && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Completed
                          </span>
                        )}
                      </div>
                      <h4
                        className={`text-sm font-semibold ${
                          milestone.completed ? 'text-slate-400 line-through' : 'text-white'
                        }`}
                      >
                        {milestone.title}
                      </h4>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleExpand(milestone.id)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Milestone Body */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 space-y-4">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {milestone.description}
                    </p>

                    {/* Topics */}
                    {milestone.topics && milestone.topics.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                          Topics to Master:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {milestone.topics.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700/80"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Practice Tasks */}
                    {milestone.practiceTasks && milestone.practiceTasks.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                          Hands-on Tasks:
                        </p>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {milestone.practiceTasks.map((task, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-indigo-400 font-bold">•</span>
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Project Idea */}
                    {milestone.projectIdea && (
                      <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-800/30">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 mb-1">
                          <Code2 className="w-4 h-4 text-indigo-400" />
                          <span>Milestone Project Idea:</span>
                        </div>
                        <p className="text-xs text-slate-300">{milestone.projectIdea}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Curated Resources Section */}
      {currentRoadmap.resourceReferences && currentRoadmap.resourceReferences.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            Curated Free Learning Resources for this Roadmap
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentRoadmap.resourceReferences.map((res, idx) => (
              <a
                key={idx}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                      {res.type}
                    </span>
                    <span className="text-[10px] text-slate-500">{res.provider}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-200 group-hover:text-indigo-300 transition-colors">
                    {res.title}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0 ml-2" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
