import React, { useState } from 'react';
import { MentorshipSessionData } from '../../types';
import { scheduleMentorshipSessionApi } from '../../services/api';
import { X, Calendar, Clock, Video, AlertCircle, Check } from 'lucide-react';

interface SessionSchedulingModalProps {
  relationshipId: string;
  defaultTopic?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: MentorshipSessionData) => void;
  token?: string | null;
}

export const SessionSchedulingModal: React.FC<SessionSchedulingModalProps> = ({
  relationshipId,
  defaultTopic,
  isOpen,
  onClose,
  onSuccess,
  token,
}) => {
  const [title, setTitle] = useState(defaultTopic ? `${defaultTopic} Session` : '1-on-1 Mentorship Session');
  const [sessionTopic, setSessionTopic] = useState(defaultTopic || 'Technical Guidance & Review');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [meetingLink, setMeetingLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!startDate || !startTime) {
      setError('Please choose a valid date and start time.');
      return;
    }

    const scheduledStart = new Date(`${startDate}T${startTime}:00`);
    const scheduledEnd = new Date(scheduledStart.getTime() + durationMinutes * 60 * 1000);

    if (isNaN(scheduledStart.getTime())) {
      setError('Invalid date format.');
      return;
    }

    setLoading(true);
    try {
      const res = await scheduleMentorshipSessionApi(
        relationshipId,
        {
          title: title.trim(),
          sessionTopic: sessionTopic.trim(),
          scheduledStart: scheduledStart.toISOString(),
          scheduledEnd: scheduledEnd.toISOString(),
          durationMinutes,
          sessionType: 'ONE_ON_ONE',
          meetingLink: meetingLink.trim() || undefined,
        },
        token
      );

      if (res.success && res.data) {
        onSuccess(res.data);
        onClose();
      } else {
        setError(res.error?.message || 'Failed to schedule session.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during scheduling.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            Calendar Booking
          </span>
          <h2 className="text-xl font-bold text-gray-900 mt-1">Schedule Mentorship Session</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Session Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Resume & Mock Interview"
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Topic Agenda <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={sessionTopic}
              onChange={(e) => setSessionTopic(e.target.value)}
              placeholder="e.g. Full-Stack System Architecture"
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Duration</label>
            <div className="grid grid-cols-3 gap-2">
              {[30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                    durationMinutes === mins
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {mins} Minutes
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Meeting Room Link (Optional)
            </label>
            <div className="relative">
              <Video className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="Leave blank for auto-generated CareerBridge Meet room"
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? (
                'Confirming...'
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5" />
                  Schedule Session
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
