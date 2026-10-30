import React, { useState } from 'react';
import { MentorProfileData, MentorshipRequestData } from '../../types';
import { createMentorshipRequestApi } from '../../services/api';
import { X, Send, ShieldCheck, GraduationCap, AlertCircle } from 'lucide-react';

interface RequestMentorshipModalProps {
  mentor: MentorProfileData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (request: MentorshipRequestData) => void;
  token?: string | null;
}

export const RequestMentorshipModal: React.FC<RequestMentorshipModalProps> = ({
  mentor,
  isOpen,
  onClose,
  onSuccess,
  token,
}) => {
  const [topic, setTopic] = useState('');
  const [objective, setObjective] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [preferredFormat, setPreferredFormat] = useState<'ONE_ON_ONE' | 'GROUP'>('ONE_ON_ONE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !mentor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!topic.trim()) {
      setError('Please provide a mentorship topic.');
      return;
    }
    if (!objective.trim()) {
      setError('Please describe your specific learning objective.');
      return;
    }
    if (!introduction.trim()) {
      setError('Please provide a brief introduction about yourself.');
      return;
    }

    setLoading(true);
    try {
      const res = await createMentorshipRequestApi(
        {
          mentorProfileId: mentor.id,
          topic: topic.trim(),
          objective: objective.trim(),
          introduction: introduction.trim(),
          preferredFormat,
        },
        token
      );

      if (res.success && res.data) {
        onSuccess(res.data);
        onClose();
      } else {
        setError(res.error?.message || 'Failed to submit mentorship request.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            CareerBridge Mentorship Connect
          </span>
          <h2 className="text-xl font-bold text-gray-900 mt-1">Request Mentorship Guidance</h2>
        </div>

        {/* Selected Mentor Summary */}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 mb-5 flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-600 text-white font-bold text-base rounded-full flex items-center justify-center">
            {mentor.fullName ? mentor.fullName.charAt(0).toUpperCase() : 'M'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm font-bold text-gray-900 truncate">
                {mentor.fullName || `${mentor.designation} (${mentor.organization})`}
              </h4>
              {mentor.verificationStatus === 'VERIFIED' && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-blue-600" /> Verified
                </span>
              )}
              {mentor.isAlumni && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                  <GraduationCap className="w-3 h-3 text-emerald-600" /> Alumni
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 truncate">
              {mentor.designation} at <span className="font-semibold text-gray-800">{mentor.organization}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Mentorship Topic <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Mock Technical Interview, Resume Review, Backend Architecture"
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Primary Objective <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="What specific skills, questions, or goals do you want to accomplish in this mentorship?"
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Your Introduction <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              placeholder="Introduce your academic background, degree, branch, and current career interests."
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Preferred Session Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs font-medium transition-colors ${
                  preferredFormat === 'ONE_ON_ONE'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  checked={preferredFormat === 'ONE_ON_ONE'}
                  onChange={() => setPreferredFormat('ONE_ON_ONE')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                1-on-1 Mentorship (45 mins)
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs font-medium transition-colors ${
                  preferredFormat === 'GROUP'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  checked={preferredFormat === 'GROUP'}
                  onChange={() => setPreferredFormat('GROUP')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                Group Session Cohort
              </label>
            </div>
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
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
