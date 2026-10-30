import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  ExternalLink,
  BookOpen,
  Trash2,
  Clock,
  Star,
  Edit3,
  Save,
  CheckCircle,
} from 'lucide-react';
import { ResourceBookmarkData } from '../../types';
import { fetchResourceBookmarksApi, toggleResourceBookmarkApi } from '../../services/api';

interface PersonalLibraryBookmarksViewProps {
  token?: string | null;
  onBrowseResources?: () => void;
}

export const PersonalLibraryBookmarksView: React.FC<PersonalLibraryBookmarksViewProps> = ({
  token,
  onBrowseResources,
}) => {
  const [bookmarks, setBookmarks] = useState<ResourceBookmarkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const res = await fetchResourceBookmarksApi(token);
      if (res.success && res.data) {
        setBookmarks(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (resourceId: string) => {
    try {
      const res = await toggleResourceBookmarkApi(resourceId, {}, token);
      if (res.success && !res.isBookmarked) {
        setBookmarks((prev) => prev.filter((b) => b.resourceId !== resourceId));
      }
    } catch {
      // Ignore
    }
  };

  const handleStartEditNote = (bookmark: ResourceBookmarkData) => {
    setEditingBookmarkId(bookmark.id);
    setEditNoteText(bookmark.personalNote || '');
  };

  const handleSaveNote = async (resourceId: string) => {
    setSavingNote(true);
    try {
      const res = await toggleResourceBookmarkApi(
        resourceId,
        { personalNote: editNoteText },
        token
      );
      if (res.success) {
        setBookmarks((prev) =>
          prev.map((b) =>
            b.resourceId === resourceId ? { ...b, personalNote: editNoteText } : b
          )
        );
        setEditingBookmarkId(null);
      }
    } catch {
      // Ignore
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-indigo-600 dark:text-indigo-400 fill-current" />
            My Personal Learning Library
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Bookmarked documentation, articles, and personal revision notes.
          </p>
        </div>

        {onBrowseResources && (
          <button
            onClick={onBrowseResources}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
          >
            Browse More Resources
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading your saved resources...</div>
      ) : bookmarks.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No saved resources yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Browse the curated resource library and bookmark guides, video bootcamps, and practice platforms for quick reference.
          </p>
          {onBrowseResources && (
            <button
              onClick={onBrowseResources}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
            >
              Explore Resource Catalog
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {bookmarks.map((bm) => {
            const res = bm.resource;
            const isEditing = editingBookmarkId === bm.id;

            return (
              <div
                key={bm.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                      {res?.resourceType || 'Documentation'}
                    </span>

                    <button
                      onClick={() => handleRemoveBookmark(bm.resourceId)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      title="Remove from saved library"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">
                      {res?.title || 'Saved Technical Resource'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {res?.provider || 'Curated Resource'}
                    </p>
                  </div>

                  {/* Personal Note Box */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px]">
                      <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                        <BookOpen className="w-3.5 h-3.5" /> Private Note
                      </span>
                      {!isEditing && (
                        <button
                          onClick={() => handleStartEditNote(bm)}
                          className="hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          value={editNoteText}
                          onChange={(e) => setEditNoteText(e.target.value)}
                          rows={2}
                          className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 resize-none outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingBookmarkId(null)}
                            className="px-2.5 py-1 text-slate-500 hover:bg-slate-200 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveNote(bm.resourceId)}
                            disabled={savingNote}
                            className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            {savingNote ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-700 dark:text-slate-300 italic">
                        {bm.personalNote || 'No notes added yet. Click edit to save key reminders.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Link */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Saved {new Date(bm.createdAt).toLocaleDateString()}
                  </span>

                  {res?.url && (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold flex items-center gap-1"
                    >
                      Open Link
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
