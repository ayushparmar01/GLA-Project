import React, { useState } from 'react';
import { EmployerCompanyProfileData } from '../../types';
import {
  Building2,
  CheckCircle,
  XCircle,
  Globe,
  MapPin,
  User,
  AlertTriangle,
  X,
} from 'lucide-react';

interface AdminEmployerVerificationTableProps {
  pendingEmployers: EmployerCompanyProfileData[];
  loading: boolean;
  onVerifyEmployer: (employerId: string, notes?: string) => Promise<boolean>;
  onRejectEmployer: (employerId: string, reason: string) => Promise<boolean>;
}

export const AdminEmployerVerificationTable: React.FC<AdminEmployerVerificationTableProps> = ({
  pendingEmployers,
  loading,
  onVerifyEmployer,
  onRejectEmployer,
}) => {
  const [rejectingEmployer, setRejectingEmployer] = useState<EmployerCompanyProfileData | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [notesPromptId, setNotesPromptId] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    await onVerifyEmployer(id, approvalNotes.trim() || undefined);
    setActionLoading(false);
    setNotesPromptId(null);
    setApprovalNotes('');
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please enter a valid rejection reason.');
      return;
    }
    if (!rejectingEmployer) return;

    setActionLoading(true);
    const success = await onRejectEmployer(rejectingEmployer.id, rejectReason.trim());
    setActionLoading(false);
    if (success) {
      setRejectingEmployer(null);
      setRejectReason('');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" /> Employer Verification Queue
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Strictly verify recruiter identities, legal registration, and contact persons before campus drives
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            {pendingEmployers.length} Pending Approval
          </span>
        </div>
      </div>

      <div className="divide-y divide-slate-200">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading employer verification queue...</div>
        ) : pendingEmployers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center">
            <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
            <p className="font-medium text-slate-800">Verification Queue Clear</p>
            <p className="text-xs text-slate-400 mt-1">All registered corporate employers have been verified.</p>
          </div>
        ) : (
          pendingEmployers.map((emp) => (
            <div key={emp.id} className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="text-base font-bold text-slate-900">{emp.companyName}</h4>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {emp.industry}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-slate-100 text-slate-600">
                    {emp.companySize} employees
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">{emp.companyDescription}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {emp.headquarters}
                  </span>
                  {emp.companyWebsite && (
                    <a
                      href={emp.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-indigo-600 hover:underline"
                    >
                      <Globe className="w-3.5 h-3.5" /> Website
                    </a>
                  )}
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Contact: {emp.contactPerson} ({emp.designation})
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {notesPromptId === emp.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Verification notes (optional)..."
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleApprove(emp.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotesPromptId(null)}
                      className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setNotesPromptId(emp.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 text-xs transition-colors cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingEmployer(emp);
                        setRejectReason('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 font-medium hover:bg-rose-100 text-xs transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reject Modal */}
      {rejectingEmployer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <AlertTriangle className="w-5 h-5" /> Reject Employer Verification
              </div>
              <button
                type="button"
                onClick={() => setRejectingEmployer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600">
              Rejecting verification for <strong className="text-slate-900">{rejectingEmployer.companyName}</strong>.
              The recruiter will be notified with this documented justification.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Incomplete tax registration credentials or unverifiable domain..."
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingEmployer(null)}
                className="px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmReject}
                className="px-4 py-2 text-sm text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg font-medium cursor-pointer"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
