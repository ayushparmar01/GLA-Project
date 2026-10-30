import React, { useState, useEffect } from 'react';
import {
  MentorshipRequestData,
  MentorshipRelationshipData,
} from '../../types';
import {
  fetchIncomingMentorshipRequestsApi,
  fetchOutgoingMentorshipRequestsApi,
  respondToMentorshipRequestApi,
  fetchUserRelationshipsApi,
} from '../../services/api';
import {
  Inbox,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Users,
  Video,
} from 'lucide-react';

interface MentorshipRequestManagementViewProps {
  currentUserId?: string;
  isMentor?: boolean;
  onOpenWorkspace: (relationshipId: string) => void;
  token?: string | null;
}

export const MentorshipRequestManagementView: React.FC<MentorshipRequestManagementViewProps> = ({
  currentUserId,
  isMentor,
  onOpenWorkspace,
  token,
}) => {
  const [activeTab, setActiveTab] = useState<'RELATIONSHIPS' | 'INCOMING' | 'OUTGOING'>('RELATIONSHIPS');
  const [relationships, setRelationships] = useState<MentorshipRelationshipData[]>([]);
  const [incoming, setIncoming] = useState<MentorshipRequestData[]>([]);
  const [outgoing, setOutgoing] = useState<MentorshipRequestData[]>([]);
  const [loading, setLoading] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseMsg, setResponseMsg] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [relRes, outRes] = await Promise.all([
        fetchUserRelationshipsApi(token),
        fetchOutgoingMentorshipRequestsApi(token),
      ]);

      if (relRes.success && relRes.data) setRelationships(relRes.data);
      if (outRes.success && outRes.data) setOutgoing(outRes.data);

      if (isMentor) {
        const inRes = await fetchIncomingMentorshipRequestsApi(token);
        if (inRes.success && inRes.data) setIncoming(inRes.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [isMentor]);

  const handleRespond = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const res = await respondToMentorshipRequestApi(
        requestId,
        { status, responseMessage: responseMsg.trim() || undefined },
        token
      );
      if (res.success && res.data) {
        setIncoming((prev) => prev.map((r) => (r.id === requestId ? res.data!.request : r)));
        if (res.data.relationship) {
          setRelationships((prev) => [res.data!.relationship!, ...prev]);
        }
        setRespondingId(null);
        setResponseMsg('');
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('RELATIONSHIPS')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'RELATIONSHIPS'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active Workspaces ({relationships.length})
          </button>

          {isMentor && (
            <button
              onClick={() => setActiveTab('INCOMING')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'INCOMING'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Incoming Requests ({incoming.length})
            </button>
          )}

          <button
            onClick={() => setActiveTab('OUTGOING')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'OUTGOING'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sent Requests ({outgoing.length})
          </button>
        </div>

        <button onClick={loadAll} className="p-1.5 text-gray-400 hover:text-gray-600">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 1. RELATIONSHIPS / WORKSPACES */}
      {activeTab === 'RELATIONSHIPS' && (
        <div className="space-y-4">
          {relationships.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <h3 className="text-sm font-bold text-gray-800">No Active Mentorships Yet</h3>
              <p className="text-xs text-gray-500 mt-1">
                Browse verified mentors and send a mentorship request to start your journey.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {relationships.map((rel) => (
                <div
                  key={rel.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {rel.status}
                      </span>
                      <span className="text-xs font-mono font-bold text-indigo-700">
                        {rel.overallProgress}% Done
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 mt-2">{rel.topic}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Partner:{' '}
                      <span className="font-semibold text-gray-800">
                        {rel.mentorName || rel.studentName}
                      </span>
                    </p>

                    {rel.primaryObjective && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2 italic">
                        "{rel.primaryObjective}"
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      {rel.completedSessions} sessions • {rel.completedGoals} goals
                    </span>
                    <button
                      onClick={() => onOpenWorkspace(rel.id)}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      Open Workspace <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. INCOMING REQUESTS (MENTORS) */}
      {activeTab === 'INCOMING' && (
        <div className="space-y-4">
          {incoming.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              <Inbox className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No incoming student requests pending.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incoming.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{req.topic}</h4>
                      <p className="text-xs text-gray-500">
                        From <span className="font-semibold text-gray-800">{req.studentName}</span> ({req.studentEmail})
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        req.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : req.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg space-y-1">
                    <p>
                      <strong>Objective:</strong> {req.objective}
                    </p>
                    <p>
                      <strong>Introduction:</strong> {req.introduction}
                    </p>
                  </div>

                  {req.status === 'PENDING' && (
                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleRespond(req.id, 'ACCEPTED')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accept Request
                      </button>
                      <button
                        onClick={() => handleRespond(req.id, 'REJECTED')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. OUTGOING REQUESTS (STUDENTS) */}
      {activeTab === 'OUTGOING' && (
        <div className="space-y-4">
          {outgoing.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              <Send className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No mentorship requests sent yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {outgoing.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{req.topic}</h4>
                      <p className="text-xs text-gray-500">
                        Mentor: <span className="font-semibold text-gray-800">{req.mentorName || 'Industry Mentor'}</span>
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        req.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : req.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg">
                    {req.objective}
                  </p>

                  {req.responseMessage && (
                    <div className="text-xs text-indigo-900 bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-100">
                      <strong>Mentor Note:</strong> {req.responseMessage}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
