import React, { useState, useEffect } from 'react';
import {
  WhatsAppStatusData,
  WhatsAppPreferences,
  WhatsAppLinkRequestResult,
} from '../../types';
import {
  fetchWhatsAppStatusApi,
  requestWhatsAppLinkCodeApi,
  verifyWhatsAppLinkCodeApi,
  unlinkWhatsAppAccountApi,
  updateWhatsAppPreferencesApi,
} from '../../services/api';
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  Phone,
  Bell,
  Trash2,
  ExternalLink,
  ShieldCheck,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface WhatsAppIntegrationCardProps {
  token?: string | null;
  onPreviewRequested?: () => void;
}

export const WhatsAppIntegrationCard: React.FC<WhatsAppIntegrationCardProps> = ({
  token,
  onPreviewRequested,
}) => {
  const [status, setStatus] = useState<WhatsAppStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal linking state
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);
  const [linkResult, setLinkResult] = useState<WhatsAppLinkRequestResult | null>(null);
  const [phoneNumberInput, setPhoneNumberInput] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [linkingLoading, setLinkingLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Preference updates
  const [savingPrefs, setSavingPrefs] = useState(false);

  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 4000);
  };

  const loadStatus = async () => {
    setLoading(true);
    const res = await fetchWhatsAppStatusApi(token);
    if (res.success && res.data) {
      setStatus(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStatus();
  }, [token]);

  // Countdown timer for linking code expiration
  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const handleOpenLinkingModal = async () => {
    setLinkingLoading(true);
    setIsLinkingModalOpen(true);
    setLinkResult(null);
    setCopiedCode(false);

    const res = await requestWhatsAppLinkCodeApi(token);
    setLinkingLoading(false);

    if (res.success && res.data) {
      setLinkResult(res.data);
      setSecondsRemaining(res.data.expiresInSeconds);
    } else {
      showNotice(res.error?.message || 'Failed to generate linking code', 'error');
      setIsLinkingModalOpen(false);
    }
  };

  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumberInput.trim() || !linkResult) {
      alert('Please enter your WhatsApp phone number.');
      return;
    }

    setLinkingLoading(true);
    const res = await verifyWhatsAppLinkCodeApi(
      { code: linkResult.code, phoneNumber: phoneNumberInput.trim() },
      token
    );
    setLinkingLoading(false);

    if (res.success) {
      showNotice('WhatsApp account verified and linked successfully!');
      setIsLinkingModalOpen(false);
      setPhoneNumberInput('');
      loadStatus();
    } else {
      alert(res.error?.message || 'Verification failed. Please check the code.');
    }
  };

  const handleUnlink = async () => {
    if (!window.confirm('Are you sure you want to unlink your WhatsApp account? You will stop receiving instant interview and drive alerts.')) {
      return;
    }

    const res = await unlinkWhatsAppAccountApi(token);
    if (res.success) {
      showNotice('WhatsApp account unlinked.');
      loadStatus();
    } else {
      showNotice(res.error?.message || 'Failed to unlink account.', 'error');
    }
  };

  const handleTogglePref = async (key: keyof WhatsAppPreferences) => {
    if (!status?.preferences) return;

    const newPrefs = {
      ...status.preferences,
      [key]: !status.preferences[key],
    };

    setSavingPrefs(true);
    const res = await updateWhatsAppPreferencesApi(newPrefs, token);
    setSavingPrefs(false);

    if (res.success && res.data) {
      setStatus({ ...status, preferences: res.data.preferences });
      showNotice('Preferences saved.');
    } else {
      showNotice('Failed to update preferences.', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              WhatsApp Career Assistant & Instant Alerts
            </h3>
            <p className="text-xs text-slate-500">
              Receive campus placement notices, interview rounds, and AI career guidance straight on WhatsApp
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onPreviewRequested && (
            <button
              type="button"
              onClick={onPreviewRequested}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 transition-colors cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Launch Demo Mode</span>
            </button>
          )}

          {status?.linked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified & Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              Not Linked
            </span>
          )}
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-3 text-xs font-medium border-b ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {notice.message}
        </div>
      )}

      {/* Body Content */}
      <div className="p-6 space-y-6">
        {!status?.linked ? (
          /* Unlinked State */
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-slate-900">
                Why connect your WhatsApp with CareerBridge?
              </h4>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Zero Internet Dependent:</strong> Discover active campus drives even with low bandwidth or rural connectivity.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Instant Interview Alerts:</strong> Never miss shortlisting announcements or virtual interview links.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>24/7 AI Career Guidance:</strong> Ask interview prep and skill questions anytime on WhatsApp.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleOpenLinkingModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <Phone className="w-4 h-4" /> Connect WhatsApp
              </button>

              {onPreviewRequested && (
                <button
                  type="button"
                  onClick={onPreviewRequested}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>Launch WhatsApp Demo Mode</span>
                  <span className="text-[9px] bg-amber-400 text-amber-950 font-extrabold px-1.5 py-0.2 rounded-sm uppercase">
                    SIMULATED
                  </span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Linked State & Preference Toggles */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/60">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-emerald-900">Connected Phone Number</div>
                <div className="text-lg font-bold text-slate-900">+{status.phoneNumber}</div>
                <div className="text-[11px] text-slate-500">
                  Linked on {status.linkedAt ? new Date(status.linkedAt).toLocaleDateString() : 'Active'} · Reply <strong>STOP</strong> anytime on WhatsApp to pause.
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onPreviewRequested && (
                  <button
                    type="button"
                    onClick={onPreviewRequested}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 rounded-lg text-xs font-bold text-amber-950 cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>Launch Demo Mode</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleUnlink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-50 rounded-lg text-xs font-medium text-rose-700 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Unlink
                </button>
              </div>
            </div>

            {/* Notification Category Controls */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" /> Notification Category Preferences
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    key: 'jobAlertsEnabled' as const,
                    title: 'New Campus Drive Alerts',
                    desc: 'Instant alerts when eligible recruitment opportunities are posted',
                  },
                  {
                    key: 'applicationUpdatesEnabled' as const,
                    title: 'Application Status Updates',
                    desc: 'Notifies you when your application is reviewed or shortlisted',
                  },
                  {
                    key: 'interviewAlertsEnabled' as const,
                    title: 'Interview Round Schedule',
                    desc: 'Meeting links and timing changes from recruiters',
                  },
                  {
                    key: 'careerTipsEnabled' as const,
                    title: 'Weekly AI Skill Insights',
                    desc: 'Standardized assessment prep and free learning roadmap tips',
                  },
                ].map((item) => {
                  const isChecked = Boolean(status.preferences?.[item.key]);
                  return (
                    <label
                      key={item.key}
                      className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white flex items-start gap-3 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={savingPrefs}
                        onChange={() => handleTogglePref(item.key)}
                        className="mt-1 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-900">{item.title}</div>
                        <div className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Linking Modal */}
      {isLinkingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                <MessageSquare className="w-5 h-5 text-emerald-600" /> Connect WhatsApp
              </div>
              <button
                type="button"
                onClick={() => setIsLinkingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {linkingLoading && !linkResult ? (
              <div className="p-8 text-center text-sm text-slate-500">Generating secure linking code...</div>
            ) : linkResult ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-600">
                  To securely verify your WhatsApp account, enter your phone number below and confirm your single-use code:
                </p>

                {/* Code Card */}
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-2">
                  <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    Your Verification Code
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <span className="font-mono text-3xl font-black tracking-widest text-emerald-950">
                      {linkResult.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(linkResult.code)}
                      className="p-1.5 rounded-md hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                      title="Copy Code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {copiedCode && <span className="text-[11px] text-emerald-700 font-medium">Copied!</span>}

                  <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-800 pt-1">
                    <Clock className="w-3.5 h-3.5" /> Code expires in: <strong>{formatTimer(secondsRemaining)}</strong>
                  </div>
                </div>

                {/* Verification Form */}
                <form onSubmit={handleConfirmVerification} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Your WhatsApp Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g., 919876543210 (include country code)"
                      value={phoneNumberInput}
                      onChange={(e) => setPhoneNumberInput(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                    <strong>Alternative:</strong> You can also send the code <strong>{linkResult.code}</strong> directly from WhatsApp to CareerBridge at <strong>{linkResult.officialPhoneNumber}</strong>.
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsLinkingModalOpen(false)}
                      className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={linkingLoading || secondsRemaining <= 0}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg cursor-pointer shadow-xs"
                    >
                      {linkingLoading ? 'Verifying...' : 'Verify & Connect'}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
