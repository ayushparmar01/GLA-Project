import React, { useState, useEffect } from 'react';
import {
  MentorProfileData,
  MentorRecommendationData,
  MentorshipRequestData,
} from '../../types';
import {
  fetchVerifiedMentorsApi,
  fetchMentorRecommendationsApi,
} from '../../services/api';
import { MentorCard } from './MentorCard';
import { RequestMentorshipModal } from './RequestMentorshipModal';
import {
  Search,
  Filter,
  Sparkles,
  Users,
  GraduationCap,
  RefreshCw,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';

interface MentorDiscoveryDashboardProps {
  token?: string | null;
  onOpenWorkspace?: () => void;
  onRequestCreated?: (request: MentorshipRequestData) => void;
}

export const MentorDiscoveryDashboard: React.FC<MentorDiscoveryDashboardProps> = ({
  token,
  onOpenWorkspace,
  onRequestCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'RECOMMENDED' | 'ALL'>('RECOMMENDED');
  const [recommendations, setRecommendations] = useState<MentorRecommendationData[]>([]);
  const [allMentors, setAllMentors] = useState<MentorProfileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [alumniOnly, setAlumniOnly] = useState(false);

  // Request modal state
  const [selectedMentor, setSelectedMentor] = useState<MentorProfileData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [recsRes, mentorsRes] = await Promise.all([
        fetchMentorRecommendationsApi(token),
        fetchVerifiedMentorsApi(
          {
            search: searchTerm || undefined,
            industry: selectedIndustry || undefined,
            topic: selectedTopic || undefined,
            isAlumni: alumniOnly ? true : undefined,
          },
          token
        ),
      ]);

      if (recsRes.success && recsRes.data) {
        setRecommendations(recsRes.data);
      }
      if (mentorsRes.success && mentorsRes.data) {
        setAllMentors(mentorsRes.data.mentors || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load mentorship directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, selectedIndustry, selectedTopic, alumniOnly]);

  const handleRequestMentorship = (mentor: MentorProfileData) => {
    setSelectedMentor(mentor);
    setIsModalOpen(true);
  };

  const handleSuccessRequest = (req: MentorshipRequestData) => {
    setSuccessNotification(`Mentorship request successfully sent to ${req.mentorName || 'mentor'}!`);
    if (onRequestCreated) onRequestCreated(req);
    setTimeout(() => setSuccessNotification(null), 5000);
  };

  const industries = [
    'Software & IT',
    'Financial Services',
    'Data Science & AI',
    'Healthcare',
    'E-Commerce & Retail',
    'EdTech',
    'Cloud Architecture',
  ];

  const topics = [
    'Resume Review',
    'Mock Technical Interview',
    'Career Transition',
    'System Design Guidance',
    'Full-Stack Development',
    'Product Management',
    'Campus Placement Strategy',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/40 text-indigo-100 text-xs px-2.5 py-0.5 rounded-full font-medium">
              Mission Bharat • Phase 16
            </span>
            <span className="bg-emerald-500/30 text-emerald-200 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Compass className="w-3 h-3" /> Industry Connect
            </span>
          </div>
          <h1 className="text-2xl font-black mt-2 tracking-tight">AI-Powered Industry Mentorship</h1>
          <p className="text-indigo-200 text-xs max-w-xl mt-1 leading-relaxed">
            Connect directly with verified professionals and college alumni for mock interviews, career guidance, and portfolio reviews tailored to your skills.
          </p>
        </div>

        {onOpenWorkspace && (
          <button
            onClick={onOpenWorkspace}
            className="self-start md:self-auto bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <Users className="w-4 h-4 text-indigo-600" />
            My Active Mentorships
          </button>
        )}
      </div>

      {successNotification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{successNotification}</span>
          <button
            onClick={() => setSuccessNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs & Search Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('RECOMMENDED')}
              className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg transition-colors ${
                activeTab === 'RECOMMENDED'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Recommendations ({recommendations.length})
            </button>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg transition-colors ${
                activeTab === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              All Verified Mentors ({allMentors.length})
            </button>
          </div>

          <button
            onClick={loadData}
            className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1 self-end sm:self-auto"
            title="Refresh mentors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by company, title, skill (e.g. Google, React, System Design)..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-gray-700"
            >
              <option value="">All Industries</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-gray-700"
            >
              <option value="">All Topics</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-3 pt-1">
          <label className="flex items-center gap-1.5 text-xs text-gray-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={alumniOnly}
              onChange={(e) => setAlumniOnly(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
            College Alumni Mentors Only
          </label>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* Grid Content */}
      {loading && (
        <div className="py-16 text-center">
          <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">Discovering verified mentors and computing recommendations...</p>
        </div>
      )}

      {!loading && activeTab === 'RECOMMENDED' && (
        <div>
          {recommendations.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-800">No Recommendations Found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Complete your career profile with technical skills and career goals to receive tailored 6-factor mentor recommendations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommendations.map((rec) => (
                <MentorCard
                  key={rec.mentor.id}
                  mentor={rec.mentor}
                  recommendation={rec}
                  onRequestMentorship={handleRequestMentorship}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && activeTab === 'ALL' && (
        <div>
          {allMentors.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-800">No Mentors Match Your Filter Criteria</h3>
              <p className="text-xs text-gray-500 mt-1">
                Try resetting search terms or broadening industry selections.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {allMentors.map((mentor) => (
                <MentorCard
                  key={mentor.id}
                  mentor={mentor}
                  onRequestMentorship={handleRequestMentorship}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Request Modal */}
      <RequestMentorshipModal
        mentor={selectedMentor}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccessRequest}
        token={token}
      />
    </div>
  );
};
