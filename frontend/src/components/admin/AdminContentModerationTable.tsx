import React, { useState } from 'react';
import { ModerationItemData, ModerationItemStatus } from '../../types';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertOctagon,
  Filter,
  FileText,
  Building2,
  Calendar,
  MessageSquare,
} from 'lucide-react';

interface AdminContentModerationTableProps {
  items: ModerationItemData[];
  loading: boolean;
  onReviewItem: (id: string, status: ModerationItemStatus, notes?: string) => Promise<boolean>;
}

export const AdminContentModerationTable: React.FC<AdminContentModerationTableProps> = ({
  items,
  loading,
  onReviewItem,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const filteredItems = selectedStatus
    ? items.filter((i) => i.status === selectedStatus)
    : items;

  const handleReview = async (status: ModerationItemStatus) => {
    if (!reviewingId) return;
    setActionLoading(true);
    await onReviewItem(reviewingId, status, reviewNotes.trim() || undefined);
    setActionLoading(false);
    setReviewingId(null);
    setReviewNotes('');
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'OPPORTUNITY':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'EMPLOYER_PROFILE':
        return <Building2 className="w-4 h-4 text-indigo-600" />;
      case 'EVENT':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'ANNOUNCEMENT':
        return <MessageSquare className="w-4 h-4 text-teal-600" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-amber-600" />;
    }
  };

  const getStatusBadge = (status: ModerationItemStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Pending Review</span>;
      case 'ACTION_TAKEN':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">Action Taken / Removed</span>;
      case 'APPROVED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Content Approved</span>;
      case 'DISMISSED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">Report Dismissed</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" /> Content Moderation Queue
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit user reports, flagged opportunities, scam recruitment notices, and inappropriate postings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          >
            <option value="">All Statuses ({items.length})</option>
            <option value="PENDING">Pending Only</option>
            <option value="ACTION_TAKEN">Action Taken</option>
            <option value="APPROVED">Approved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
        </div>
      </div>

      <div className="divide-y divide-slate-200">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading moderation queue...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center">
            <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
            <p className="font-medium text-slate-800">No Flagged Items</p>
            <p className="text-xs text-slate-400 mt-1">No reported content items match the selected filter.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="p-5 hover:bg-slate-50/70 transition-colors space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 rounded-lg">{getTargetIcon(item.targetType)}</div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {item.targetType.replace(/_/g, ' ')}
                  </span>
                  {item.targetTitle && (
                    <span className="text-sm font-semibold text-slate-900 truncate max-w-sm">
                      · {item.targetTitle}
                    </span>
                  )}
                </div>
                <div>{getStatusBadge(item.status)}</div>
              </div>

              <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200/60 text-xs text-slate-800">
                <span className="font-semibold text-amber-900">Flagged Reason: </span>
                {item.reason}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
                <span>
                  Reported by: <strong className="text-slate-700">{item.flaggedByName || 'Anonymous User'}</strong> on{' '}
                  {new Date(item.createdAt).toLocaleString()}
                </span>

                {item.moderatorNotes && (
                  <span className="italic text-slate-600">
                    Notes: "{item.moderatorNotes}"
                  </span>
                )}
              </div>

              {/* Review Actions */}
              {item.status === 'PENDING' && (
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {reviewingId === item.id ? (
                    <div className="w-full space-y-2">
                      <input
                        type="text"
                        placeholder="Moderator reasoning / audit note..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleReview('APPROVED')}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 cursor-pointer"
                        >
                          Approve Content
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleReview('ACTION_TAKEN')}
                          className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700 cursor-pointer"
                        >
                          Take Action / Remove
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleReview('DISMISSED')}
                          className="px-3 py-1.5 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700 cursor-pointer"
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewingId(null)}
                          className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setReviewingId(item.id);
                        setReviewNotes('');
                      }}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Review & Resolve
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
