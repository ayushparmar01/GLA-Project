import React, { useState, useEffect } from 'react';
import {
  MockInterviewSessionData,
  MockInterviewType,
  StudentInterviewAnalytics,
} from '../../types';
import {
  fetchStudentInterviewSessionsApi,
  fetchStudentInterviewAnalyticsApi,
} from '../../services/api';
import { InterviewConfigModal } from './InterviewConfigModal';
import { MockInterviewSessionView } from './MockInterviewSessionView';
import { InterviewFeedbackReportView } from './InterviewFeedbackReportView';
import { InterviewAnalyticsView } from './InterviewAnalyticsView';
import { InterviewPreparationRoadmapView } from './InterviewPreparationRoadmapView';
import {
  Sparkles,
  Award,
  Code2,
  Users,
  Target,
  Briefcase,
  FileText,
  Clock,
  Play,
  RotateCcw,
  BarChart3,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
} from 'lucide-react';

interface InterviewPreparationDashboardProps {
  token: string | null;
}

export const InterviewPreparationDashboard: React.FC<InterviewPreparationDashboardProps> = ({
  token,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'PRACTICE' | 'ANALYTICS' | 'ROADMAP'>('PRACTICE');
  const [sessions, setSessions] = useState<MockInterviewSessionData[]>([]);
  const [analytics, setAnalytics] = useState<StudentInterviewAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal & Active Session State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [modalInitialType, setModalInitialType] = useState<MockInterviewType>('TECHNICAL');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [reviewedSession, setReviewedSession] = useState<MockInterviewSessionData | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [token]);

  const loadDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [sessionsRes, analyticsRes] = await Promise.all([
        fetchStudentInterviewSessionsApi({ limit: 10 }, token),
        fetchStudentInterviewAnalyticsApi(token),
      ]);

      if (sessionsRes.success && sessionsRes.data) {
        setSessions(sessionsRes.data);
      }
      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }
    } catch {
      // Ignore background load error
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfig = (type: MockInterviewType) => {
    setModalInitialType(type);
    setIsConfigModalOpen(true);
  };

  const handleSessionStarted = (sessionId: string) => {
    setIsConfigModalOpen(false);
    setActiveSessionId(sessionId);
    setReviewedSession(null);
  };

  const handleInterviewCompleted = (completedSession: MockInterviewSessionData) => {
    setActiveSessionId(null);
    setReviewedSession(completedSession);
    loadDashboardData();
  };

  // If inside an active mock interview session
  if (activeSessionId) {
    return (
      <MockInterviewSessionView
        token={token}
        sessionId={activeSessionId}
        onInterviewCompleted={handleInterviewCompleted}
        onExit={() => {
          setActiveSessionId(null);
          loadDashboardData();
        }}
      />
    );
  }

  // If reviewing an evaluation feedback report
  if (reviewedSession) {
    return (
      <InterviewFeedbackReportView
        session={reviewedSession}
        onPracticeAgain={() => {
          setReviewedSession(null);
          setIsConfigModalOpen(true);
        }}
        onViewAnalytics={() => {
          setReviewedSession(null);
          setActiveSubTab('ANALYTICS');
        }}
        onExit={() => {
          setReviewedSession(null);
          loadDashboardData();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 text-white rounded-2xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Phase 14 AI Interview Preparation Platform
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              AI Mock Interview Practice
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Master technical, HR, behavioral, and job-description-based interviews. Receive real-time AI evaluation, algorithmic complexity analysis, and STAR coaching.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[110px]">
              <span className="block text-2xl font-bold text-emerald-400">
                {analytics?.completedSessions || 0}
              </span>
              <span className="text-xs text-slate-300 font-medium">Completed</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[110px]">
              <span className="block text-2xl font-bold text-white">
                {analytics?.averageScore || 0}%
              </span>
              <span className="text-xs text-slate-300 font-medium">Average Score</span>
            </div>

            <button
              onClick={() => handleOpenConfig('TECHNICAL')}
              className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition flex items-center gap-2"
            >
              <Play className="w-4 h-4 text-emerald-100" />
              Start New Interview
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('PRACTICE')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeSubTab === 'PRACTICE'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Code2 className="w-4 h-4" /> Mock Practice
        </button>

        <button
          onClick={() => setActiveSubTab('ANALYTICS')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeSubTab === 'ANALYTICS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Performance Analytics
        </button>

        <button
          onClick={() => setActiveSubTab('ROADMAP')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeSubTab === 'ROADMAP'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Preparation Roadmap
        </button>
      </div>

      {/* Active Sub-Tab View */}
      {activeSubTab === 'ANALYTICS' && (
        <InterviewAnalyticsView token={token} onPracticeTopic={() => handleOpenConfig('TECHNICAL')} />
      )}

      {activeSubTab === 'ROADMAP' && (
        <InterviewPreparationRoadmapView
          token={token}
          onStartTargetedPractice={() => handleOpenConfig('TECHNICAL')}
        />
      )}

      {activeSubTab === 'PRACTICE' && (
        <div className="space-y-6">
          {/* Category Cards Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-600" />
              Choose Interview Track
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. Technical */}
              <div
                onClick={() => handleOpenConfig('TECHNICAL')}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-400 hover:shadow-md transition cursor-pointer space-y-3 flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    Technical &amp; DSA Interview
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Practice core programming, data structures, trees, graphs, sorting, DBMS, and complexity analysis.
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 pt-2 border-t border-slate-100">
                  Launch Technical Session →
                </span>
              </div>

              {/* 2. HR & Culture */}
              <div
                onClick={() => handleOpenConfig('HR')}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-400 hover:shadow-md transition cursor-pointer space-y-3 flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition">
                    HR &amp; Cultural Fit
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Refine self-introductions, career goals, strength/weakness explanations, and professional communication.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 pt-2 border-t border-slate-100">
                  Launch HR Session →
                </span>
              </div>

              {/* 3. Behavioral */}
              <div
                onClick={() => handleOpenConfig('BEHAVIORAL')}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-purple-400 hover:shadow-md transition cursor-pointer space-y-3 flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Target className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition">
                    Behavioral (STAR Framework)
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Structured scenario practice evaluating teamwork, leadership, conflict resolution, and adaptability.
                  </p>
                </div>
                <span className="text-xs font-bold text-purple-600 flex items-center gap-1 pt-2 border-t border-slate-100">
                  Launch STAR Session →
                </span>
              </div>

              {/* 4. Role Specific */}
              <div
                onClick={() => handleOpenConfig('ROLE_SPECIFIC')}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition cursor-pointer space-y-3 flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                    Role-Specific Engineering
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tailored for Full-Stack, Frontend (React), Backend (Node/SQL), or Data Analyst career profiles.
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-600 flex items-center gap-1 pt-2 border-t border-slate-100">
                  Launch Role Session →
                </span>
              </div>

              {/* 5. Job Description Specific */}
              <div
                onClick={() => handleOpenConfig('JOB_SPECIFIC')}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition cursor-pointer space-y-3 flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Target className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition">
                    Job-Description-Based
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Simulate real interview questions extracted directly from Phase 13 corporate placement drives.
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-600 flex items-center gap-1 pt-2 border-t border-slate-100">
                  Select Target Drive →
                </span>
              </div>

              {/* 6. Resume Based */}
              <div
                onClick={() => handleOpenConfig('RESUME_BASED')}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-400 hover:shadow-md transition cursor-pointer space-y-3 flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-teal-600 transition">
                    Resume Project Defense
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Practice defending your specific portfolio projects, technology selections, and architecture designs.
                  </p>
                </div>
                <span className="text-xs font-bold text-teal-600 flex items-center gap-1 pt-2 border-t border-slate-100">
                  Practice Project Defense →
                </span>
              </div>
            </div>
          </div>

          {/* Recent Mock Interview Sessions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Your Recent Mock Sessions</h3>
                <p className="text-xs text-slate-500">Review detailed evaluations and feedback reports.</p>
              </div>
              <span className="text-xs text-slate-400 font-semibold">{sessions.length} total attempts</span>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400 text-xs">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No mock sessions attempted yet</p>
                <p className="text-[11px] text-slate-400">Launch any track above to begin your preparation journey.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{s.targetRole}</span>
                        <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold text-[10px]">
                          {s.interviewType.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium text-[10px]">
                          {s.difficulty}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Date: {new Date(s.createdAt).toLocaleDateString()} • {s.questionCount} Questions
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {s.evaluation ? (
                        <div className="text-right">
                          <span className="text-base font-extrabold text-indigo-600 block">
                            {s.evaluation.overallScore}%
                          </span>
                          <span className="text-[10px] text-slate-400">Score</span>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-bold text-[11px]">
                          {s.status}
                        </span>
                      )}

                      {s.status === 'COMPLETED' ? (
                        <button
                          onClick={() => setReviewedSession(s)}
                          className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition"
                        >
                          Review Feedback →
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveSessionId(s.id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
                        >
                          Continue Session →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Config Wizard Modal */}
      <InterviewConfigModal
        token={token}
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSessionStarted={handleSessionStarted}
        initialType={modalInitialType}
      />
    </div>
  );
};
