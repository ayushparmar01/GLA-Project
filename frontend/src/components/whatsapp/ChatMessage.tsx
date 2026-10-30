import React from 'react';
import { CheckCheck, Sparkles } from 'lucide-react';

export interface ChatMessageData {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isSimulatedNotification?: boolean;
  notificationType?: string;
  quickReplies?: string[];
}

interface ChatMessageProps {
  message: ChatMessageData;
  onQuickReplyClick?: (replyText: string) => void;
}

/**
 * Parses simple WhatsApp formatting (*bold*, _italic_, newlines) into React nodes.
 */
function formatWhatsAppText(text: string): React.ReactNode[] {
  // Split by newlines first
  const lines = text.split('\n');

  return lines.map((line, lineIndex) => {
    // Process markdown *bold* and _italic_
    const parts: React.ReactNode[] = [];
    const regex = /(\*[^*]+\*|_[^_]+_)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }

      const matchText = match[0];
      if (matchText.startsWith('*') && matchText.endsWith('*')) {
        parts.push(
          <strong key={`${lineIndex}-${match.index}`} className="font-bold text-slate-900">
            {matchText.slice(1, -1)}
          </strong>
        );
      } else if (matchText.startsWith('_') && matchText.endsWith('_')) {
        parts.push(
          <em key={`${lineIndex}-${match.index}`} className="italic text-slate-700">
            {matchText.slice(1, -1)}
          </em>
        );
      }

      lastIndex = match.index + matchText.length;
    }

    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    return (
      <React.Fragment key={lineIndex}>
        {parts.length > 0 ? parts : ' '}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onQuickReplyClick }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-3`}>
      {/* Simulated notification tag */}
      {message.isSimulatedNotification && (
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1 shadow-2xs">
          <span>SIMULATED {message.notificationType || 'NOTIFICATION'}</span>
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] shadow-sm relative leading-relaxed ${
          isUser
            ? 'bg-[#dcf8c6] text-slate-900 rounded-tr-xs border border-emerald-200/50'
            : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/80'
        }`}
      >
        {/* Message Content */}
        <div className="whitespace-pre-wrap break-words">{formatWhatsAppText(message.text)}</div>

        {/* Timestamp and Delivery Status */}
        <div className="text-[10px] text-slate-400 text-right mt-1.5 flex items-center justify-end gap-1 select-none font-medium">
          <span>{message.timestamp}</span>
          {isUser && <CheckCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
        </div>
      </div>

      {/* Assistant Quick Reply Buttons (if provided) */}
      {!isUser && message.quickReplies && message.quickReplies.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%]">
          {message.quickReplies.map((reply, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onQuickReplyClick?.(reply)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs transition-colors cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>{reply}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
