import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Bookmark,
  CheckCircle,
  Clock,
  Star,
  Flag,
  Save,
  BookOpen,
  Share2,
  Tag,
} from 'lucide-react';
import { LearningResourceData } from '../../types';
import { toggleResourceBookmarkApi, reportLearningResourceApi } from '../../services/api';

interface ResourceDetailModalProps {
  resource: LearningResourceData;
  token?: string | null;
  onClose: () => void;
  onBookmarkChanged?: (isBookmarked: boolean, note?: string) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  token,
  onClose,
  onBookmarkChanged,
}) => {
  const [isBookmarked, setIsBookmarked] = useState(Boolean(resource.isBookmarked));
  const [personalNote, setPersonalNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  // Reporting state
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('BROKEN_LINK');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const handleToggleBookmark = async () => {
    try {
      const res = await toggleResourceBookmarkApi(resource.id, { personalNote }, token);
      if (res.success) {
        const nextState = res.isBookmarked !== undefined ? res.isBookmarked : !isBookmarked;
        setIsBookmarked(nextState);
        if (onBookmarkChanged) {
          onBookmarkChanged(nextState, personalNote);
        }
      }
    } catch {
      // Ignore
    }
  };

  const handleSaveNote = async () => {
    if (!personalNote.trim()) return;
    setSavingNote(true);
    try {
      const res = await toggleResourceBookmarkApi(resource.id, { personalNote }, token);
      if (res.success) {
        setIsBookmarked(true);
        setNoteSavedFeedback(true);
        setTimeout(() => setNoteSavedFeedback(false), 2500);
        if (onBookmarkChanged) {
          onBookmarkChanged(true, personalNote);
        }
      }
    } catch {
      // Ignore
    } finally {
      setSavingNote(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDetails.trim()) return;
    setSubmittingReport(true);
    try {
      const res = await reportLearningResourceApi(
        resource.id,
        { reason: reportReason, details: reportDetails },
        token
      );
      if (res.success) {
        setReportSuccess(true);
      }
    } catch {
      // Ignore
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {resource.resourceType}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {resource.difficulty}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleBookmark}
              className={`p-2 rounded-xl border transition ${
                isBookmarked
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-300 dark:border-amber-800'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isBookmarked ? 'Saved to personal library' : 'Save resource'}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {resource.title}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Provided by: {resource.provider}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {resource.estimatedDuration || '1-2 hours'}
              </span>
              <span className="flex items-center gap-1 text-amber-500 font-semibold">
                <Star className="w-3.5 h-3.5 fill-current" />
                {resource.rating || 4.8}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {resource.description}
          </div>

          {/* Skills Covered */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Skills Covered
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {(resource.skills || [resource.skill]).map((sk, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                >
                  <Tag className="w-3 h-3 text-indigo-500" />
                  {sk}
                </span>
              ))}
            </div>
          </div>

          {/* Personal Note Editor */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                Personal Learning Note (Private)
              </h4>
              {noteSavedFeedback && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>
            <textarea
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              placeholder="Add key insights, questions, or timestamps for your quick review..."
              rows={2}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={savingNote || !personalNote.trim()}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {savingNote ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>

          {/* Reporting Section */}
          {isReporting ? (
            <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-3">
              {reportSuccess ? (
                <div className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Thank you! Your report has been submitted to the moderation desk.
                </div>
              ) : (
                <form onSubmit={handleSubmitReport} className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Report Issue with Resource
                  </h4>
                  <div className="space-y-2">
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    >
                      <option value="BROKEN_LINK">Broken Link / 404 Error</option>
                      <option value="OUTDATED_CONTENT">Outdated / Deprecated Content</option>
                      <option value="INACCURATE_INFORMATION">Inaccurate Information</option>
                      <option value="INAPPROPRIATE">Inappropriate / Spam</option>
                      <option value="OTHER">Other Reason</option>
                    </select>
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Please specify why this resource needs review..."
                      required
                      rows={2}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 resize-none"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsReporting(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReport || !reportDetails.trim()}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium"
                    >
                      {submittingReport ? 'Submitting...' : 'Send Report'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Verified genuine curriculum reference</span>
              <button
                type="button"
                onClick={() => setIsReporting(true)}
                className="hover:text-rose-500 flex items-center gap-1 transition"
              >
                <Flag className="w-3.5 h-3.5" />
                Report issue
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium transition"
          >
            Close
          </button>

          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition"
          >
            Launch Resource
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
