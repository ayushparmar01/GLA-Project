import React, { useState, useEffect } from 'react';
import {
  MockInterviewSessionData,
  MockInterviewQuestionData,
  InterviewCoachResponse,
} from '../../types';
import {
  fetchInterviewSessionByIdApi,
  saveMockInterviewAnswerApi,
  submitMockInterviewSessionApi,
  consultInterviewCoachApi,
} from '../../services/api';
import {
  Clock,
  Code2,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Bot,
  ChevronLeft,
  ChevronRight,
  Save,
  MessageSquare,
  ShieldAlert,
  X,
} from 'lucide-react';

interface MockInterviewSessionViewProps {
  token: string | null;
  sessionId: string;
  onInterviewCompleted: (session: MockInterviewSessionData) => void;
  onExit: () => void;
}

export const MockInterviewSessionView: React.FC<MockInterviewSessionViewProps> = ({
  token,
  sessionId,
  onInterviewCompleted,
  onExit,
}) => {
  const [session, setSession] = useState<MockInterviewSessionData | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [codeLanguage, setCodeLanguage] = useState<string>('typescript');
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);

  // Timer
  const [remainingSeconds, setRemainingSeconds] = useState<number>(1200);
  const [timerExpired, setTimerExpired] = useState<boolean>(false);

  // States
  const [loading, setLoading] = useState<boolean>(true);
  const [savingAnswer, setSavingAnswer] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // AI Coach Drawer
  const [showCoach, setShowCoach] = useState<boolean>(false);
  const [coachMode, setCoachMode] = useState<'PRACTICE' | 'MOCK'>('PRACTICE');
  const [coachLoading, setCoachLoading] = useState<boolean>(false);
  const [coachResponse, setCoachResponse] = useState<InterviewCoachResponse | null>(null);

  useEffect(() => {
    loadSession();
  }, [sessionId, token]);

  // Timer countdown
  useEffect(() => {
    if (remainingSeconds <= 0) {
      setTimerExpired(true);
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
      setTimeSpentSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds]);

  const loadSession = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchInterviewSessionByIdApi(sessionId, token);
      if (res.success && res.data) {
        setSession(res.data);
        const totalSecs = (res.data.durationMinutes || 20) * 60;
        setRemainingSeconds(totalSecs);

        // Load first question answer if present
        if (res.data.questions && res.data.questions.length > 0) {
          const firstQ = res.data.questions[0];
          const existingAns = res.data.answers?.find((a) => a.questionId === firstQ.id);
          if (existingAns) {
            setCurrentAnswer(existingAns.answerText);
            if (existingAns.codeLanguage) setCodeLanguage(existingAns.codeLanguage);
          } else if (firstQ.starterCode) {
            setCurrentAnswer(firstQ.starterCode);
          }
        }
      } else {
        setErrorMessage(res.error?.message || 'Failed to load interview session.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error loading session.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchQuestion = async (newIndex: number) => {
    if (!session || !session.questions[newIndex]) return;

    // Autosave current answer before switching
    if (currentAnswer.trim()) {
      await handleSaveAnswer(false);
    }

    setCurrentIndex(newIndex);
    const nextQ = session.questions[newIndex];
    const existingAns = session.answers?.find((a) => a.questionId === nextQ.id);

    if (existingAns) {
      setCurrentAnswer(existingAns.answerText);
      if (existingAns.codeLanguage) setCodeLanguage(existingAns.codeLanguage);
    } else {
      setCurrentAnswer(nextQ.starterCode || '');
    }

    setCoachResponse(null);
  };

  const handleSaveAnswer = async (showToast: boolean = true) => {
    if (!token || !session) return;
    const currentQ = session.questions[currentIndex];
    if (!currentQ) return;

    setSavingAnswer(true);
    setSaveNotice(null);
    try {
      const res = await saveMockInterviewAnswerApi(
        sessionId,
        {
          questionId: currentQ.id,
          answerText: currentAnswer,
          answerType: currentQ.questionType === 'CODING' ? 'CODE' : 'TEXT',
          codeLanguage: currentQ.questionType === 'CODING' ? codeLanguage : undefined,
          timeSpentSeconds,
        },
        token
      );

      if (res.success && res.data) {
        setSession(res.data);
        if (showToast) {
          setSaveNotice('Answer saved successfully.');
          setTimeout(() => setSaveNotice(null), 3000);
        }
      }
    } catch {
      // Non-blocking autosave error
    } finally {
      setSavingAnswer(false);
    }
  };

  const handleSubmitInterview = async () => {
    if (!token || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);

    // Save final answer
    await handleSaveAnswer(false);

    try {
      const res = await submitMockInterviewSessionApi(sessionId, token);
      if (res.success && res.data) {
        onInterviewCompleted(res.data);
      } else {
        setErrorMessage(res.error?.message || 'Failed to submit interview.');
        setSubmitting(false);
        setShowSubmitModal(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error during submission.');
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const handleAskCoach = async (queryType: 'HINT' | 'CONCEPT_EXPLANATION' | 'STRUCTURE_ADVICE' | 'FOLLOWUP_QUESTION') => {
    if (!token || !session) return;
    const currentQ = session.questions[currentIndex];
    if (!currentQ) return;

    setCoachLoading(true);
    try {
      const res = await consultInterviewCoachApi(
        {
          sessionId,
          questionId: currentQ.id,
          mode: coachMode,
          queryType,
          studentInput: currentAnswer,
        },
        token
      );

      if (res.success && res.data) {
        setCoachResponse(res.data);
      }
    } catch {
      // Ignore background error
    } finally {
      setCoachLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Preparing Mock Interview Session...</h3>
        <p className="text-xs text-slate-500">Initializing timer and personalized question rubrics.</p>
      </div>
    );
  }

  if (errorMessage && !session) {
    return (
      <div className="max-w-xl mx-auto py-12 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs text-center space-y-3">
        <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
        <h4 className="text-sm font-bold">Unable to load interview session</h4>
        <p>{errorMessage}</p>
        <button onClick={onExit} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-semibold text-xs">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!session) return null;

  const currentQuestion: MockInterviewQuestionData = session.questions[currentIndex];
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const wordCount = currentAnswer.split(/\s+/).filter(Boolean).length;
  const isTimeCritical = remainingSeconds <= 300;

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-5 animate-fadeIn">
      {/* Top Session Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
              {session.interviewType.replace('_', ' ')} INTERVIEW
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium">
              {session.difficulty}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white">{session.targetRole} Mock Session</h2>
        </div>

        {/* Live Timer and Coach Trigger */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-sm font-bold shadow-xs ${
              isTimeCritical
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-200 border-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          <button
            onClick={() => setShowCoach(!showCoach)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <Bot className="w-4 h-4 text-purple-200" />
            AI Coach
          </button>
        </div>
      </div>

      {/* Progress Bar & Question Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
        <span className="text-xs font-bold text-slate-600 whitespace-nowrap mr-2">
          Question {currentIndex + 1} of {session.questions.length}
        </span>
        <div className="flex items-center gap-1.5 flex-1 max-w-md">
          {session.questions.map((q, idx) => {
            const hasAnswer = session.answers?.some((a) => a.questionId === q.id && a.answerText.trim().length > 0);
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.id}
                onClick={() => handleSwitchQuestion(idx)}
                className={`h-7 w-7 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                  isCurrent
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                    : hasAnswer
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow-xs transition"
        >
          Submit Interview
        </button>
      </div>

      {/* Main Question & Answer Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            {/* Question Details */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                  Topic: {currentQuestion.topic}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  Type: {currentQuestion.questionType}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {currentQuestion.questionText}
              </h3>

              {currentQuestion.expectedConcepts && currentQuestion.expectedConcepts.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 font-medium">Expected Concepts:</span>
                  {currentQuestion.expectedConcepts.map((concept, cIdx) => (
                    <span
                      key={cIdx}
                      className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-medium"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Answer Editor */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  {currentQuestion.questionType === 'CODING' ? (
                    <>
                      <Code2 className="w-4 h-4 text-indigo-600" />
                      Code Solution Editor
                    </>
                  ) : (
                    'Your Response'
                  )}
                </span>

                <div className="flex items-center gap-3">
                  {currentQuestion.questionType === 'CODING' && (
                    <select
                      value={codeLanguage}
                      onChange={(e) => setCodeLanguage(e.target.value)}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-[11px]"
                    >
                      <option value="typescript">TypeScript</option>
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                    </select>
                  )}
                  <span className="text-slate-400 font-medium">{wordCount} words</span>
                </div>
              </div>

              {/* Monospace Code Editor vs Text Area */}
              {currentQuestion.questionType === 'CODING' ? (
                <textarea
                  rows={14}
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="// Write your code and computational complexity analysis here..."
                  className="w-full font-mono text-xs p-4 bg-slate-950 text-emerald-400 rounded-xl border border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed resize-y"
                  spellCheck={false}
                />
              ) : (
                <textarea
                  rows={9}
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder={
                    currentQuestion.category === 'BEHAVIORAL'
                      ? 'Structure your answer using STAR:\n• Situation: The background or context\n• Task: What you needed to achieve\n• Action: The specific actions you took\n• Result: The positive outcome and lessons learned'
                      : 'Formulate a structured response with clear definitions, architecture principles, and concrete examples...'
                  }
                  className="w-full text-xs p-3.5 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed resize-y"
                />
              )}

              {saveNotice && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{saveNotice}</span>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => handleSaveAnswer(true)}
                disabled={savingAnswer}
                className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-lg flex items-center gap-1.5 transition"
              >
                <Save className="w-3.5 h-3.5" />
                {savingAnswer ? 'Saving...' : 'Save Draft'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSwitchQuestion(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-lg disabled:opacity-40 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>

                {currentIndex < session.questions.length - 1 ? (
                  <button
                    onClick={() => handleSwitchQuestion(currentIndex + 1)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg flex items-center gap-1 transition"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition shadow-xs"
                  >
                    Finish &amp; Submit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Interview Coach Drawer / Widget */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">AI Interview Coach</h4>
                  <span className="text-[10px] text-slate-400">Preparation Companion</span>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  onClick={() => setCoachMode('PRACTICE')}
                  className={`px-2 py-0.5 rounded-md transition ${
                    coachMode === 'PRACTICE' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Practice
                </button>
                <button
                  onClick={() => setCoachMode('MOCK')}
                  className={`px-2 py-0.5 rounded-md transition ${
                    coachMode === 'MOCK' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Mock Mode
                </button>
              </div>
            </div>

            {coachMode === 'MOCK' ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                  <ShieldAlert className="w-4 h-4 text-slate-500" />
                  <span>Real Exam Condition</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Hints and expected solutions are strictly locked during mock interview mode to simulate authentic interview pressure.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-500">
                  Stuck or need guidance on framing your thoughts? Select an assistance tool:
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleAskCoach('HINT')}
                    disabled={coachLoading}
                    className="p-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 font-semibold text-left transition"
                  >
                    💡 Get a Hint
                  </button>

                  <button
                    onClick={() => handleAskCoach('STRUCTURE_ADVICE')}
                    disabled={coachLoading}
                    className="p-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 font-semibold text-left transition"
                  >
                    📐 Structure Advice
                  </button>

                  <button
                    onClick={() => handleAskCoach('CONCEPT_EXPLANATION')}
                    disabled={coachLoading}
                    className="p-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 font-semibold text-left transition"
                  >
                    📖 Explain Concept
                  </button>

                  <button
                    onClick={() => handleAskCoach('FOLLOWUP_QUESTION')}
                    disabled={coachLoading}
                    className="p-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 font-semibold text-left transition"
                  >
                    🎯 Follow-up Test
                  </button>
                </div>

                {coachLoading && (
                  <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
                    <span>Synthesizing coaching advice...</span>
                  </div>
                )}

                {coachResponse && (
                  <div className="p-3.5 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl space-y-2 text-xs animate-fadeIn">
                    <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Coach Recommendation:
                    </div>
                    <p className="text-slate-700 leading-relaxed">{coachResponse.response}</p>
                    <span className="text-[10px] text-slate-400 block pt-1 border-t border-indigo-100/50">
                      {coachResponse.disclaimer}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Submit Mock Interview?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You are about to complete your session. Our multi-rubric AI evaluation engine will assess technical correctness, STAR structure, and computational complexity to generate detailed feedback.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50"
              >
                Continue Answering
              </button>

              <button
                onClick={handleSubmitInterview}
                disabled={submitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
              >
                {submitting ? 'Evaluating Answers...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
