import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchEmployerInterviewsApi,
  updateInterviewApi,
  cancelInterviewApi,
} from '../../services/api';
import { InterviewData, InterviewStatus } from '../../types';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Users,
  Edit,
  X,
  Plus,
} from 'lucide-react';

export const InterviewManagementView: React.FC = () => {
  const { token } = useAuth();
  const [interviews, setInterviews] = useState<InterviewData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reschedule Modal
  const [rescheduleInterview, setRescheduleInterview] = useState<InterviewData | null>(null);
  const [newScheduledAt, setNewScheduledAt] = useState<string>('');
  const [newMeetingLink, setNewMeetingLink] = useState<string>('');
  const [newLocation, setNewLocation] = useState<string>('');
  const [rescheduling, setRescheduling] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchEmployerInterviewsApi(token);
      if (res.success && res.data) {
        setInterviews(res.data);
      } else {
        setError(res.error?.message || 'Failed to load interviews.');
      }
    } catch {
      setError('An error occurred while loading interviews.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  const handleCancelInterview = async (interviewId: string) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled interview?')) return;
    setActionLoadingId(interviewId);
    setError(null);
    try {
      const res = await cancelInterviewApi(interviewId, token);
      if (res.success) {
        setSuccessMessage('Interview cancelled successfully.');
        loadInterviews();
      } else {
        setError(res.error?.message || 'Failed to cancel interview.');
      }
    } catch {
      setError('An error occurred while cancelling interview.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkCompleted = async (interviewId: string) => {
    setActionLoadingId(interviewId);
    setError(null);
    try {
      const res = await updateInterviewApi(interviewId, { status: 'COMPLETED' }, token);
      if (res.success) {
        setSuccessMessage('Interview marked as completed.');
        loadInterviews();
      } else {
        setError(res.error?.message || 'Failed to update interview.');
      }
    } catch {
      setError('An error occurred while updating interview.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenReschedule = (interview: InterviewData) => {
    setRescheduleInterview(interview);
    setNewScheduledAt(new Date(interview.scheduledAt).toISOString().slice(0, 16));
    setNewMeetingLink(interview.meetingLink || '');
    setNewLocation(interview.location || '');
    setModalError(null);
  };

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleInterview) return;

    if (!newScheduledAt) {
      setModalError('Valid rescheduled date and time is required.');
      return;
    }

    setRescheduling(true);
    setModalError(null);

    try {
      const res = await updateInterviewApi(
        rescheduleInterview.id,
        {
          scheduledAt: new Date(newScheduledAt).toISOString(),
          meetingLink: rescheduleInterview.interviewType === 'ONLINE' ? newMeetingLink : undefined,
          location: rescheduleInterview.interviewType === 'OFFLINE' ? newLocation : undefined,
          status: 'RESCHEDULED',
        },
        token
      );

      if (res.success) {
        setSuccessMessage('Interview rescheduled successfully.');
        setRescheduleInterview(null);
        loadInterviews();
      } else {
        setModalError(res.error?.message || 'Failed to reschedule.');
      }
    } catch {
      setModalError('An error occurred during reschedule.');
    } finally {
      setRescheduling(false);
    }
  };

  const getStatusBadge = (status: InterviewStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
      case 'RESCHEDULED':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      default:
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Calendar className="w-8 h-8 text-purple-400" />
            Interview Schedule Manager
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track and conduct scheduled candidate interviews, virtual assessments, and on-campus rounds.
          </p>
        </div>

        <button
          onClick={loadInterviews}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-slate-700 disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
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

      {/* Interviews List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
          <p className="text-sm">Loading interview calendar...</p>
        </div>
      ) : interviews.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-white font-semibold">No interviews scheduled yet</div>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            You can schedule technical rounds or HR evaluations directly from the Candidate Desk.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {interviews.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 space-y-4 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[11px] font-semibold tracking-wider uppercase border border-purple-500/20">
                      {item.interviewRound}
                    </span>
                    <h3 className="font-bold text-lg text-white">
                      {item.studentName || 'Candidate'}
                    </h3>
                    <div className="text-xs text-slate-400">
                      For <span className="text-slate-200 font-medium">{item.driveTitle || 'Recruitment Opportunity'}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase ${getStatusBadge(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>
                      {new Date(item.scheduledAt).toLocaleString()} ({item.durationMinutes} mins)
                    </span>
                  </div>

                  {item.interviewType === 'ONLINE' ? (
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      {item.meetingLink ? (
                        <a
                          href={item.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium truncate"
                        >
                          Join Online Meeting <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate-500">Online Meeting</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{item.location || 'On-campus Placement Office'}</span>
                    </div>
                  )}

                  {item.instructions && (
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 text-slate-400 text-[11px] mt-2">
                      <span className="font-semibold text-slate-300">Instructions: </span>
                      {item.instructions}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {item.status !== 'CANCELLED' && item.status !== 'COMPLETED' && (
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleMarkCompleted(item.id)}
                    disabled={actionLoadingId === item.id}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Completed
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenReschedule(item)}
                      disabled={actionLoadingId === item.id}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleCancelInterview(item.id)}
                      disabled={actionLoadingId === item.id}
                      className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleInterview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Reschedule Interview</h3>
                <p className="text-slate-400 text-xs">{rescheduleInterview.studentName}</p>
              </div>
              <button
                onClick={() => setRescheduleInterview(null)}
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

            <form onSubmit={handleConfirmReschedule} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  New Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={newScheduledAt}
                  onChange={(e) => setNewScheduledAt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              {rescheduleInterview.interviewType === 'ONLINE' ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    value={newMeetingLink}
                    onChange={(e) => setNewMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Location / Room
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRescheduleInterview(null)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduling}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {rescheduling ? 'Saving...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
