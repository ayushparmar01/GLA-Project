import React, { useState, useEffect } from 'react';
import {
  Flame,
  BookOpen,
  Layers,
  Award,
  Bookmark,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Target,
  Compass,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  LearningHubDashboardData,
  LearningRecommendationData,
} from '../../types';
import { fetchLearningHubDashboardApi } from '../../services/api';
import { ResourceLibraryView } from './ResourceLibraryView';
import { LearningPathsView } from './LearningPathsView';
import { SkillGapLearningView } from './SkillGapLearningView';
import { PersonalLibraryBookmarksView } from './PersonalLibraryBookmarksView';
import { ResourceDetailModal } from './ResourceDetailModal';

interface LearningHubDashboardProps {
  token?: string | null;
}

type TabType = 'OVERVIEW' | 'LIBRARY' | 'PATHS' | 'SKILL_GAPS' | 'BOOKMARKS';

export const LearningHubDashboard: React.FC<LearningHubDashboardProps> = ({ token }) => {
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [dashboardData, setDashboardData] = useState<LearningHubDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPillarsResourceId, setExpandedPillarsResourceId] = useState<string | null>(null);
  const [selectedPathIdForDetail, setSelectedPathIdForDetail] = useState<string | null>(null);
  const [selectedModalResource, setSelectedModalResource] = useState<any | null>(null);

  useEffect(() => {
    loadDashboard();
  }, [token]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetchLearningHubDashboardApi(token);
      if (res.success && res.data) {
        setDashboardData(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPath = (pathId: string | null) => {
    setSelectedPathIdForDetail(pathId);
    if (pathId) {
      setActiveTab('PATHS');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome Banner with Streak */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Advanced Learning & Resource Hub
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Master High-Demand Tech Skills
            </h1>
            <p className="text-sm text-indigo-100/90 leading-relaxed">
              Curated documentation, verified project roadmaps, and knowledge check evaluations designed to bridge the opportunity gap for non-placement tier colleges.
            </p>
          </div>

          {/* Streak Indicator Pill */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center gap-4 self-start md:self-auto shadow-inner">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
              <Flame className="w-7 h-7 fill-current animate-pulse text-amber-400" />
            </div>
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-indigo-200">
                Learning Streak
              </div>
              <div className="text-2xl font-black">
                {dashboardData?.stats.currentStreakDays || 1}{' '}
                <span className="text-sm font-semibold text-indigo-200">Days Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2 pb-1">
        {[
          { key: 'OVERVIEW', label: 'Dashboard Overview', icon: BookOpen },
          { key: 'LIBRARY', label: 'Curated Resource Library', icon: Compass },
          { key: 'PATHS', label: 'Structured Learning Paths', icon: Layers },
          { key: 'SKILL_GAPS', label: 'Skill Gap Bridge', icon: Target },
          { key: 'BOOKMARKS', label: 'My Saved Library', icon: Bookmark },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as TabType);
                if (tab.key !== 'PATHS') setSelectedPathIdForDetail(null);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          {/* 6 Key Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                label: 'Enrolled Paths',
                value: dashboardData?.stats.enrolledPathsCount || 0,
                icon: Layers,
                color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50',
              },
              {
                label: 'Completed Paths',
                value: dashboardData?.stats.completedPathsCount || 0,
                icon: CheckCircle,
                color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50',
              },
              {
                label: 'Saved Bookmarks',
                value: dashboardData?.stats.bookmarkedResourcesCount || 0,
                icon: Bookmark,
                color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50',
              },
              {
                label: 'Completed Modules',
                value: dashboardData?.stats.completedResourcesCount || 0,
                icon: BookOpen,
                color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/50',
              },
              {
                label: 'Quizzes Passed',
                value: dashboardData?.stats.quizzesPassedCount || 0,
                icon: Award,
                color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50',
              },
              {
                label: 'Day Streak',
                value: `${dashboardData?.stats.currentStreakDays || 1}d`,
                icon: Flame,
                color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50',
              },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-2"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">
                      {stat.value}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Continue Learning Feed */}
          {dashboardData?.continueLearning && dashboardData.continueLearning.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Continue Learning
                </h3>
                <button
                  onClick={() => setActiveTab('PATHS')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View All Paths &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dashboardData.continueLearning.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectPath(item.learningPathId)}
                    className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-400 transition cursor-pointer space-y-3 flex flex-col justify-between group"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        In Progress
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 transition mt-0.5 line-clamp-1">
                        {item.learningPathTitle}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {item.moduleTitle}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-500">Progress</span>
                        <span className="text-indigo-600 dark:text-indigo-400">
                          {item.progressPercentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${item.progressPercentage}%` }}
                        />
                      </div>
                      <button className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center justify-center gap-1.5 mt-2">
                        Resume Module
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5-Pillar Explainable Recommendations */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Personalized Recommendations (5-Pillar Explainable Algorithm)
                </h3>
                <p className="text-xs text-slate-500">
                  Calculated deterministically using: Career Goal (30%), Skill Gaps (30%), Market Demand (20%), Difficulty (10%), Format (10%).
                </p>
              </div>

              <button
                onClick={() => setActiveTab('LIBRARY')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline self-start sm:self-auto"
              >
                Browse All Resources &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardData?.recommendations.map((rec, idx) => {
                const res = rec.resource;
                const isExpanded = expandedPillarsResourceId === res.id;

                return (
                  <div
                    key={res.id || idx}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-indigo-400 transition"
                  >
                    <div className="space-y-3">
                      {/* Top Badges & Score */}
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                          {res.resourceType}
                        </span>

                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{rec.matchScore}% Match</span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h4
                          onClick={() => setSelectedModalResource(res)}
                          className="font-bold text-slate-900 dark:text-white text-sm hover:text-indigo-600 cursor-pointer transition line-clamp-2"
                        >
                          {res.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">{res.provider}</p>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        {res.description}
                      </p>

                      {/* Explainable Primary Rationale */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                        <div className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          Why Recommended:
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-xs">
                          {rec.whyRecommended[0] || rec.careerGoalMatch}
                        </p>
                      </div>

                      {/* Expandable 5-Pillar Score Breakdown */}
                      {isExpanded && (
                        <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                          <div className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
                            5-Pillar Algorithmic Breakdown:
                          </div>
                          {rec.pillars.map((pillar, pIdx) => (
                            <div
                              key={pIdx}
                              className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                                <span>{pillar.name}</span>
                                <span className="text-indigo-600 dark:text-indigo-400">
                                  {pillar.score} / {pillar.maxScore} pts
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {pillar.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPillarsResourceId(isExpanded ? null : res.id)
                        }
                        className="text-slate-500 hover:text-indigo-600 font-semibold flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            Hide Score Breakdown <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            View Score Rationale <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>

                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 transition"
                      >
                        Start Learning
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: LIBRARY */}
      {activeTab === 'LIBRARY' && (
        <ResourceLibraryView
          token={token}
          onNavigateToBookmarks={() => setActiveTab('BOOKMARKS')}
        />
      )}

      {/* Tab Content: PATHS */}
      {activeTab === 'PATHS' && (
        <LearningPathsView
          token={token}
          selectedPathId={selectedPathIdForDetail}
          onSelectPath={(pathId) => setSelectedPathIdForDetail(pathId)}
        />
      )}

      {/* Tab Content: SKILL_GAPS */}
      {activeTab === 'SKILL_GAPS' && (
        <SkillGapLearningView
          token={token}
          onSelectPath={(pathId) => {
            setSelectedPathIdForDetail(pathId);
            setActiveTab('PATHS');
          }}
        />
      )}

      {/* Tab Content: BOOKMARKS */}
      {activeTab === 'BOOKMARKS' && (
        <PersonalLibraryBookmarksView
          token={token}
          onBrowseResources={() => setActiveTab('LIBRARY')}
        />
      )}

      {/* Resource Detail Modal */}
      {selectedModalResource && (
        <ResourceDetailModal
          resource={selectedModalResource}
          token={token}
          onClose={() => setSelectedModalResource(null)}
        />
      )}
    </div>
  );
};
