import React, { useState } from 'react';
import { MentorshipFeedbackData } from '../../types';
import { submitMentorshipFeedbackApi } from '../../services/api';
import { X, Star, AlertCircle, Check } from 'lucide-react';

interface MentorshipFeedbackModalProps {
  relationshipId: string;
  sessionId?: string;
  targetRoleLabel?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (feedback: MentorshipFeedbackData) => void;
  token?: string | null;
}

export const MentorshipFeedbackModal: React.FC<MentorshipFeedbackModalProps> = ({
  relationshipId,
  sessionId,
  targetRoleLabel = 'Mentor',
  isOpen,
  onClose,
  onSuccess,
  token,
}) => {
  const [rating, setRating] = useState(5);
  const [writtenFeedback, setWrittenFeedback] = useState('');
  const [strengths, setStrengths] = useState<string[]>([]);
  const [areasToImprove, setAreasToImprove] = useState<string[]>([]);
  const [customStrength, setCustomStrength] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickStrengths = [
    'Clear Explanations',
    'Actionable Feedback',
    'Deep Industry Insights',
    'Patient & Encouraging',
    'Great System Architecture Tips',
  ];

  const toggleStrength = (st: string) => {
    if (strengths.includes(st)) {
      setStrengths(strengths.filter((s) => s !== st));
    } else {
      setStrengths([...strengths, st]);
    }
  };

  const handleAddCustomStrength = () => {
    if (customStrength.trim() && !strengths.includes(customStrength.trim())) {
      setStrengths([...strengths, customStrength.trim()]);
      setCustomStrength('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writtenFeedback.trim()) {
      setError('Please provide written feedback regarding your session experience.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await submitMentorshipFeedbackApi(
        relationshipId,
        {
          sessionId,
          rating,
          writtenFeedback: writtenFeedback.trim(),
          strengthsHighlight: strengths,
          areasToImprove,
        },
        token
      );

      if (res.success && res.data) {
        onSuccess(res.data);
        onClose();
      } else {
        setError(res.error?.message || 'Failed to submit feedback.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while submitting feedback.');
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
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            Session Review & Rating
          </span>
          <h2 className="text-xl font-bold text-gray-900 mt-1">
            Rate Your Experience with {targetRoleLabel}
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating */}
          <div className="text-center py-2">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Overall Satisfaction (1 to 5 Stars)
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-amber-900 mt-1 block">
              {rating === 5
                ? 'Exceptional Mentorship (5/5)'
                : rating === 4
                ? 'Very Helpful (4/5)'
                : rating === 3
                ? 'Average (3/5)'
                : 'Needs Improvement'}
            </span>
          </div>

          {/* Quick Strengths Pills */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Highlight Key Strengths
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickStrengths.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => toggleStrength(st)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    strengths.includes(st)
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300 font-semibold'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Written Feedback */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Written Feedback & Review <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={writtenFeedback}
              onChange={(e) => setWrittenFeedback(e.target.value)}
              placeholder="What went well? How did this session help your career progression?"
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
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
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
