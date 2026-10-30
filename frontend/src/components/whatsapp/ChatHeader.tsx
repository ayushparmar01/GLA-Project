import React from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  X,
  Trash2,
  Bell,
  MessageSquare,
  Sparkles,
  Link2,
} from 'lucide-react';

export type DemoActiveTab = 'chat' | 'notifications' | 'linking';

interface ChatHeaderProps {
  onClose?: () => void;
  onClearChat?: () => void;
  activeTab: DemoActiveTab;
  onSelectTab: (tab: DemoActiveTab) => void;
  messageCount: number;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onClose,
  onClearChat,
  activeTab,
  onSelectTab,
  messageCount,
}) => {
  return (
    <div className="bg-[#075e54] text-white flex flex-col shadow-md">
      {/* Top Bar */}
      <div className="p-3 sm:p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Back / Close"
              className="text-white/80 hover:text-white cursor-pointer p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Assistant Avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-emerald-800 border-2 border-emerald-400/40 flex items-center justify-center font-bold text-sm shadow-inner text-emerald-100">
              CB
            </div>
            {/* Online Indicator */}
            <span
              className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#075e54] rounded-full"
              title="Online Demo Assistant"
            />
          </div>

          <div>
            <div className="text-sm font-bold flex items-center gap-1.5 leading-tight">
              <span>CareerBridge Assistant</span>
              <ShieldCheck
                className="w-4 h-4 text-emerald-300 fill-emerald-300 shrink-0"
                aria-label="Verified Account"
              />
            </div>
            <div className="flex items-center gap-2 text-[11px] text-emerald-200">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span>Online Demo</span>
              </span>
              <span className="text-emerald-300/40">•</span>
              <span className="text-emerald-200/90 hidden xs:inline">Mission Bharat #07</span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Prominent DEMO MODE Badge */}
          <span className="text-[10px] font-extrabold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-950 animate-ping" />
            DEMO MODE
          </span>

          {onClearChat && messageCount > 1 && (
            <button
              type="button"
              onClick={onClearChat}
              title="Clear Conversation"
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Assistant"
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Segmented Navigation Bar */}
      <div className="flex items-center border-t border-emerald-800/80 bg-[#054c44] px-2 text-xs">
        <button
          type="button"
          onClick={() => onSelectTab('chat')}
          className={`flex-1 py-2 px-3 text-center font-medium border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'chat'
              ? 'border-emerald-300 text-emerald-100 font-bold bg-white/5'
              : 'border-transparent text-emerald-200/70 hover:text-emerald-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Interactive Chat</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('notifications')}
          className={`flex-1 py-2 px-3 text-center font-medium border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'notifications'
              ? 'border-emerald-300 text-emerald-100 font-bold bg-white/5'
              : 'border-transparent text-emerald-200/70 hover:text-emerald-100'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notification Previews</span>
          <span className="bg-amber-400 text-amber-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
            5
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('linking')}
          className={`flex-1 py-2 px-3 text-center font-medium border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'linking'
              ? 'border-emerald-300 text-emerald-100 font-bold bg-white/5'
              : 'border-transparent text-emerald-200/70 hover:text-emerald-100'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>Simulated Linking</span>
        </button>
      </div>
    </div>
  );
};
