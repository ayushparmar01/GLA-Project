import React, { useState, useRef, useEffect } from 'react';
import { ChatHeader, DemoActiveTab } from './ChatHeader';
import { ChatMessage, ChatMessageData } from './ChatMessage';
import { SuggestedQuestions } from './SuggestedQuestions';
import { ChatInput } from './ChatInput';
import { NotificationPreview } from './NotificationPreview';
import { DemoAccountStatus } from './DemoAccountStatus';
import {
  findBestAnswer,
  SimulatedNotification,
  DEMO_HONEST_FALLBACK,
} from './demoKnowledgeBase';
import { AlertCircle, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';

interface WhatsAppDemoAssistantProps {
  onClose?: () => void;
  isModal?: boolean;
}

const INITIAL_WELCOME_MESSAGE: ChatMessageData = {
  id: 'welcome-1',
  sender: 'assistant',
  text:
    '🎓 *Welcome to CareerBridge Assistant!* (DEMO MODE)\n\n' +
    'I am your AI placement companion for the *MISSION BHARAT Hackathon (Challenge #07)*.\n\n' +
    'How can I help you today? You can choose a quick topic below or type any question:\n\n' +
    '• *1.* Find Jobs & Campus Drives (Reply *1* or *JOBS*)\n' +
    '• *2.* Check Career Readiness Score (Reply *READINESS*)\n' +
    '• *3.* Voice Profile in Tamil / Kannada (Reply *PROFILE*)\n' +
    '• *4.* Track My Applications (Reply *APPLICATIONS*)\n' +
    '• *5.* Free Learning Hub & Mentors (Reply *SKILLS*)\n' +
    '• *6.* Fast-Track Employer Job Post (< 3 Mins)\n\n' +
    '_Tip: You can also explore the **Notification Previews** and **Simulated Linking** tabs above._',
  timestamp: '10:00 AM',
  quickReplies: [
    'What is CareerBridge?',
    'How can I check career readiness?',
    'How do I find suitable jobs?',
    'How can employers post jobs?',
  ],
};

export const WhatsAppDemoAssistant: React.FC<WhatsAppDemoAssistantProps> = ({
  onClose,
  isModal = true,
}) => {
  const [messages, setMessages] = useState<ChatMessageData[]>([INITIAL_WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<DemoActiveTab>('chat');
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isTyping, activeTab]);

  const handleSendMessage = (userText: string) => {
    if (!userText.trim() || isTyping) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessageData = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText.trim(),
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Natural assistant delay simulation (700ms - 1000ms)
    setTimeout(() => {
      const answer = findBestAnswer(userText);
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const assistantMsg: ChatMessageData = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: answer.reply,
        timestamp: replyTime,
        quickReplies: answer.quickReplies,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 750);
  };

  const handleTriggerNotificationInChat = (notification: SimulatedNotification) => {
    setActiveTab('chat');
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const notificationMsg: ChatMessageData = {
      id: `notif-${Date.now()}`,
      sender: 'assistant',
      text: notification.fullMessage,
      timestamp: timeStr,
      isSimulatedNotification: true,
      notificationType: notification.type,
      quickReplies: ['MENU', 'JOBS', 'READINESS'],
    };

    setMessages((prev) => [...prev, notificationMsg]);
  };

  const handleSimulateLinkingInChat = (statusText: string) => {
    setActiveTab('chat');
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const linkMsg: ChatMessageData = {
      id: `link-${Date.now()}`,
      sender: 'assistant',
      text: statusText,
      timestamp: timeStr,
      isSimulatedNotification: true,
      notificationType: 'ACCOUNT STATUS',
      quickReplies: ['MENU', 'JOBS', 'READINESS'],
    };

    setMessages((prev) => [...prev, linkMsg]);
  };

  const handleClearConversation = () => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setShowClearConfirm(false);
  };

  const content = (
    <div className="bg-[#efeae2] flex flex-col h-full overflow-hidden relative">
      {/* WhatsApp Background Subtle Pattern Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(#075e54 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
        }}
      />

      {/* Header */}
      <ChatHeader
        onClose={onClose}
        onClearChat={() => setShowClearConfirm(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        messageCount={messages.length}
      />

      {/* Notice Banner */}
      <div className="bg-amber-100/80 px-3 py-1.5 border-b border-amber-200/80 text-[10px] text-amber-900 text-center font-medium z-10 flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
        <span>
          <strong>Mission Bharat Interactive Assistant Simulator:</strong> Fast, grounded placement guidance strictly without external AI dependencies.
        </span>
      </div>

      {/* Main Tab Panels */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          {/* Conversation Stream */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-1">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onQuickReplyClick={(replyText) => handleSendMessage(replyText)}
              />
            ))}

            {/* Realistic Typing Indicator with Bouncing Dots */}
            {isTyping && (
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-white rounded-2xl rounded-tl-xs px-4 py-3 shadow-sm border border-slate-200/80 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"
                    style={{ animationDelay: '0.15s' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"
                    style={{ animationDelay: '0.3s' }}
                  />
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Assistant typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions Bar */}
          <SuggestedQuestions
            onSelectQuestion={(q) => handleSendMessage(q)}
            disabled={isTyping}
          />

          {/* Chat Input Bar */}
          <ChatInput
            onSend={(text) => handleSendMessage(text)}
            disabled={isTyping}
          />
        </div>
      )}

      {activeTab === 'notifications' && (
        <NotificationPreview onTriggerInChat={handleTriggerNotificationInChat} />
      )}

      {activeTab === 'linking' && (
        <DemoAccountStatus onSimulateLinkingInChat={handleSimulateLinkingInChat} />
      )}

      {/* Clear Conversation Confirmation Modal */}
      {showClearConfirm && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl border border-slate-200 space-y-3.5 text-center">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Clear conversation?</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will reset the interactive demo chat back to the initial welcome screen.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearConversation}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (!isModal) {
    return <div className="rounded-3xl overflow-hidden border border-slate-300 shadow-xl h-[680px]">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-300 flex flex-col h-[94vh] max-h-[720px] transition-all">
        {content}
      </div>
    </div>
  );
};
