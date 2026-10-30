import React, { useState, useEffect } from 'react';
import { SkillData, SkillCategory } from '../../types';
import { fetchSkillsApi, fetchSkillCategoriesApi } from '../../services/api';

interface SkillsExplorerViewProps {
  onSelectSkillForAssessment?: (skillName: string) => void;
}

export const SkillsExplorerView: React.FC<SkillsExplorerViewProps> = ({
  onSelectSkillForAssessment,
}) => {
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
    loadSkills();
  }, []);

  useEffect(() => {
    loadSkills();
  }, [selectedCategory, searchQuery]);

  const loadCategories = async () => {
    const res = await fetchSkillCategoriesApi();
    if (res.success && res.data) {
      setCategories(res.data);
    }
  };

  const loadSkills = async () => {
    setLoading(true);
    setError(null);
    const categoryParam = selectedCategory === 'ALL' ? undefined : selectedCategory;
    const res = await fetchSkillsApi(categoryParam, searchQuery || undefined);
    if (res.success && res.data) {
      setSkills(res.data);
    } else {
      setError(res.error?.message || 'Failed to load skill taxonomy');
    }
    setLoading(false);
  };

  const getDifficultyBadge = (level: string) => {
    switch (level) {
      case 'BEGINNER':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'INTERMEDIATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ADVANCED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-700 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              Industry Standard Skill Taxonomy
            </span>
            <h2 className="text-2xl font-bold tracking-tight">Structured Skill Explorer</h2>
            <p className="text-indigo-100 text-sm mt-1 max-w-2xl">
              Standardized across 10 core computer engineering categories tailored for Tier-2/3
              undergraduate students. Verified skills power your Career Readiness Score.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-center">
            <span className="block text-2xl font-black">{skills.length}</span>
            <span className="text-xs text-indigo-100">Curated Skills</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            placeholder="Search skills, topics, or technologies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <svg
            className="w-5 h-5 text-slate-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading skill taxonomy...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      ) : skills.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-slate-600 font-medium">No skills found matching your filter.</p>
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setSearchQuery('');
            }}
            className="mt-3 px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-100"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-900 text-base">{skill.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getDifficultyBadge(
                      skill.difficultyLevel
                    )}`}
                  >
                    {skill.difficultyLevel}
                  </span>
                </div>
                <div className="mb-3">
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {skill.category}
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed mb-4">{skill.description}</p>
              </div>

              <div>
                {skill.relatedSkills && skill.relatedSkills.length > 0 && (
                  <div className="mb-4">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Related Skills:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {skill.relatedSkills.map((rel, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded border border-slate-200"
                        >
                          {rel}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {onSelectSkillForAssessment && (
                  <button
                    onClick={() => onSelectSkillForAssessment(skill.name)}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Verify Skill in Assessment</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
