import React, { useState, useEffect } from 'react';
import {
  MentorshipRelationshipData,
  MentorshipGoalData,
  MentorshipSessionData,
  MentorshipFeedbackData,
} from '../../types';
import {
  fetchRelationshipByIdApi,
  fetchMentorshipGoalsApi,
  createMentorshipGoalApi,
  updateMentorshipGoalApi,
  deleteMentorshipGoalApi,
  fetchMentorshipSessionsApi,
  updateMentorshipSessionStatusApi,
  updateRelationshipStatusApi,
} from '../../services/api';
import { SessionSchedulingModal } from './SessionSchedulingModal';
import { MentorshipMessagingDrawer } from './MentorshipMessagingDrawer';
import { MentorshipNotesDrawer } from './MentorshipNotesDrawer';
import { AIMentorshipAssistantPanel } from './AIMentorshipAssistantPanel';
import { MentorshipFeedbackModal } from './MentorshipFeedbackModal';
import {
  Calendar,
  Clock,
  Target,
  Plus,
  Trash2,
  Video,
  MessageSquare,
  FileText,
  Sparkles,
  Star,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface MentorshipWorkspaceViewProps {
  relationshipId: string;
  currentUserId?: string;
  onBack?: () => void;
  token?: string | null;
}

export const MentorshipWorkspaceView: React.FC<MentorshipWorkspaceViewProps> = ({
  relationshipId,
  currentUserId,
  onBack,
  token,
}) => {
  const [relationship, setRelationship] = useState<MentorshipRelationshipData | null>(null);
  const [goals, setGoals] = useState<MentorshipGoalData[]>([]);
  const [sessions, setSessions] = useState<MentorshipSessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sub-modals & drawers
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // New goal form
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalPriority, setNewGoalPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [showAddGoal, setShowAddGoal] = useState(false);

  const loadWorkspaceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [relRes, goalsRes, sessionsRes] = await Promise.all([
        fetchRelationshipByIdApi(relationshipId, token),
        fetchMentorshipGoalsApi(relationshipId, token),
        fetchMentorshipSessionsApi(relationshipId, token),
      ]);

      if (relRes.success && relRes.data) {
        setRelationship(relRes.data);
      } else {
        setError(relRes.error?.message || 'Failed to load workspace.');
      }

      if (goalsRes.success && goalsRes.data) {
        setGoals(goalsRes.data);
      }
      if (sessionsRes.success && sessionsRes.data) {
        setSessions(sessionsRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [relationshipId]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    try {
      const res = await createMentorshipGoalApi(
        relationshipId,
        { title: newGoalTitle.trim(), priority: newGoalPriority },
        token
      );
      if (res.success && res.data) {
        setGoals((prev) => [res.data!, ...prev]);
        setNewGoalTitle('');
        setShowAddGoal(false);
        // Refresh relationship progress
        const updatedRel = await fetchRelationshipByIdApi(relationshipId, token);
        if (updatedRel.success && updatedRel.data) setRelationship(updatedRel.data);
      }
    } catch {
      // Ignore
    }
  };

  const handleUpdateGoalProgress = async (goalId: string, progress: number) => {
    try {
      const res = await updateMentorshipGoalApi(relationshipId, goalId, { progress }, token);
      if (res.success && res.data) {
        setGoals((prev) => prev.map((g) => (g.id === goalId ? res.data! : g)));
        const updatedRel = await fetchRelationshipByIdApi(relationshipId, token);
        if (updatedRel.success && updatedRel.data) setRelationship(updatedRel.data);
      }
    } catch {
      // Ignore
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteMentorshipGoalApi(relationshipId, goalId, token);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      const updatedRel = await fetchRelationshipByIdApi(relationshipId, token);
      if (updatedRel.success && updatedRel.data) setRelationship(updatedRel.data);
    } catch {
      // Ignore
    }
  };

  const handleMarkSessionCompleted = async (sessionId: string) => {
    try {
      const res = await updateMentorshipSessionStatusApi(relationshipId, sessionId, 'COMPLETED', undefined, token);
      if (res.success && res.data) {
        setSessions((prev) => prev.map((s) => (s.id === sessionId ? res.data! : s)));
        // Prompt feedback
        setIsFeedbackOpen(true);
      }
    } catch {
      // Ignore
    }
  };

  const handleCompleteRelationship = async () => {
    if (!window.confirm('Mark this mentorship relationship as COMPLETED?')) return;
    try {
      const res = await updateRelationshipStatusApi(relationshipId, 'COMPLETED', token);
      if (res.success && res.data) {
        setRelationship(res.data);
      }
    } catch {
      // Ignore
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
        <p className="text-xs text-gray-500">Loading Mentorship Workspace...</p>
      </div>
    );
  }

  if (error || !relationship) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-gray-800">{error || 'Workspace could not be found'}</p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
          >
            Back to Directory
          </button>
        )}
      </div>
    );
  }

  const isStudent = currentUserId === relationship.studentId;
  const counterpartName = isStudent
    ? relationship.mentorName || 'Industry Mentor'
    : relationship.studentName || 'Student Mentee';

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Relationship Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              {onBack && (
                <>
                  <button onClick={onBack} className="hover:text-indigo-600 transition-colors">
                    Mentorship Directory
                  </button>
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
              <span className="font-semibold text-indigo-600">Active Workspace</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                {relationship.topic}
              </h1>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  relationship.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : relationship.status === 'COMPLETED'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {relationship.status}
              </span>
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Collaborating with <span className="font-bold text-gray-800">{counterpartName}</span>
              {relationship.mentorOrganization && ` • ${relationship.mentorDesignation} (${relationship.mentorOrganization})`}
            </p>
          </div>

          {/* Quick Actions Drawer Controls */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors border border-indigo-200"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Chat
            </button>
            <button
              onClick={() => setIsNotesOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-lg transition-colors border border-gray-200"
            >
              <FileText className="w-3.5 h-3.5" /> Notes
            </button>
            <button
              onClick={() => setIsAiOpen(!isAiOpen)}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-lg transition-colors border border-purple-200"
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Coach
            </button>
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-lg transition-colors border border-amber-200"
            >
              <Star className="w-3.5 h-3.5" /> Review
            </button>
          </div>
        </div>

        {/* Objective & Progress Meter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="md:col-span-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Primary Objective
            </span>
            <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
              {relationship.primaryObjective || 'No objective recorded.'}
            </p>
          </div>

          {/* Overall Progress Widget */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-indigo-900 mb-1">
                <span>Milestone Completion</span>
                <span>{relationship.overallProgress}%</span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${relationship.overallProgress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-indigo-700 mt-2 pt-2 border-t border-indigo-100/60">
              <span>{relationship.completedGoals} of {relationship.totalGoals} goals done</span>
              <span>{relationship.completedSessions} sessions done</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Expandable Drawer */}
      {isAiOpen && (
        <AIMentorshipAssistantPanel
          relationshipTopic={relationship.topic}
          relationshipObjective={relationship.primaryObjective}
          mentorDesignation={relationship.mentorDesignation}
          token={token}
        />
      )}

      {/* Grid: 1. Goals Tracker & 2. Sessions Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. GOALS & MILESTONES */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-bold text-gray-900">Mentorship Goals & Milestones</h2>
            </div>
            <button
              onClick={() => setShowAddGoal(!showAddGoal)}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              <Plus className="w-3.5 h-3.5" /> Add Goal
            </button>
          </div>

          {showAddGoal && (
            <form onSubmit={handleCreateGoal} className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2">
              <input
                type="text"
                required
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="e.g. Complete 5 System Design LeetCode problems"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none bg-white"
              />
              <div className="flex items-center justify-between">
                <select
                  value={newGoalPriority}
                  onChange={(e) => setNewGoalPriority(e.target.value as any)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white text-gray-700"
                >
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddGoal(false)}
                    className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Save Goal
                  </button>
                </div>
              </div>
            </form>
          )}

          {goals.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No goals created yet. Set targeted milestones with your mentor!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-gray-900 leading-snug">
                      {goal.title}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          goal.priority === 'HIGH'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {goal.priority}
                      </span>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Delete goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={10}
                      value={goal.progress}
                      onChange={(e) => handleUpdateGoalProgress(goal.id, Number(e.target.value))}
                      className="flex-1 accent-indigo-600 cursor-pointer"
                    />
                    <span className="text-xs font-mono font-bold text-indigo-700 min-w-8 text-right">
                      {goal.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. SESSIONS & SCHEDULING */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-bold text-gray-900">Mentorship Sessions</h2>
            </div>
            <button
              onClick={() => setIsScheduleOpen(true)}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              <Plus className="w-3.5 h-3.5" /> Book Session
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No sessions scheduled yet.</p>
              <button
                onClick={() => setIsScheduleOpen(true)}
                className="mt-3 text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
              >
                Schedule First 1-on-1 Call
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-3.5 rounded-xl border border-gray-200 bg-white shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{sess.title}</h4>
                      <p className="text-[11px] text-gray-500">{sess.sessionTopic}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        sess.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sess.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {sess.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 pt-1 border-t border-gray-100">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {new Date(sess.scheduledStart).toLocaleDateString()} at{' '}
                      {new Date(sess.scheduledStart).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    <div className="flex items-center gap-2">
                      {sess.meetingLink && (
                        <a
                          href={sess.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white rounded-md text-[11px] font-semibold hover:bg-indigo-700"
                        >
                          <Video className="w-3 h-3" /> Join Room
                        </a>
                      )}
                      {sess.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleMarkSessionCompleted(sess.id)}
                          className="px-2 py-1 text-[11px] font-semibold text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Complete Relationship Footer */}
      {relationship.status === 'ACTIVE' && (
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleCompleteRelationship}
            className="text-xs font-semibold text-gray-500 hover:text-indigo-600"
          >
            Mark Overall Mentorship as Completed
          </button>
        </div>
      )}

      {/* Sub-modals & Drawers */}
      <SessionSchedulingModal
        relationshipId={relationshipId}
        defaultTopic={relationship.topic}
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSuccess={(sess) => setSessions((prev) => [sess, ...prev])}
        token={token}
      />

      <MentorshipMessagingDrawer
        relationshipId={relationshipId}
        currentUserId={currentUserId}
        counterpartName={counterpartName}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        token={token}
      />

      <MentorshipNotesDrawer
        relationshipId={relationshipId}
        currentUserId={currentUserId}
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        token={token}
      />

      <MentorshipFeedbackModal
        relationshipId={relationshipId}
        targetRoleLabel={isStudent ? 'Mentor' : 'Student'}
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSuccess={() => {}}
        token={token}
      />
    </div>
  );
};
