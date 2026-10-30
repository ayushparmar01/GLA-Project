import React, { useState, useEffect } from 'react';
import { MentorshipGroupData } from '../../types';
import {
  fetchGroupMentorshipSessionsApi,
  joinGroupMentorshipSessionApi,
  leaveGroupMentorshipSessionApi,
  createGroupMentorshipSessionApi,
} from '../../services/api';
import {
  Users,
  Calendar,
  Clock,
  Video,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

interface GroupMentorshipViewProps {
  currentUserId?: string;
  isMentor?: boolean;
  token?: string | null;
}

export const GroupMentorshipView: React.FC<GroupMentorshipViewProps> = ({
  currentUserId,
  isMentor,
  token,
}) => {
  const [groups, setGroups] = useState<MentorshipGroupData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal create
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [maxCapacity, setMaxCapacity] = useState(25);
  const [creating, setCreating] = useState(false);

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchGroupMentorshipSessionsApi(token);
      if (res.success && res.data) {
        setGroups(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load group sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleJoin = async (groupId: string) => {
    try {
      const res = await joinGroupMentorshipSessionApi(groupId, token);
      if (res.success && res.data) {
        setGroups((prev) => prev.map((g) => (g.id === groupId ? res.data! : g)));
      } else {
        alert(res.error?.message || 'Failed to join group');
      }
    } catch {
      // Ignore
    }
  };

  const handleLeave = async (groupId: string) => {
    try {
      const res = await leaveGroupMentorshipSessionApi(groupId, token);
      if (res.success && res.data) {
        setGroups((prev) => prev.map((g) => (g.id === groupId ? res.data! : g)));
      }
    } catch {
      // Ignore
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTopic.trim() || !startDate) return;

    setCreating(true);
    try {
      const start = new Date(`${startDate}T${startTime}:00`);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      const res = await createGroupMentorshipSessionApi(
        {
          title: newTitle.trim(),
          topic: newTopic.trim(),
          description: newDesc.trim() || 'Interactive group cohort session.',
          maximumParticipants: maxCapacity,
          scheduledStart: start.toISOString(),
          scheduledEnd: end.toISOString(),
        },
        token
      );

      if (res.success && res.data) {
        setGroups((prev) => [res.data!, ...prev]);
        setIsCreateOpen(false);
        setNewTitle('');
        setNewTopic('');
        setNewDesc('');
      } else {
        alert(res.error?.message || 'Failed to create group session');
      }
    } catch {
      // Ignore
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" /> Group Mentorship Cohorts & Workshops
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Participate in interactive group coaching, live resume teardowns, and system design masterclasses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isMentor && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Host Session
            </button>
          )}
          <button
            onClick={loadGroups}
            className="p-2 text-gray-400 hover:text-gray-600"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      {groups.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-bold text-gray-800">No Group Sessions Scheduled</h3>
          <p className="text-xs text-gray-500 mt-1">Check back soon for upcoming cohort masterclasses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => {
            const isMember = currentUserId && (group.memberIds || []).includes(currentUserId);
            const isFull = (group.currentParticipantCount || 0) >= group.maximumParticipants;

            return (
              <div
                key={group.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">
                      {group.topic}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-500">
                      {group.currentParticipantCount || 0}/{group.maximumParticipants} Seats
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 mt-2">{group.title}</h3>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                    {group.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {new Date(group.scheduledStart).toLocaleDateString()} at{' '}
                      {new Date(group.scheduledStart).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    {group.mentorName && (
                      <p className="text-[11px] text-gray-400">
                        Hosted by <span className="font-semibold text-gray-700">{group.mentorName}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  {isMember ? (
                    <div className="flex items-center justify-between w-full">
                      {group.meetingLink && (
                        <a
                          href={group.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                        >
                          <Video className="w-3 h-3" /> Join Call
                        </a>
                      )}
                      <button
                        onClick={() => handleLeave(group.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold"
                      >
                        Leave
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled={isFull}
                      onClick={() => handleJoin(group.id)}
                      className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isFull
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {isFull ? 'Cohort Full' : 'Reserve Spot'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Host Group Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-gray-900 mb-4">Host Group Mentorship Session</h3>

            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Session Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. System Design Teardown: URL Shortener"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Topic</label>
                <input
                  type="text"
                  required
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g. Distributed Systems"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What will attendees learn in this workshop?"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  {creating ? 'Publishing...' : 'Publish Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
