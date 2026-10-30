import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Bookmark,
  ExternalLink,
  BookOpen,
  Clock,
  Star,
  CheckCircle,
  Video,
  FileText,
  Layers,
  Code,
  Award,
  Terminal,
  Compass,
} from 'lucide-react';
import { LearningResourceData } from '../../types';
import { fetchLearningResourcesApi, toggleResourceBookmarkApi } from '../../services/api';
import { ResourceDetailModal } from './ResourceDetailModal';

interface ResourceLibraryViewProps {
  token?: string | null;
  onNavigateToBookmarks?: () => void;
}

const RESOURCE_TYPES = [
  'ALL',
  'Documentation',
  'Video Tutorials',
  'Courses',
  'Practice Platforms',
  'Articles',
  'Interview Prep',
  'Coding Challenges',
  'Books',
  'Project Tutorials',
  'Certifications',
];

const CATEGORIES = [
  'ALL',
  'Web Development',
  'Programming Languages',
  'Data Structures & Algorithms',
  'Backend & Databases',
  'Cloud & DevOps',
  'AI & Machine Learning',
  'Cybersecurity',
  'System Design',
  'Interview Preparation',
];

export const ResourceLibraryView: React.FC<ResourceLibraryViewProps> = ({
  token,
  onNavigateToBookmarks,
}) => {
  const [resources, setResources] = useState<LearningResourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalResource, setActiveModalResource] = useState<LearningResourceData | null>(null);

  useEffect(() => {
    loadResources();
  }, [selectedType, selectedCategory, selectedDifficulty, searchQuery]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const res = await fetchLearningResourcesApi(
        {
          resourceType: selectedType !== 'ALL' ? selectedType : undefined,
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          difficulty: selectedDifficulty !== 'ALL' ? selectedDifficulty : undefined,
          search: searchQuery.trim() || undefined,
        },
        token
      );
      if (res.success && res.data) {
        setResources(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = async (resource: LearningResourceData, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await toggleResourceBookmarkApi(resource.id, {}, token);
      if (res.success) {
        setResources((prev) =>
          prev.map((r) =>
            r.id === resource.id ? { ...r, isBookmarked: res.isBookmarked } : r
          )
        );
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Curated Technical Resource Library
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Handpicked, verified documentation, interactive sandboxes, and career certifications.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by skill, topic, or provider..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* 10 Resource Type Filter Chips */}
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Resource Types
          </div>
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
            {RESOURCE_TYPES.map((type) => {
              const isSelected = selectedType === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {type === 'ALL' ? 'All Types (10)' : type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category & Difficulty Filters */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Difficulty:</span>
            {['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  selectedDifficulty === diff
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading resources...</div>
      ) : resources.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No resources match your filter criteria
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords, clear category filters, or explore all 10 resource types.
          </p>
          <button
            onClick={() => {
              setSelectedType('ALL');
              setSelectedCategory('ALL');
              setSelectedDifficulty('ALL');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((res) => (
            <div
              key={res.id}
              onClick={() => setActiveModalResource(res)}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-indigo-400 dark:hover:border-indigo-600 transition shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Card Top: Type & Bookmark */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                    {res.resourceType}
                  </span>

                  <button
                    onClick={(e) => handleToggleBookmark(res, e)}
                    className={`p-1.5 rounded-lg border transition ${
                      res.isBookmarked
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-300 dark:border-amber-800'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title={res.isBookmarked ? 'Bookmarked' : 'Add bookmark'}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${res.isBookmarked ? 'fill-current' : ''}`}
                    />
                  </button>
                </div>

                {/* Title & Provider */}
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-2 text-sm leading-snug">
                    {res.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {res.provider}
                  </p>
                </div>

                {/* Description snippet */}
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {res.description}
                </p>

                {/* Skill Badges */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {(res.skills || [res.skill]).slice(0, 3).map((sk, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {sk}
                    </span>
                  ))}
                  {(res.skills || []).length > 3 && (
                    <span className="text-[10px] text-slate-400 self-center">
                      +{res.skills!.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Card Meta */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-semibold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {res.rating || 4.8}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {res.estimatedDuration || '1-2 hrs'}
                  </span>
                </div>

                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 font-medium"
                >
                  Launch
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resource Detail Modal */}
      {activeModalResource && (
        <ResourceDetailModal
          resource={activeModalResource}
          token={token}
          onClose={() => setActiveModalResource(null)}
          onBookmarkChanged={(isBookmarked) => {
            setResources((prev) =>
              prev.map((r) =>
                r.id === activeModalResource.id ? { ...r, isBookmarked } : r
              )
            );
          }}
        />
      )}
    </div>
  );
};
