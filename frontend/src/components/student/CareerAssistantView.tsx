import React, { useState, useEffect, useRef } from 'react';
import {
  sendCareerGuidanceApi,
  fetchAiConversationsApi,
  fetchAiConversationByIdApi,
} from '../../services/api';
import { AiConversationData, AiMessage } from '../../types';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Info,
  Clock,
  PlusCircle,
  MessageSquare,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  Cpu,
} from 'lucide-react';

interface CareerAssistantViewProps {
  token: string | null;
  onNavigateToRoadmaps?: () => void;
  onNavigateToInterview?: () => void;
  onNavigateToResources?: () => void;
}

const STARTER_PROMPTS = [
  'How can I prepare for Full-Stack developer campus drives?',
  'What are the most in-demand backend skills in India right now?',
  'How should I structure my resume with no prior internship experience?',
  'What are some strong project ideas to showcase on my GitHub profile?',
  'How do I answer "Tell me about a challenging bug you fixed" in an interview?',
];

export const CareerAssistantView: React.FC<CareerAssistantViewProps> = ({
  token,
  onNavigateToRoadmaps,
  onNavigateToInterview,
  onNavigateToResources,
}) => {
  const [conversations, setConversations] = useState<AiConversationData[]>([]);
  const [activeConversation, setActiveConversation] = useState<AiConversationData | null>(null);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, loading]);

  const loadConversations = async () => {
    setLoadingHistory(true);
    setErrorMessage(null);
    try {
      const res = await fetchAiConversationsApi(token);
      if (res.success && res.data) {
        setConversations(res.data);
        if (res.data.length > 0 && !activeConversation) {
          setActiveConversation(res.data[0]);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load conversation history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectConversation = async (convId: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetchAiConversationByIdApi(convId, token);
      if (res.success && res.data) {
        setActiveConversation(res.data);
      }
    } catch (err: any) {
      setErrorMessage('Could not load selected conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = () => {
    setActiveConversation(null);
    setInputMessage('');
    setErrorMessage(null);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    setInputMessage('');
    setLoading(true);
    setErrorMessage(null);

    // Optimistically add user message
    const tempUserMsg: AiMessage = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    if (activeConversation) {
      setActiveConversation({
        ...activeConversation,
        messages: [...activeConversation.messages, tempUserMsg],
      });
    }

    try {
      const res = await sendCareerGuidanceApi(
        text,
        activeConversation?.id,
        undefined,
        token
      );

      if (res.success && res.data) {
        setActiveConversation(res.data);
        // Refresh conversations list if new chat
        if (!activeConversation) {
          setConversations((prev) => [res.data!, ...prev]);
        } else {
          setConversations((prev) =>
            prev.map((c) => (c.id === res.data!.id ? res.data! : c))
          );
        }
      } else {
        setErrorMessage(res.error?.message || 'Failed to receive guidance. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error communicating with Career Assistant');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden min-h-[700px]">
      {/* Sidebar: Conversation History & Shortcuts */}
      <div className="lg:col-span-1 bg-slate-950/70 border-r border-slate-800 p-4 flex flex-col justify-between">
        <div>
          <button
            onClick={handleStartNewChat}
            className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            New Career Consultation
          </button>

          <div className="mb-3 px-2 flex items-center justify-between text-xs font-semibold text-slate-400 tracking-wider uppercase">
            <span>Recent Chats</span>
            <span className="text-slate-500">{conversations.length}</span>
          </div>

          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {loadingHistory ? (
              <div className="text-center py-6 text-slate-500 text-xs">Loading sessions...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs italic">
                No past consultations yet. Start a new chat!
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = activeConversation?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-slate-800 text-white font-medium border border-slate-700'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-indigo-400 shrink-0" />
                    <div className="truncate flex-1">
                      <p className="truncate">{conv.title || 'Career Discussion'}</p>
                      <span className="text-[10px] text-slate-500">
                        {conv.messages.length} messages
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Career Tools */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Related Guidance Tools
          </p>
          {onNavigateToRoadmaps && (
            <button
              onClick={onNavigateToRoadmaps}
              className="w-full text-left px-3 py-2 rounded-lg text-xs text-indigo-300 hover:bg-indigo-950/40 hover:text-indigo-200 transition-colors flex items-center justify-between"
            >
              <span>Personalized Roadmaps</span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </button>
          )}
          {onNavigateToInterview && (
            <button
              onClick={onNavigateToInterview}
              className="w-full text-left px-3 py-2 rounded-lg text-xs text-emerald-300 hover:bg-emerald-950/40 hover:text-emerald-200 transition-colors flex items-center justify-between"
            >
              <span>Mock Interview Prep</span>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          )}
          {onNavigateToResources && (
            <button
              onClick={onNavigateToResources}
              className="w-full text-left px-3 py-2 rounded-lg text-xs text-amber-300 hover:bg-amber-950/40 hover:text-amber-200 transition-colors flex items-center justify-between"
            >
              <span>Curated Learning Links</span>
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="lg:col-span-3 flex flex-col justify-between h-[700px] p-4 lg:p-6">
        {/* Chat Header */}
        <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-base flex items-center gap-2">
                CareerBridge AI Career Advisor
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Always Available
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Ground-level placement guidance tailored for students in colleges without active placement cells
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Deterministic Fallback Enabled</span>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
          {(!activeConversation || activeConversation.messages.length === 0) && (
            <div className="py-8 px-4 text-center max-w-xl mx-auto space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg">
                <Sparkles className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white">How can I guide your career today?</h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Ask questions regarding high-demand skills, off-campus drive strategies, resume formatting, project portfolios, or interview preparation.
                </p>
              </div>

              {/* Starter chips */}
              <div className="space-y-2 text-left">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Suggested topics to get started:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {STARTER_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left text-xs px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center justify-between group"
                    >
                      <span>{prompt}</span>
                      <Send className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeConversation?.messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs ${
                    isUser
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 border border-slate-700 text-indigo-400'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className="space-y-1">
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700 rounded-tl-none shadow-md'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {!isUser && msg.isFallback && (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-400/90 px-1">
                      <Info className="w-3 h-3 shrink-0" />
                      <span>
                        Deterministic Guidance Engine — grounded in Bharat placement syllabus
                      </span>
                    </div>
                  )}

                  <div
                    className={`text-[10px] text-slate-500 px-1 ${
                      isUser ? 'text-right' : 'text-left'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-[80%] mr-auto">
              <div className="w-8 h-8 rounded-lg shrink-0 bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 rounded-tl-none text-slate-400 text-xs flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                <div
                  className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
                <span className="ml-1 text-slate-400">Synthesizing personalized guidance...</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="pt-3 border-t border-slate-800">
          <div className="relative rounded-xl bg-slate-950 border border-slate-800 focus-within:border-indigo-500 transition-colors">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about placement preparation, required skills, interview tips, or roadmaps..."
              rows={2}
              className="w-full bg-transparent px-4 py-3 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none resize-none pr-12"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || loading}
              className="absolute right-3 bottom-3 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all shadow-md"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 text-center">
            CareerBridge Advisor uses transparent deterministic guidance designed specifically for Tier-2/3 college students.
          </p>
        </div>
      </div>
    </div>
  );
};
