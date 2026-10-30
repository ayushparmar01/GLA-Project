import React, { useState, useEffect, useCallback } from 'react';
import {
  WhatsAppAdminAnalytics,
  WhatsAppIntegrationStatusReport,
  WhatsAppWebhookEventData,
} from '../../types';
import {
  fetchWhatsAppAdminStatusApi,
  fetchWhatsAppAdminAnalyticsApi,
  fetchWhatsAppAdminEventsApi,
  sendWhatsAppTestMessageApi,
} from '../../services/api';
import {
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Send,
  Users,
  ShieldCheck,
  RefreshCw,
  Clock,
  Radio,
  FileText,
} from 'lucide-react';

interface AdminWhatsAppControlCardProps {
  token?: string | null;
}

export const AdminWhatsAppControlCard: React.FC<AdminWhatsAppControlCardProps> = ({ token }) => {
  const [status, setStatus] = useState<WhatsAppIntegrationStatusReport | null>(null);
  const [analytics, setAnalytics] = useState<WhatsAppAdminAnalytics | null>(null);
  const [events, setEvents] = useState<WhatsAppWebhookEventData[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Test message console
  const [testPhone, setTestPhone] = useState('');
  const [testText, setTestText] = useState('CareerBridge Test: WhatsApp Cloud API communication channel verified.');
  const [sendingTest, setSendingTest] = useState(false);

  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 4000);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [statusRes, analyticsRes, eventsRes] = await Promise.all([
      fetchWhatsAppAdminStatusApi(token),
      fetchWhatsAppAdminAnalyticsApi(token),
      fetchWhatsAppAdminEventsApi({ page: 1, limit: 10 }, token),
    ]);

    if (statusRes.success && statusRes.data) setStatus(statusRes.data);
    if (analyticsRes.success && analyticsRes.data) setAnalytics(analyticsRes.data);
    if (eventsRes.success && eventsRes.data) setEvents(eventsRes.data.events);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim() || !testText.trim()) {
      alert('Please provide recipient phone number and message.');
      return;
    }

    setSendingTest(true);
    const res = await sendWhatsAppTestMessageApi(
      { phoneNumber: testPhone.trim(), message: testText.trim() },
      token
    );
    setSendingTest(false);

    if (res.success && res.data) {
      showNotice(res.data.message);
      loadAll();
    } else {
      showNotice(res.error?.message || 'Failed to dispatch test message.', 'error');
    }
  };

  const getStatusBadge = (state?: string) => {
    switch (state) {
      case 'CONNECTED_VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Connected & Verified
          </span>
        );
      case 'CONFIGURED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-300">
            Configured (Pending Webhook Traffic)
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300">
            <AlertTriangle className="w-3.5 h-3.5" /> Configuration Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            Not Configured / Disabled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div
          className={`p-4 rounded-xl border text-sm font-medium ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}
        >
          {notice.message}
        </div>
      )}

      {/* Primary Integration Health Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" /> Meta WhatsApp Business Cloud API Integration
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervise Meta Graph API connectivity, webhook idempotency, and automated delivery performance
            </p>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge(status?.status)}
            <button
              type="button"
              onClick={loadAll}
              className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Integration Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase">Graph API Version</div>
            <div className="text-base font-bold text-slate-900">{status?.apiVersion || 'v21.0'}</div>
            <div className="text-[11px] text-slate-400">Official Cloud API Endpoint</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase">Phone Number ID</div>
            <div className="text-base font-bold text-slate-900 font-mono">
              {status?.phoneNumberId || 'Unconfigured'}
            </div>
            <div className="text-[11px] text-slate-400">Tokens & Secrets Masked</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase">Webhook Endpoint</div>
            <div className="text-base font-bold text-slate-900 font-mono truncate">
              {status?.webhookPath || '/api/whatsapp/webhook'}
            </div>
            <div className="text-[11px] text-slate-400">HMAC-SHA256 Signature Checked</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase">Webhook Handshake</div>
            <div className="text-base font-bold text-slate-900">
              {status?.webhookVerified ? 'Verified by Meta' : 'Awaiting Challenge'}
            </div>
            <div className="text-[11px] text-slate-400">GET subscription handshake</div>
          </div>
        </div>

        {/* Metrics Overview */}
        {analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200/60 text-center">
              <div className="text-xs font-semibold text-indigo-700">Linked Students</div>
              <div className="text-xl font-bold text-indigo-950 mt-1">{analytics.totalLinkedAccounts}</div>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200/60 text-center">
              <div className="text-xs font-semibold text-emerald-700">Opted-In Students</div>
              <div className="text-xl font-bold text-emerald-950 mt-1">{analytics.totalOptedIn}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <div className="text-xs font-semibold text-slate-600">Opted-Out (STOP)</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{analytics.totalOptedOut}</div>
            </div>
            <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200/60 text-center">
              <div className="text-xs font-semibold text-blue-700">Messages Sent</div>
              <div className="text-xl font-bold text-blue-950 mt-1">{analytics.messagesSent}</div>
            </div>
            <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-200/60 text-center">
              <div className="text-xs font-semibold text-teal-700">Delivered</div>
              <div className="text-xl font-bold text-teal-950 mt-1">{analytics.messagesDelivered}</div>
            </div>
            <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-200/60 text-center">
              <div className="text-xs font-semibold text-rose-700">Failures</div>
              <div className="text-xl font-bold text-rose-950 mt-1">{analytics.messagesFailed}</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Message Console */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Send className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900">Admin Live Test Console</h4>
          </div>

          <p className="text-xs text-slate-500">
            Dispatch a diagnostic test message to an authorized recipient phone number. In unconfigured environments, outbound messages are logged safely into the audit collection without making unauthorized external calls.
          </p>

          <form onSubmit={handleSendTest} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Authorized Recipient Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 919876543210 (include country code)"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Diagnostic Content
              </label>
              <textarea
                rows={3}
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={sendingTest}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {sendingTest ? 'Dispatching Message...' : 'Send Diagnostic Message'}
            </button>
          </form>
        </div>

        {/* Webhook Events Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Radio className="w-4 h-4 text-indigo-600" /> Recent Webhook Inbound Events
            </h4>
            <span className="text-xs text-slate-500">{events.length} events logged</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs divide-y divide-slate-100">
              <thead className="text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-2">Event ID</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Processed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No webhook events received yet.
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/70">
                      <td className="py-2 font-mono text-[11px] text-slate-700 truncate max-w-[120px]">
                        {ev.eventId}
                      </td>
                      <td className="py-2 text-slate-600">{ev.eventType}</td>
                      <td className="py-2">
                        <span
                          className={`px-1.5 py-0.5 rounded-sm font-bold text-[10px] ${
                            ev.status === 'PROCESSED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : ev.status === 'FAILED'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {ev.status}
                        </span>
                      </td>
                      <td className="py-2 text-right text-slate-400">
                        {new Date(ev.processedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
