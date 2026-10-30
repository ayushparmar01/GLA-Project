import React, { useState } from 'react';
import {
  Phone,
  CheckCircle2,
  Trash2,
  Bell,
  RefreshCw,
  Info,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { WhatsAppPreferences } from '../../types';

interface DemoAccountStatusProps {
  onSimulateLinkingInChat?: (statusText: string) => void;
}

export const DemoAccountStatus: React.FC<DemoAccountStatusProps> = ({
  onSimulateLinkingInChat,
}) => {
  // Purely frontend local simulated state - zero backend calls
  const [isLinked, setIsLinked] = useState<boolean>(true);
  const [simulatedPhone, setSimulatedPhone] = useState<string>('919876543210');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const [preferences, setPreferences] = useState<WhatsAppPreferences>({
    jobAlertsEnabled: true,
    applicationUpdatesEnabled: true,
    interviewAlertsEnabled: true,
    careerTipsEnabled: false,
  });

  const handleTogglePref = (key: keyof WhatsAppPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setMessage('Simulated preference updated locally.');
    setTimeout(() => setMessage(null), 2500);
  };

  const handleSimulateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setSimulatedPhone(phoneInput.trim());
      setIsLinked(true);
      setIsSubmitting(false);
      setPhoneInput('');
      setMessage('Simulated demo account linked successfully!');
      if (onSimulateLinkingInChat) {
        onSimulateLinkingInChat(
          `✅ *Simulated WhatsApp Account Linked*\n\nPhone: +${phoneInput.trim()} (DEMO MODE)\nYou will receive simulated campus drive and interview reminders.`
        );
      }
      setTimeout(() => setMessage(null), 3000);
    }, 500);
  };

  const handleSimulateUnlink = () => {
    setIsLinked(false);
    setMessage('Simulated demo account unlinked.');
    if (onSimulateLinkingInChat) {
      onSimulateLinkingInChat(
        '🛑 *Simulated WhatsApp Account Unlinked*\n\nAutomated simulated alerts have been deactivated.'
      );
    }
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-100/70 space-y-4">
      {/* Simulation Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-semibold">Simulated Account Environment:</strong> This panel simulates how a student links their WhatsApp phone number and customizes alert categories. Real integration API credentials remain untouched.
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Demo Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>WhatsApp Notification Channel</span>
                <span className="text-[9px] font-extrabold bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded-sm uppercase tracking-wider">
                  SIMULATED ACCOUNT
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Local frontend sandbox for Mission Bharat demo
              </div>
            </div>
          </div>

          <div>
            {isLinked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simulated Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                <span>Simulated Unlinked</span>
              </span>
            )}
          </div>
        </div>

        {isLinked ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
              <div>
                <div className="text-[11px] font-semibold text-emerald-900">Simulated Connected Number</div>
                <div className="text-base font-bold text-slate-900">+{simulatedPhone}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Verified in Demo Mode · Reply <strong>STOP</strong> in simulator chat to pause.
                </div>
              </div>

              <button
                type="button"
                onClick={handleSimulateUnlink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 hover:text-rose-800 bg-white hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer self-start sm:self-center"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Simulate Unlink</span>
              </button>
            </div>

            {/* Notification Preference Toggles */}
            <div className="space-y-2.5">
              <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-emerald-700" />
                <span>Simulated Notification Subscriptions</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    key: 'jobAlertsEnabled' as const,
                    title: 'Campus Drive Alerts',
                    desc: 'New eligible recruitment opportunities',
                  },
                  {
                    key: 'applicationUpdatesEnabled' as const,
                    title: 'Application Shortlisting',
                    desc: 'Shortlist and recruiter feedback alerts',
                  },
                  {
                    key: 'interviewAlertsEnabled' as const,
                    title: 'Interview Reminders',
                    desc: 'Virtual meeting links and round timings',
                  },
                  {
                    key: 'careerTipsEnabled' as const,
                    title: 'Readiness Insights',
                    desc: 'ATS resume tips and skill roadmaps',
                  },
                ].map((item) => {
                  const checked = Boolean(preferences[item.key]);
                  return (
                    <label
                      key={item.key}
                      className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white flex items-start gap-2.5 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleTogglePref(item.key)}
                        className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                      />
                      <div className="text-xs">
                        <div className="font-bold text-slate-800">{item.title}</div>
                        <div className="text-[10px] text-slate-500 leading-tight">{item.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Unlinked Simulation Form */
          <form onSubmit={handleSimulateLink} className="space-y-3">
            <p className="text-xs text-slate-600">
              Enter any test phone number to simulate linking a WhatsApp profile in the demo sandbox:
            </p>

            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="e.g. 919876543210"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting || !phoneInput.trim()}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Simulating...' : 'Simulate Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
