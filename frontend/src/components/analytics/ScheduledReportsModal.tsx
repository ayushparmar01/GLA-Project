import React, { useState, useEffect } from 'react';
import { ScheduledReportData, ReportScopeType, ReportFormat } from '../../types';
import { listSchedulesApi, createScheduleApi, deleteScheduleApi, updateScheduleApi } from '../../services/api';

export interface ScheduledReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scopeType: ReportScopeType;
  scopeId: string;
  token?: string | null;
}

export const ScheduledReportsModal: React.FC<ScheduledReportsModalProps> = ({
  isOpen,
  onClose,
  scopeType,
  scopeId,
  token,
}) => {
  const [schedules, setSchedules] = useState<ScheduledReportData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // New schedule form state
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [format, setFormat] = useState<ReportFormat>('CSV');
  const [recipientsInput, setRecipientsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSchedules();
    }
  }, [isOpen]);

  const loadSchedules = async () => {
    setLoading(true);
    const res = await listSchedulesApi(scopeType, token);
    if (res.success && res.data) {
      setSchedules(res.data);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setIsSubmitting(true);
    const recipients = recipientsInput
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const res = await createScheduleApi(
      {
        title,
        reportType: `${scopeType}_SCHEDULED_DIGEST`,
        scopeType,
        scopeId,
        frequency,
        format,
        recipients,
      },
      token
    );

    if (res.success && res.data) {
      setSchedules([res.data, ...schedules]);
      setTitle('');
      setRecipientsInput('');
      setShowAddForm(false);
    }
    setIsSubmitting(false);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    const res = await deleteScheduleApi(scheduleId, token);
    if (res.success) {
      setSchedules(schedules.filter((s) => s.id !== scheduleId));
    }
  };

  const handleToggleSchedule = async (schedule: ScheduledReportData) => {
    const res = await updateScheduleApi(schedule.id, { enabled: !schedule.enabled }, token);
    if (res.success && res.data) {
      setSchedules(schedules.map((s) => (s.id === schedule.id ? res.data! : s)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Automated Report Schedules</h3>
            <p className="text-xs text-gray-500">Configure recurring digests delivered automatically</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Schedules</h4>
            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1 rounded bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                + New Schedule
              </button>
            )}
          </div>

          {showAddForm && (
            <form onSubmit={handleCreateSchedule} className="mt-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Schedule Name</label>
                <input
                  type="text"
                  placeholder="e.g., Weekly Placement Digest"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="mt-1 block w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900"
                  >
                    <option value="DAILY">Daily (every morning)</option>
                    <option value="WEEKLY">Weekly (every Monday)</option>
                    <option value="MONTHLY">Monthly (1st of month)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900"
                  >
                    <option value="CSV">CSV Spreadsheet</option>
                    <option value="PDF">Summary Document</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Recipients (comma separated)</label>
                <input
                  type="text"
                  placeholder="officer@college.edu, principal@college.edu"
                  value={recipientsInput}
                  onChange={(e) => setRecipientsInput(e.target.value)}
                  className="mt-1 block w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          )}

          {/* List of schedules */}
          <div className="mt-3 max-h-60 overflow-y-auto space-y-2">
            {loading ? (
              <p className="py-6 text-center text-xs text-gray-500">Loading schedules...</p>
            ) : schedules.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 py-6 text-center">
                <p className="text-xs text-gray-500">No scheduled reports active.</p>
                <p className="text-[11px] text-gray-400">Add a schedule to automate weekly or monthly exports.</p>
              </div>
            ) : (
              schedules.map((sched) => (
                <div
                  key={sched.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-xs"
                >
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">{sched.title}</h5>
                    <p className="text-[11px] text-gray-500">
                      Frequency: <span className="font-semibold text-gray-700">{sched.frequency}</span> • Format:{' '}
                      <span className="font-semibold text-gray-700">{sched.format}</span>
                    </p>
                    {sched.recipients && sched.recipients.length > 0 && (
                      <p className="text-[10px] text-gray-400">To: {sched.recipients.join(', ')}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleSchedule(sched)}
                      className={`rounded px-2 py-1 text-[11px] font-semibold transition ${
                        sched.enabled
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {sched.enabled ? 'Active' : 'Paused'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSchedule(sched.id)}
                      className="text-gray-400 hover:text-red-600 text-xs px-1"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
