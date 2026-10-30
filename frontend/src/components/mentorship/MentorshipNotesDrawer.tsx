import React, { useState, useEffect } from 'react';
import { MentorshipNoteData, NoteVisibility } from '../../types';
import {
  fetchMentorshipNotesApi,
  createMentorshipNoteApi,
  deleteMentorshipNoteApi,
} from '../../services/api';
import { X, Lock, Users, Plus, Trash2, RefreshCw, FileText } from 'lucide-react';

interface MentorshipNotesDrawerProps {
  relationshipId: string;
  currentUserId?: string;
  isOpen: boolean;
  onClose: () => void;
  token?: string | null;
}

export const MentorshipNotesDrawer: React.FC<MentorshipNotesDrawerProps> = ({
  relationshipId,
  currentUserId,
  isOpen,
  onClose,
  token,
}) => {
  const [notes, setNotes] = useState<MentorshipNoteData[]>([]);
  const [newContent, setNewContent] = useState('');
  const [newVisibility, setNewVisibility] = useState<NoteVisibility>('PRIVATE');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadNotes = async () => {
    if (!relationshipId) return;
    setLoading(true);
    try {
      const res = await fetchMentorshipNotesApi(relationshipId, token);
      if (res.success && res.data) {
        setNotes(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen, relationshipId]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || creating) return;

    setCreating(true);
    try {
      const res = await createMentorshipNoteApi(
        relationshipId,
        {
          content: newContent.trim(),
          visibility: newVisibility,
        },
        token
      );
      if (res.success && res.data) {
        setNotes((prev) => [res.data!, ...prev]);
        setNewContent('');
      }
    } catch {
      // Ignore
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await deleteMentorshipNoteApi(relationshipId, noteId, token);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch {
      // Ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-gray-900">Session Notes & Action Points</h3>
            <span className="text-[10px] text-gray-500">Private or shared workspace documentation</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={loadNotes} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Note Creator Form */}
      <form onSubmit={handleCreateNote} className="p-3 bg-indigo-50/50 border-b border-indigo-100 space-y-2">
        <textarea
          rows={3}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Take notes, track recommendations, or write questions..."
          className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white"
        />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-[11px] font-medium text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                checked={newVisibility === 'PRIVATE'}
                onChange={() => setNewVisibility('PRIVATE')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <Lock className="w-3 h-3 text-gray-500" /> Private (Only Me)
            </label>
            <label className="flex items-center gap-1 text-[11px] font-medium text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                checked={newVisibility === 'SHARED'}
                onChange={() => setNewVisibility('SHARED')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <Users className="w-3 h-3 text-indigo-600" /> Shared
            </label>
          </div>

          <button
            type="submit"
            disabled={creating || !newContent.trim()}
            className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3 h-3" /> Save Note
          </button>
        </div>
      </form>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notes.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No notes recorded yet.</p>
          </div>
        ) : (
          notes.map((note) => {
            const isAuthor = currentUserId && note.authorId === currentUserId;
            return (
              <div
                key={note.id}
                className="p-3 bg-white rounded-xl border border-gray-200 shadow-xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span
                    className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full ${
                      note.visibility === 'PRIVATE'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {note.visibility === 'PRIVATE' ? (
                      <>
                        <Lock className="w-2.5 h-2.5" /> Private
                      </>
                    ) : (
                      <>
                        <Users className="w-2.5 h-2.5" /> Shared Note
                      </>
                    )}
                  </span>

                  <div className="flex items-center gap-2 text-gray-400">
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    {isAuthor && (
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="hover:text-red-500 transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
