import React from 'react';
import {
  Bell,
  Briefcase,
  FileCheck,
  Calendar,
  Sparkles,
  BookOpen,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  DEMO_SIMULATED_NOTIFICATIONS,
  SimulatedNotification,
  SimulatedNotificationType,
} from './demoKnowledgeBase';

interface NotificationPreviewProps {
  onTriggerInChat: (notification: SimulatedNotification) => void;
}

export const NotificationPreview: React.FC<NotificationPreviewProps> = ({ onTriggerInChat }) => {
  const getIcon = (type: SimulatedNotificationType) => {
    switch (type) {
      case 'Job Alert':
        return <Briefcase className="w-4 h-4 text-emerald-600" />;
      case 'Application Update':
        return <FileCheck className="w-4 h-4 text-blue-600" />;
      case 'Interview Reminder':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'Career Readiness Tip':
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      case 'Learning Recommendation':
        return <BookOpen className="w-4 h-4 text-teal-600" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-100/70 space-y-4">
      {/* Simulation Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-semibold">Simulated WhatsApp Notifications:</strong> These cards illustrate how automated placement alerts, shortlisting updates, and interview links reach students on WhatsApp. These are frontend-only simulations and do not transmit live SMS or WhatsApp messages.
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-emerald-700" />
            <span>Sample Placement Notification Templates</span>
          </h4>
          <span className="text-[11px] font-semibold text-slate-500">5 Types Available</span>
        </div>

        {DEMO_SIMULATED_NOTIFICATIONS.map((notif: SimulatedNotification) => (
          <div
            key={notif.id}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-sm transition-all space-y-3"
          >
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                  {getIcon(notif.type)}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{notif.title}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{notif.timestamp}</div>
                </div>
              </div>

              {/* SIMULATED Badges */}
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${notif.tagColor}`}>
                  {notif.type}
                </span>
                <span className="text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                  SIMULATED
                </span>
              </div>
            </div>

            {/* Notification Preview Text */}
            <div className="bg-[#f0f2f5] rounded-xl p-3 text-xs text-slate-800 font-mono whitespace-pre-line leading-relaxed border border-slate-200/80">
              {notif.fullMessage}
            </div>

            {/* Action Trigger */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => onTriggerInChat(notif)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#075e54] hover:bg-emerald-800 text-white transition-colors cursor-pointer shadow-2xs active:scale-95"
              >
                <span>Preview in Live Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
