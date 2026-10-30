import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchEmployerConnectionsApi,
  sendCollegeConnectionApi,
} from '../../services/api';
import { CollegeEmployerConnectionData, ConnectionStatus } from '../../types';
import {
  School,
  Send,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  AlertCircle,
  RefreshCw,
  X,
  ExternalLink,
  Info,
} from 'lucide-react';

export const CollegeConnectionsView: React.FC = () => {
  const { token } = useAuth();
  const [connections, setConnections] = useState<CollegeEmployerConnectionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Send Connection Modal State
  const [showSendModal, setShowSendModal] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [collegeIdInput, setCollegeIdInput] = useState<string>('');
  const [messageInput, setMessageInput] = useState<string>(
    'Greetings from our recruitment team. We are eager to partner with your institution to offer campus placement opportunities for final year students.'
  );

  const loadConnections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchEmployerConnectionsApi(token);
      if (res.success && res.data) {
        setConnections(res.data);
      } else {
        setError(res.error?.message || 'Failed to load college connections.');
      }
    } catch {
      setError('An error occurred while loading connections.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeIdInput.trim()) {
      setModalError('Valid College ID / Institution ID is required.');
      return;
    }

    setSending(true);
    setModalError(null);

    try {
      const res = await sendCollegeConnectionApi(
        {
          collegeId: collegeIdInput.trim(),
          message: messageInput.trim() || undefined,
        },
        token
      );

      if (res.success && res.data) {
        setSuccessMessage('Connection invitation sent to college placement cell.');
        setShowSendModal(false);
        setCollegeIdInput('');
        loadConnections();
      } else {
        setModalError(res.error?.message || 'Failed to send connection request.');
      }
    } catch {
      setModalError('An error occurred during submission.');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: ConnectionStatus) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Connected Partner
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            Declined
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-500 border border-slate-700">
            <Ban className="w-3.5 h-3.5" />
            Blocked
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            Pending College Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <School className="w-8 h-8 text-amber-400" />
            Institutional Partnerships & College Connections
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Build formal recruitment bridges with rural and tier-2/3 colleges across Bharat.
          </p>
        </div>

        <button
          onClick={() => setShowSendModal(true)}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-amber-600/25 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Connect with College
        </button>
      </div>

      {/* Info Card */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-amber-500/20 text-slate-300 text-sm flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-white">How College Connections Work: </span>
          <span>
            Establishing a verified connection allows colleges to recommend student cohorts, facilitate on-campus interview venues, and directly review your placement opportunities.
          </span>
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Connections List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-sm">Loading institutional connections...</p>
        </div>
      ) : connections.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <School className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-white font-semibold">No institutional connections initiated yet</div>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            Reach out to rural polytechnics, district engineering colleges, and government institutes to build your hiring pipeline.
          </p>
          <button
            onClick={() => setShowSendModal(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 mt-2"
          >
            <Plus className="w-4 h-4" /> Send Partnership Request
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 space-y-4 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                    <School className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">
                      {conn.collegeName || `College ID: ${conn.collegeId.slice(0, 8)}...`}
                    </h3>
                    <div className="text-xs text-slate-400">
                      Initiated on {new Date(conn.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {getStatusBadge(conn.status)}
              </div>

              {conn.message && (
                <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl text-xs text-slate-300 leading-relaxed">
                  <span className="font-semibold text-slate-400 block mb-1">Partnership Note:</span>
                  {conn.message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Send Connection Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Connect with College</h3>
                <p className="text-slate-400 text-xs">Invite placement cell to partner for campus recruitment</p>
              </div>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Target College User ID / Institution ID <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={collegeIdInput}
                  onChange={(e) => setCollegeIdInput(e.target.value)}
                  placeholder="Enter 24-character College User ID"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Partnership Introduction Message
                </label>
                <textarea
                  rows={4}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Introduce your company and describe the profiles you intend to hire..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-amber-600/25 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sending ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
