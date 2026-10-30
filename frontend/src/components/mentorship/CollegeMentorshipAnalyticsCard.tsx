import React, { useState, useEffect } from 'react';
import { CollegeMentorshipAnalyticsReport } from '../../types';
import { fetchCollegeMentorshipAnalyticsApi } from '../../services/api';
import {
  GraduationCap,
  Users,
  Calendar,
  Star,
  ShieldCheck,
  Lock,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

interface CollegeMentorshipAnalyticsCardProps {
  token?: string | null;
}

export const CollegeMentorshipAnalyticsCard: React.FC<CollegeMentorshipAnalyticsCardProps> = ({
  token,
}) => {
  const [report, setReport] = useState<CollegeMentorshipAnalyticsReport | null>(null);
  const [loading, setLoading] = useState(false);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetchCollegeMentorshipAnalyticsApi(token);
      if (res.success && res.data) {
        setReport(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Phase 16 Mentorship
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Student Privacy Guaranteed
            </span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mt-1">
            Alumni Mentorship & Industry Connect Intelligence
          </h2>
          <p className="text-xs text-gray-500">
            Institutional overview of alumni mentors supporting {report?.collegeName || 'your students'}.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
          <span className="text-xs font-semibold text-indigo-700 block">Total Alumni Mentors</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-indigo-950">
              {report?.totalAlumniMentors || 0}
            </span>
            <span className="text-[11px] text-indigo-600 font-medium">
              ({report?.verifiedAlumniMentors || 0} verified)
            </span>
          </div>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
          <span className="text-xs font-semibold text-emerald-700 block">Active Student Mentees</span>
          <span className="text-2xl font-black text-emerald-950 mt-1 block">
            {report?.activeStudentMentees || 0}
          </span>
        </div>

        <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4">
          <span className="text-xs font-semibold text-purple-700 block">Sessions Completed</span>
          <span className="text-2xl font-black text-purple-950 mt-1 block">
            {report?.totalMentorshipSessions || 0}
          </span>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4">
          <span className="text-xs font-semibold text-amber-700 block">Satisfaction Rating</span>
          <div className="flex items-center gap-1.5 mt-1">
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            <span className="text-2xl font-black text-amber-950">
              {report?.averageSatisfactionRating?.toFixed(1) || '5.0'}
            </span>
            <span className="text-xs text-gray-500">/ 5.0</span>
          </div>
        </div>
      </div>

      {/* Top Topics & Top Industries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5">
            Top Mentorship Guidance Topics
          </h4>
          {(report?.topMentorshipTopics || []).length === 0 ? (
            <p className="text-xs text-gray-400">No topic data recorded yet.</p>
          ) : (
            <div className="space-y-1.5">
              {report!.topMentorshipTopics.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700">{item.topic}</span>
                  <span className="text-indigo-600 font-bold bg-white px-2 py-0.5 rounded border border-gray-200">
                    {item.count} sessions
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5">
            Top Industries Represented by Alumni
          </h4>
          {(report?.topIndustriesRepresented || []).length === 0 ? (
            <p className="text-xs text-gray-400">No industry data recorded yet.</p>
          ) : (
            <div className="space-y-1.5">
              {report!.topIndustriesRepresented.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700">{item.industry}</span>
                  <span className="text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-gray-200">
                    {item.count} mentors
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Strict Privacy Assurance Disclosure */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-2.5 text-xs text-gray-500">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p>
          <strong className="text-gray-700">Privacy Policy Guard:</strong> 1-on-1 messages, session video links, and private student notes are strictly end-to-end isolated between participants and never accessible to college coordinators or recruiters.
        </p>
      </div>
    </div>
  );
};
