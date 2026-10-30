import React from 'react';
import { MentorProfileData, MentorRecommendationData } from '../../types';
import {
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Star,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  Globe,
} from 'lucide-react';

interface MentorCardProps {
  mentor: MentorProfileData;
  recommendation?: MentorRecommendationData;
  onRequestMentorship: (mentor: MentorProfileData) => void;
  onViewProfile?: (mentor: MentorProfileData) => void;
}

export const MentorCard: React.FC<MentorCardProps> = ({
  mentor,
  recommendation,
  onRequestMentorship,
  onViewProfile,
}) => {
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'EXCELLENT_MATCH':
        return { label: 'Excellent Match (85%+)', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'STRONG_MATCH':
        return { label: 'Strong Match (70-84%)', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'MODERATE_MATCH':
        return { label: 'Moderate Match (50-69%)', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
      default:
        return { label: 'Potential Growth Match', bg: 'bg-gray-100 text-gray-800 border-gray-300' };
    }
  };

  const isAtCapacity = mentor.activeMenteeCount >= mentor.maximumMentees;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
      <div>
        {/* Card Header & Matching Ribbon */}
        {recommendation && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-2.5 border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-900">
                AI Compatibility: {recommendation.compatibilityScore}%
              </span>
            </div>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                getCategoryBadge(recommendation.matchCategory).bg
              }`}
            >
              {getCategoryBadge(recommendation.matchCategory).label}
            </span>
          </div>
        )}

        <div className="p-5">
          {/* Top Info & Verification Badges */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center flex-wrap gap-1.5">
                <h3 className="text-lg font-bold text-gray-900">
                  {mentor.fullName || `${mentor.designation} (${mentor.organization})`}
                </h3>
                {mentor.verificationStatus === 'VERIFIED' && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200"
                    title="Verified Industry Professional"
                  >
                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                    Verified
                  </span>
                )}
                {mentor.isAlumni && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200"
                    title="College Alumni"
                  >
                    <GraduationCap className="w-3 h-3 text-emerald-600" />
                    Alumni
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-indigo-600 mt-0.5">
                {mentor.designation} at <span className="font-semibold text-gray-800">{mentor.organization}</span>
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Briefcase className="w-3 h-3" />
                {mentor.experienceYears} Years Exp • {mentor.industry}
              </p>
            </div>

            {/* Rating / Reviews */}
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span className="text-xs font-bold text-amber-900">
                  {mentor.ratingAverage?.toFixed(1) || '5.0'}
                </span>
                <span className="text-[10px] text-gray-500">({mentor.totalReviews || 0})</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-0.5">
                <Users className="w-3 h-3" />
                {mentor.activeMenteeCount || 0}/{mentor.maximumMentees} mentees
              </span>
            </div>
          </div>

          {/* Bio Preview */}
          {mentor.bio && (
            <p className="text-xs text-gray-600 mt-3 line-clamp-2 leading-relaxed">
              {mentor.bio}
            </p>
          )}

          {/* Key Expertise Pills */}
          <div className="mt-3.5">
            <span className="text-[11px] font-semibold text-gray-500 block mb-1">Expertise & Skills</span>
            <div className="flex flex-wrap gap-1.5">
              {(mentor.expertise || []).slice(0, 4).map((skill, idx) => (
                <span
                  key={idx}
                  className="text-[11px] bg-gray-100 text-gray-700 font-medium px-2 py-0.5 rounded-md"
                >
                  {skill}
                </span>
              ))}
              {(mentor.expertise || []).length > 4 && (
                <span className="text-[11px] text-gray-400 self-center">
                  +{(mentor.expertise || []).length - 4} more
                </span>
              )}
            </div>
          </div>

          {/* Mentorship Topics */}
          <div className="mt-2.5">
            <span className="text-[11px] font-semibold text-gray-500 block mb-1">Topics Offered</span>
            <div className="flex flex-wrap gap-1.5">
              {(mentor.mentorshipTopics || []).slice(0, 3).map((topic, idx) => (
                <span
                  key={idx}
                  className="text-[11px] bg-purple-50 text-purple-700 border border-purple-100 font-medium px-2 py-0.5 rounded-md"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>

          {/* Languages & Availability */}
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-gray-400" />
              {(mentor.languages || ['English']).join(', ')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-400" />
              {(mentor.availableDays || []).slice(0, 2).join(', ') || 'Flexible'}
            </span>
          </div>

          {/* Explainability factors for recommendations */}
          {recommendation && recommendation.positiveMatchReasons.length > 0 && (
            <div className="mt-3 bg-emerald-50/70 border border-emerald-100 rounded-lg p-2.5">
              <p className="text-[11px] font-semibold text-emerald-900 flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-emerald-600" /> Why this match:
              </p>
              <ul className="text-[11px] text-emerald-800 space-y-0.5 list-disc list-inside">
                {recommendation.positiveMatchReasons.slice(0, 2).map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
        {onViewProfile && (
          <button
            type="button"
            onClick={() => onViewProfile(mentor)}
            className="text-xs font-semibold text-gray-700 hover:text-indigo-600 px-2 py-1.5 transition-colors"
          >
            View Details
          </button>
        )}

        <button
          type="button"
          disabled={isAtCapacity}
          onClick={() => onRequestMentorship(mentor)}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm ${
            isAtCapacity
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {isAtCapacity ? 'Capacity Reached' : 'Request Mentorship'}
          {!isAtCapacity && <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
