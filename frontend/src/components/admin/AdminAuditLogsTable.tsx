import React, { useState } from 'react';
import { AuditLogEntry } from '../../types';
import {
  FileText,
  ShieldCheck,
  Filter,
  Clock,
  User,
  Activity,
} from 'lucide-react';

interface AdminAuditLogsTableProps {
  logs: AuditLogEntry[];
  totalLogs: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onFilterAction: (action: string) => void;
  onFilterResourceType: (resourceType: string) => void;
}

export const AdminAuditLogsTable: React.FC<AdminAuditLogsTableProps> = ({
  logs,
  totalLogs,
  currentPage,
  totalPages,
  loading,
  onPageChange,
  onFilterAction,
  onFilterResourceType,
}) => {
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedResource, setSelectedResource] = useState('');

  const handleActionChange = (val: string) => {
    setSelectedAction(val);
    onFilterAction(val);
  };

  const handleResourceChange = (val: string) => {
    setSelectedResource(val);
    onFilterResourceType(val);
  };

  const getActionBadge = (action: string) => {
    if (action.includes('SUSPEND') || action.includes('REJECT')) {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200">{action}</span>;
    }
    if (action.includes('VERIFY') || action.includes('REACTIVATE') || action.includes('APPROVE')) {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">{action}</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">{action}</span>;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Tamper-Resistant Audit Trail
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Append-only immutable record of all administrative decisions, suspensions, and verifications ({totalLogs} events logged)
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedAction}
            onChange={(e) => handleActionChange(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Actions</option>
            <option value="SUSPEND_USER">SUSPEND_USER</option>
            <option value="REACTIVATE_USER">REACTIVATE_USER</option>
            <option value="VERIFY_EMPLOYER">VERIFY_EMPLOYER</option>
            <option value="REJECT_EMPLOYER">REJECT_EMPLOYER</option>
            <option value="VERIFY_COLLEGE">VERIFY_COLLEGE</option>
            <option value="REVIEW_MODERATION">REVIEW_MODERATION</option>
          </select>

          <select
            value={selectedResource}
            onChange={(e) => handleResourceChange(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Resource Types</option>
            <option value="USER">USER</option>
            <option value="EMPLOYER">EMPLOYER</option>
            <option value="COLLEGE">COLLEGE</option>
            <option value="MODERATION">MODERATION</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-5 py-3.5">Timestamp</th>
              <th scope="col" className="px-5 py-3.5">Action</th>
              <th scope="col" className="px-5 py-3.5">Actor Role</th>
              <th scope="col" className="px-5 py-3.5">Target Resource</th>
              <th scope="col" className="px-5 py-3.5">Reason / Justification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  No audit log entries found matching current filter.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-xs font-medium text-slate-700">
                    {log.actorRole}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">{log.resourceType}</span>
                    {log.resourceId && (
                      <span className="text-slate-400 font-mono text-[11px] block truncate max-w-xs">
                        ID: {log.resourceId}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 max-w-md">
                    {log.reason || <span className="text-slate-400 italic">No notes recorded</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
