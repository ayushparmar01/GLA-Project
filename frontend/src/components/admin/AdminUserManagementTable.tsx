import React, { useState } from 'react';
import { SafeUser, Role } from '../../types';
import {
  Search,
  Filter,
  UserX,
  UserCheck,
  AlertCircle,
  X,
  CheckCircle,
} from 'lucide-react';

interface AdminUserManagementTableProps {
  users: SafeUser[];
  totalUsers: number;
  currentPage: number;
  totalPages: number;
  currentUserId?: string;
  loading: boolean;
  onPageChange: (page: number) => void;
  onFilterRole: (role: string) => void;
  onFilterStatus: (status: string) => void;
  onSearch: (query: string) => void;
  onSuspendUser: (userId: string, reason: string) => Promise<boolean>;
  onReactivateUser: (userId: string) => Promise<boolean>;
}

export const AdminUserManagementTable: React.FC<AdminUserManagementTableProps> = ({
  users,
  totalUsers,
  currentPage,
  totalPages,
  currentUserId,
  loading,
  onPageChange,
  onFilterRole,
  onFilterStatus,
  onSearch,
  onSuspendUser,
  onReactivateUser,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Suspension modal state
  const [suspensionModalUser, setSuspensionModalUser] = useState<SafeUser | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    onFilterRole(role);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    onFilterStatus(status);
  };

  const handleOpenSuspendModal = (user: SafeUser) => {
    if (user.id === currentUserId) {
      alert('Administrators cannot suspend their own account.');
      return;
    }
    setSuspensionModalUser(user);
    setSuspensionReason('');
    setModalError(null);
  };

  const handleConfirmSuspend = async () => {
    if (!suspensionReason.trim()) {
      setModalError('A valid suspension reason is required for governance audit.');
      return;
    }
    if (!suspensionModalUser) return;

    setActionLoading(true);
    setModalError(null);
    const success = await onSuspendUser(suspensionModalUser.id, suspensionReason.trim());
    setActionLoading(false);
    if (success) {
      setSuspensionModalUser(null);
      setSuspensionReason('');
    } else {
      setModalError('Failed to suspend user account. Please try again.');
    }
  };

  const handleReactivate = async (user: SafeUser) => {
    if (!window.confirm(`Are you sure you want to reactivate the account for ${user.fullName} (${user.email})?`)) {
      return;
    }
    await onReactivateUser(user.id);
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'STUDENT':
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">STUDENT</span>;
      case 'EMPLOYER':
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">EMPLOYER</span>;
      case 'COLLEGE':
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-teal-50 text-teal-800 border border-teal-200">COLLEGE</span>;
      case 'ADMIN':
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-50 text-purple-800 border border-purple-200">ADMIN</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-800 border border-slate-200">{role}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header & Controls */}
      <div className="p-5 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">User Management</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review accounts, manage permissions, and govern platform security ({totalUsers} total users)
            </p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <form onSubmit={handleSearchSubmit} className="relative sm:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </form>

          <div className="flex gap-2 sm:col-span-2">
            <select
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-1/2 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-slate-700"
            >
              <option value="">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="EMPLOYER">Employers</option>
              <option value="COLLEGE">Colleges</option>
              <option value="ADMIN">Admins</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-1/2 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-5 py-3.5">User</th>
              <th scope="col" className="px-5 py-3.5">Role</th>
              <th scope="col" className="px-5 py-3.5">Account Status</th>
              <th scope="col" className="px-5 py-3.5">Joined Date</th>
              <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  No users found matching current filters.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isCurrentAdmin = u.id === currentUserId;
                const isSuspended = Boolean(u.isSuspended);

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{u.fullName}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {isSuspended ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3" /> Suspended
                          </span>
                          {u.suspensionReason && (
                            <div className="text-xs text-rose-600 mt-1 max-w-xs truncate" title={u.suspensionReason}>
                              Reason: {u.suspensionReason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-xs">
                      {isCurrentAdmin ? (
                        <span className="text-xs text-slate-400 italic">Current Session</span>
                      ) : isSuspended ? (
                        <button
                          type="button"
                          onClick={() => handleReactivate(u)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Reactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenSuspendModal(u)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 font-medium hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" /> Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
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

      {/* Suspension Modal */}
      {suspensionModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <AlertCircle className="w-5 h-5" /> Suspend User Account
              </div>
              <button
                type="button"
                onClick={() => setSuspensionModalUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-slate-600">
              You are about to suspend <strong className="text-slate-900">{suspensionModalUser.fullName}</strong> ({suspensionModalUser.email}).
              Suspended users cannot log in or participate in drives and cohorts.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Audited Suspension Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Specify the terms violation or governance justification..."
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
              {modalError && <p className="text-xs text-rose-600 mt-1">{modalError}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSuspensionModalUser(null)}
                className="px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmSuspend}
                className="px-4 py-2 text-sm text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg font-medium cursor-pointer"
              >
                {actionLoading ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
