import React, { useState, useEffect } from 'react';
import { MentorProfileData, AdminMentorshipAnalyticsReport } from '../../types';
import {
  fetchAdminMentorVerificationQueueApi,
  reviewAdminMentorVerificationApi,
  fetchAdminMentorshipAnalyticsApi,
} from '../../services/api';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  RefreshCw,
  Search,
  ExternalLink,
  Users,
} from 'lucide-react';

interface AdminMentorVerificationCardProps {
  token?: string | null;
}

export const AdminMentorVerificationCard: React.FC<AdminMentorVerificationCardProps> = ({
  token,
}) => {
  const [queue, setQueue] = useState<MentorProfileData[]>([]);
  const [analytics, setAnalytics] = useState<AdminMentorshipAnalyticsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'VERIFIED' | 'SUSPENDED'>('PENDING');

  // Rejection modal
  const [rejectingMentor, setRejectingMentor] = useState<MentorProfileData | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [qRes, aRes] = await Promise.all([
        fetchAdminMentorVerificationQueueApi(statusFilter, token),
        fetchAdminMentorshipAnalyticsApi(token),
      ]);

      if (qRes.success && qRes.data) {
        setQueue(qRes.data);
      }
      if (aRes.success && aRes.data) {
        setAnalytics(aRes.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleApprove = async (mentorProfileId: string) => {
    setActionLoading(true);
    try {
      const res = await reviewAdminMentorVerificationApi(
        mentorProfileId,
        { status: 'VERIFIED' },
        token
      );
      if (res.success && res.data) {
        setQueue((prev) => prev.filter((m) => m.id !== mentorProfileId));
        loadData();
      }
    } catch {
      // Ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingMentor || !rejectionReason.trim()) return;

    setActionLoading(true);
    try {
      const res = await reviewAdminMentorVerificationApi(
        rejectingMentor.id,
        { status: 'REJECTED', rejectionReason: rejectionReason.trim() },
        token
      );
      if (res.success) {
        setQueue((prev) => prev.filter((m) => m.id !== rejectingMentor.id));
        setRejectingMentor(null);
        setRejectionReason('');
        loadData();
      }
    } catch {
      // Ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (mentorProfileId: string) => {
    if (!window.confirm('Are you sure you want to suspend this mentor account?')) return;
    setActionLoading(true);
    try {
      const res = await reviewAdminMentorVerificationApi(
        mentorProfileId,
        { status: 'SUSPENDED', rejectionReason: 'Admin moderation compliance' },
        token
      );
      if (res.success) {
        loadData();
      }
    } catch {
      // Ignore
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500">Registered Mentors</span>
          <span className="text-xl font-black text-gray-900 mt-0.5 block">
            {analytics?.totalMentorsRegistered || 0}
          </span>
        </div>
        <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-800">Verified Mentors</span>
          <span className="text-xl font-black text-emerald-950 mt-0.5 block">
            {analytics?.verifiedMentors || 0}
          </span>
        </div>
        <div className="bg-amber-50/60 rounded-xl p-3.5 border border-amber-200 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-800">Pending Review</span>
          <span className="text-xl font-black text-amber-950 mt-0.5 block">
            {analytics?.pendingVerifications || 0}
          </span>
        </div>
        <div className="bg-indigo-50/60 rounded-xl p-3.5 border border-indigo-200 shadow-xs">
          <span className="text-[11px] font-semibold text-indigo-800">Active Relationships</span>
          <span className="text-xl font-black text-indigo-950 mt-0.5 block">
            {analytics?.totalActiveRelationships || 0}
          </span>
        </div>
        <div className="bg-purple-50/60 rounded-xl p-3.5 border border-purple-200 shadow-xs">
          <span className="text-[11px] font-semibold text-purple-800">Completed Sessions</span>
          <span className="text-xl font-black text-purple-950 mt-0.5 block">
            {analytics?.totalSessionsConducted || 0}
          </span>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Mentor Credentials & Verification Desk
            </h2>
            <p className="text-xs text-gray-500">
              Audit submitted company emails, designation proofs, and identity documents before enabling student discovery.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg bg-white"
            >
              <option value="PENDING">Pending Review</option>
              <option value="VERIFIED">Verified Mentors</option>
              <option value="SUSPENDED">Suspended Mentors</option>
            </select>

            <button onClick={loadData} className="p-2 text-gray-400 hover:text-gray-600" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {queue.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No mentor profiles found matching status "{statusFilter}".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-[11px] text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-3">Mentor Candidate</th>
                  <th className="py-3 px-3">Role & Organization</th>
                  <th className="py-3 px-3">Industry & Exp</th>
                  <th className="py-3 px-3">Evidence Submitted</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {queue.map((mentor) => (
                  <tr key={mentor.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-gray-900">{mentor.fullName || 'Professional'}</div>
                      <div className="text-[11px] text-gray-500">{mentor.email}</div>
                      {mentor.isAlumni && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold inline-block mt-0.5">
                          Alumni
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-gray-900">{mentor.designation}</div>
                      <div className="text-indigo-600 font-medium">{mentor.organization}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div>{mentor.industry}</div>
                      <div className="text-gray-500">{mentor.experienceYears} Years Exp</div>
                    </td>

                    <td className="py-3.5 px-3 text-[11px] space-y-0.5">
                      {mentor.verificationEvidence?.workEmail && (
                        <div>
                          <span className="text-gray-400">Work Email:</span>{' '}
                          <span className="font-mono text-gray-800">
                            {mentor.verificationEvidence.workEmail}
                          </span>
                        </div>
                      )}
                      {mentor.linkedinUrl && (
                        <a
                          href={mentor.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          LinkedIn Profile <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {mentor.verificationEvidence?.submissionNotes && (
                        <div className="text-gray-500 italic max-w-xs truncate">
                          "{mentor.verificationEvidence.submissionNotes}"
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          mentor.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : mentor.verificationStatus === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {mentor.verificationStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {mentor.verificationStatus !== 'VERIFIED' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleApprove(mentor.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Approve
                          </button>
                        )}
                        {mentor.verificationStatus === 'PENDING' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => setRejectingMentor(mentor)}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        )}
                        {mentor.verificationStatus === 'VERIFIED' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleSuspend(mentor.id)}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-md text-[11px] font-semibold transition-colors"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingMentor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-gray-900 mb-2">Reject Mentor Verification</h3>
            <p className="text-xs text-gray-500 mb-4">
              State the reason for rejecting {rejectingMentor.fullName || 'this candidate'}. The applicant will be notified to correct credentials.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-3">
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Work email could not be validated or ID proof is illegible."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none resize-none"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingMentor(null)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
