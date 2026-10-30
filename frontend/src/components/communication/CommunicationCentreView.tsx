import React, { useState, useEffect } from 'react';
import {
  fetchAnnouncementsApi,
  createAnnouncementApi,
} from '../../services/api';
import { AnnouncementData, AnnouncementPriority } from '../../types';
import {
  Megaphone,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building,
  ShieldAlert,
  Users,
  X,
  Search,
} from 'lucide-react';

interface CommunicationCentreViewProps {
  token: string | null;
  userRole?: string;
}

export const CommunicationCentreView: React.FC<CommunicationCentreViewProps> = ({
  token,
  userRole,
}) => {
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetAudience: 'COLLEGE_STUDENTS',
    priority: 'NORMAL' as AnnouncementPriority,
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetchAnnouncementsApi(token);
      if (res.success && res.data) {
        setAnnouncements(res.data);
      } else {
        setErrorMessage(res.error?.message || 'Failed to load announcements');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error loading announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const res = await createAnnouncementApi(formData, token);
      if (res.success && res.data) {
        setSuccessMessage('Announcement broadcasted successfully to relevant students.');
        setShowCreateModal(false);
        setAnnouncements((prev) => [res.data!, ...prev]);
        setFormData({
          title: '',
          content: '',
          targetAudience: 'COLLEGE_STUDENTS',
          priority: 'NORMAL',
        });
      } else {
        setErrorMessage(res.error?.message || 'Failed to broadcast announcement');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting announcement');
    }
  };

  const isBroadcaster = userRole === 'COLLEGE' || userRole === 'ADMIN';

  const filteredAnnouncements = announcements.filter((a) => {
    if (priorityFilter === 'ALL') return true;
    return a.priority === priorityFilter;
  });

  const getPriorityBadge = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wide">
            Urgent
          </span>
        );
      case 'HIGH':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wide">
            High Priority
          </span>
        );
      case 'NORMAL':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Notice
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            Info
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 uppercase tracking-wide">
              Official Placement Desk Noticeboard
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Verified Broadcasts Only
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Communication Centre</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Direct institutional broadcasts, placement drive updates, pool campus instructions, and verified notices for students and faculty.
          </p>
        </div>

        {isBroadcaster && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs sm:text-sm transition-colors shadow-lg shadow-teal-600/20 shrink-0"
          >
            <Plus className="w-4 h-4" /> Broadcast Announcement
          </button>
        )}
      </div>

      {/* Status Messages */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Priority Filters */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs">
        {['ALL', 'URGENT', 'HIGH', 'NORMAL'].map((p) => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-all ${
              priorityFilter === p
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {p === 'ALL' ? 'All Notices' : p}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">Loading notices...</div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs space-y-2">
          <Megaphone className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="font-semibold text-white">No announcements found</p>
          <p className="text-slate-500 max-w-sm mx-auto">
            Your college placement desk has not posted any announcements in this category yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {getPriorityBadge(item.priority)}
                  <h3 className="text-sm sm:text-base font-bold text-white">{item.title}</h3>
                </div>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(item.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {item.content}
              </p>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium text-slate-400">
                  <Building className="w-3.5 h-3.5 text-teal-400" />
                  Broadcasted by: {item.authorName} ({item.authorRole})
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Audience: {item.targetAudience.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Broadcast Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-teal-400" /> Broadcast Notice
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Mandatory Placement Drive Document Verification"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Priority Level</label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value as AnnouncementPriority })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="NORMAL">Normal Notice</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent Alert</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Content & Instructions *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write clear instructions for students regarding eligibility, venue, or required documentation..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-md"
                >
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
