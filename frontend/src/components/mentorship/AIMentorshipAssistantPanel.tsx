import React, { useState } from 'react';
import {
  MentorshipAiAgendaResponse,
  MentorshipAiQuestionsResponse,
  MentorshipAiNotesSummaryResponse,
} from '../../types';
import {
  aiPrepareMentorshipAgendaApi,
  aiSuggestMentorshipQuestionsApi,
  aiSummarizeMentorshipNotesApi,
} from '../../services/api';
import {
  Sparkles,
  Clock,
  HelpCircle,
  FileText,
  CheckCircle2,
  ListOrdered,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

interface AIMentorshipAssistantPanelProps {
  relationshipTopic: string;
  relationshipObjective: string;
  mentorDesignation?: string;
  token?: string | null;
}

export const AIMentorshipAssistantPanel: React.FC<AIMentorshipAssistantPanelProps> = ({
  relationshipTopic,
  relationshipObjective,
  mentorDesignation,
  token,
}) => {
  const [activeTool, setActiveTool] = useState<'AGENDA' | 'QUESTIONS' | 'NOTES'>('AGENDA');

  // Agenda tool state
  const [agendaTopic, setAgendaTopic] = useState(relationshipTopic);
  const [agendaObjective, setAgendaObjective] = useState(relationshipObjective);
  const [agendaResult, setAgendaResult] = useState<MentorshipAiAgendaResponse | null>(null);
  const [loadingAgenda, setLoadingAgenda] = useState(false);

  // Questions tool state
  const [questionTopic, setQuestionTopic] = useState(relationshipTopic);
  const [questionsResult, setQuestionsResult] = useState<MentorshipAiQuestionsResponse | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Notes tool state
  const [rawNotes, setRawNotes] = useState('');
  const [notesResult, setNotesResult] = useState<MentorshipAiNotesSummaryResponse | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAgenda = async () => {
    setLoadingAgenda(true);
    setError(null);
    try {
      const res = await aiPrepareMentorshipAgendaApi(
        {
          topic: agendaTopic,
          objective: agendaObjective,
          mentorDesignation,
        },
        token
      );
      if (res.success && res.data) {
        setAgendaResult(res.data);
      } else {
        setError(res.error?.message || 'Failed to generate agenda');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with AI service');
    } finally {
      setLoadingAgenda(false);
    }
  };

  const handleGenerateQuestions = async () => {
    setLoadingQuestions(true);
    setError(null);
    try {
      const res = await aiSuggestMentorshipQuestionsApi(
        {
          topic: questionTopic,
          objective: relationshipObjective,
        },
        token
      );
      if (res.success && res.data) {
        setQuestionsResult(res.data);
      } else {
        setError(res.error?.message || 'Failed to suggest questions');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with AI service');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSummarizeNotes = async () => {
    if (!rawNotes.trim()) {
      setError('Please provide raw notes before summarizing.');
      return;
    }
    setLoadingNotes(true);
    setError(null);
    try {
      const res = await aiSummarizeMentorshipNotesApi(
        {
          rawNotes,
          topic: relationshipTopic,
        },
        token
      );
      if (res.success && res.data) {
        setNotesResult(res.data);
      } else {
        setError(res.error?.message || 'Failed to summarize notes');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with AI service');
    } finally {
      setLoadingNotes(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 px-5 py-4 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-gray-900">AI Mentorship Assistant</h3>
            <p className="text-[11px] text-gray-500">
              Prepare professional agendas, questions, and action-oriented summaries
            </p>
          </div>
        </div>

        {/* Tool Switcher */}
        <div className="flex bg-white/80 border border-gray-200 rounded-lg p-0.5 gap-1">
          <button
            onClick={() => setActiveTool('AGENDA')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTool === 'AGENDA'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Session Agenda
          </button>
          <button
            onClick={() => setActiveTool('QUESTIONS')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTool === 'QUESTIONS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Ask Mentor
          </button>
          <button
            onClick={() => setActiveTool('NOTES')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTool === 'NOTES'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Summarize Notes
          </button>
        </div>
      </div>

      {error && (
        <div className="m-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. SESSION AGENDA TOOL */}
      {activeTool === 'AGENDA' && (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Session Topic</label>
              <input
                type="text"
                value={agendaTopic}
                onChange={(e) => setAgendaTopic(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target Objective</label>
              <input
                type="text"
                value={agendaObjective}
                onChange={(e) => setAgendaObjective(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateAgenda}
            disabled={loadingAgenda}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {loadingAgenda ? 'Generating 45-Min Agenda...' : 'Generate Structured 45-Min Agenda'}
          </button>

          {agendaResult && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" /> 45-Minute Session Timeline
                </span>
                {agendaResult.isFallback && (
                  <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    Deterministic Template
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {agendaResult.agendaItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex items-start gap-3"
                  >
                    <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                      {item.timeSlot}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{item.topic}</h4>
                      <p className="text-xs text-gray-600 mt-0.5">{item.notes}</p>
                    </div>
                  </div>
                ))}
              </div>

              {agendaResult.suggestedPreparation && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3">
                  <h4 className="text-xs font-bold text-amber-900 mb-1">Pre-Session Checklist:</h4>
                  <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                    {agendaResult.suggestedPreparation.map((prep, i) => (
                      <li key={i}>{prep}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. ASK MENTOR TOOL */}
      {activeTool === 'QUESTIONS' && (
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              What topic do you want thoughtful questions for?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={questionTopic}
                onChange={(e) => setQuestionTopic(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                onClick={handleGenerateQuestions}
                disabled={loadingQuestions}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap"
              >
                {loadingQuestions ? 'Analyzing...' : 'Suggest 5 Questions'}
              </button>
            </div>
          </div>

          {questionsResult && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-purple-600" /> High-Impact Questions for Mentor
                </span>
                {questionsResult.isFallback && (
                  <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    Curated Industry Questions
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                {questionsResult.suggestedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-purple-50/50 border border-purple-100 rounded-lg space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded">
                        {q.category}
                      </span>
                      <button
                        onClick={() => copyToClipboard(q.question)}
                        className="text-[11px] text-gray-500 hover:text-purple-700 flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        Copy
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-gray-900">"{q.question}"</p>
                    <p className="text-[11px] text-gray-500">{q.purpose}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. SUMMARIZE NOTES TOOL */}
      {activeTool === 'NOTES' && (
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Paste Rough Session Notes:
            </label>
            <textarea
              rows={4}
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="Paste raw notes taken during the mentorship call..."
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          <button
            onClick={handleSummarizeNotes}
            disabled={loadingNotes}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            {loadingNotes ? 'Extracting Action Items...' : 'Extract Key Takeaways & Action Items'}
          </button>

          {notesResult && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <h4 className="text-xs font-bold text-gray-800 mb-1">Executive Summary</h4>
                <p className="text-xs text-gray-600">{notesResult.summary}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Key Takeaways
                </h4>
                <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                  {notesResult.keyTakeaways.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5 text-indigo-600" /> Action Items
                </h4>
                <div className="space-y-2">
                  {notesResult.actionItems.map((action, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-lg flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-gray-900">{action.item}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-white text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded">
                          {action.assignee}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            action.priority === 'HIGH'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {action.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
