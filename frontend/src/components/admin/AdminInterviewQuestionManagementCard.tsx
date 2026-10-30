import React, { useState, useEffect } from 'react';
import {
  AdminInterviewQuestionData,
  MockInterviewType,
  MockInterviewDifficulty,
} from '../../types';
import {
  fetchQuestionBankApi,
  createAdminQuestionApi,
  deleteAdminQuestionApi,
  fetchAdminInterviewAnalyticsApi,
} from '../../services/api';
import {
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  RefreshCw,
  Search,
  Filter,
  Code2,
  Users,
  Target,
  Briefcase,
} from 'lucide-react';

interface AdminInterviewQuestionManagementCardProps {
  token: string | null;
}

export const AdminInterviewQuestionManagementCard: React.FC<AdminInterviewQuestionManagementCardProps> = ({
  token,
}) => {
  const [questions, setQuestions] = useState<AdminInterviewQuestionData[]>([]);
  const [analytics, setAnalytics] = useState<{
    totalSessionsInitiated: number;
    totalSessionsCompleted: number;
    activeQuestionsInBank: number;
    averageEvaluationScore: number;
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New question form modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formQuestionText, setFormQuestionText] = useState<string>('');
  const [formCategory, setFormCategory] = useState<MockInterviewType>('TECHNICAL');
  const [formTopic, setFormTopic] = useState<string>('');
  const [formRole, setFormRole] = useState<string>('Software Engineer');
  const [formDifficulty, setFormDifficulty] = useState<MockInterviewDifficulty>('INTERMEDIATE');
  const [formExpectedConcepts, setFormExpectedConcepts] = useState<string>('');
  const [formSuggestedApproach, setFormSuggestedApproach] = useState<string>('');

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, [token, categoryFilter]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [questionsRes, analyticsRes] = await Promise.all([
        fetchQuestionBankApi(
          { category: categoryFilter !== 'ALL' ? categoryFilter : undefined },
          token
        ),
        fetchAdminInterviewAnalyticsApi(token),
      ]);

      if (questionsRes.success && questionsRes.data) {
        setQuestions(questionsRes.data as any);
      }
      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }
    } catch {
      // Non-blocking load error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !formQuestionText.trim() || !formTopic.trim()) return;

    setSubmitting(true);
    setMessage(null);
    try {
      const concepts = formExpectedConcepts
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const res = await createAdminQuestionApi(
        {
          questionText: formQuestionText.trim(),
          category: formCategory,
          topic: formTopic.trim(),
          role: formRole.trim(),
          difficulty: formDifficulty,
          expectedConcepts: concepts,
          suggestedApproach: formSuggestedApproach.trim(),
        },
        token
      );

      if (res.success && res.data) {
        setMessage({ text: 'Question added to Question Bank.', type: 'success' });
        setShowAddModal(false);
        setFormQuestionText('');
        setFormTopic('');
        setFormExpectedConcepts('');
        setFormSuggestedApproach('');
        loadData();
      } else {
        setMessage({ text: res.error?.message || 'Failed to create question.', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Error creating question.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!token) return;
    try {
      const res = await deleteAdminQuestionApi(questionId, token);
      if (res.success) {
        setMessage({ text: 'Question archived from bank.', type: 'success' });
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      }
    } catch {
      // Ignore
    }
  };

  const filteredQuestions = questions.filter(
    (q) =>
      q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            Interview Question Bank &amp; Platform Oversight · Phase 14
          </div>
          <h3 className="text-lg font-bold text-slate-900">Admin Interview Question Governance</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Curate technical, HR, behavioral, and role-specific interview rubrics.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Question to Bank
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Aggregate Analytics Bar */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs pt-1">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="block text-xl font-black text-slate-900">{analytics.totalSessionsInitiated}</span>
            <span className="text-[11px] text-slate-500">Sessions Initiated</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="block text-xl font-black text-emerald-800">{analytics.totalSessionsCompleted}</span>
            <span className="text-[11px] text-emerald-600">Sessions Completed</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
            <span className="block text-xl font-black text-blue-800">{analytics.activeQuestionsInBank}</span>
            <span className="text-[11px] text-blue-600">Active Questions in Bank</span>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
            <span className="block text-xl font-black text-purple-800">{analytics.averageEvaluationScore}%</span>
            <span className="text-[11px] text-purple-600">Average Platform Score</span>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions by text or topic..."
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="TECHNICAL">Technical / DSA</option>
            <option value="HR">HR &amp; Culture</option>
            <option value="BEHAVIORAL">Behavioral</option>
            <option value="ROLE_SPECIFIC">Role Specific</option>
          </select>
        </div>
      </div>

      {/* Questions Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading Question Bank...</div>
      ) : filteredQuestions.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">No questions found matching criteria.</div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold text-[10px]">
                      {q.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold text-[10px]">
                      {q.topic}
                    </span>
                    <span className="text-[10px] text-slate-400">{q.difficulty}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{q.questionText}</h4>
                </div>

                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition"
                  title="Archive question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {q.suggestedApproach && (
                <p className="text-[11px] text-slate-600 italic">
                  Suggested Approach: {q.suggestedApproach}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add New Question to Bank</h3>
            <form onSubmit={handleCreateQuestion} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Question Statement</label>
                <textarea
                  rows={3}
                  required
                  value={formQuestionText}
                  onChange={(e) => setFormQuestionText(e.target.value)}
                  placeholder="Enter the complete question prompt..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as MockInterviewType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="TECHNICAL">Technical</option>
                    <option value="HR">HR &amp; Culture</option>
                    <option value="BEHAVIORAL">Behavioral</option>
                    <option value="ROLE_SPECIFIC">Role Specific</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Topic</label>
                  <input
                    type="text"
                    required
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="e.g. React, SQL, STAR"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as MockInterviewDifficulty)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Role</label>
                  <input
                    type="text"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Expected Concepts (comma separated)</label>
                <input
                  type="text"
                  value={formExpectedConcepts}
                  onChange={(e) => setFormExpectedConcepts(e.target.value)}
                  placeholder="e.g. ACID, B-Tree, O(log N)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Suggested Model Approach</label>
                <textarea
                  rows={2}
                  value={formSuggestedApproach}
                  onChange={(e) => setFormSuggestedApproach(e.target.value)}
                  placeholder="Outline the core recommended approach for evaluating candidate answers..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold"
                >
                  {submitting ? 'Adding...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
