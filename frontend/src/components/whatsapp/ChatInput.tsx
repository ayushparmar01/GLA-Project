import React, { useState } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type a message or question...',
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-2.5 sm:p-3 bg-white border-t border-slate-200 flex items-center gap-2"
    >
      {/* Decorative WhatsApp Style Icons */}
      <div className="flex items-center text-slate-400 gap-1 hidden xs:flex">
        <button
          type="button"
          className="p-1.5 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          title="Demo simulation emoji"
          tabIndex={-1}
        >
          <Smile className="w-5 h-5" />
        </button>
        <button
          type="button"
          className="p-1.5 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          title="Demo simulation attachment"
          tabIndex={-1}
        >
          <Paperclip className="w-5 h-5" />
        </button>
      </div>

      {/* Input Field */}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        aria-label="Type message"
        className="flex-1 px-4 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-white border border-slate-300 rounded-full focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      />

      {/* Send Button */}
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        aria-label="Send message"
        className="p-2.5 rounded-full bg-[#075e54] text-white hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
};
