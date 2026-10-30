import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchCareerProfileApi,
  addProjectApi,
  updateProjectApi,
  deleteProjectApi,
} from '../../services/api';
import { ProjectItem } from '../../types';
import {
  Briefcase,
  Plus,
  ExternalLink,
  Github,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FolderGit2,
} from 'lucide-react';

export const ProjectPortfolioView: React.FC = () => {
  const { token } = useAuth();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Project form
  const [form, setForm] = useState({
    title: '',
    description: '',
    techInput: '',
    role: '',
    duration: '',
    githubUrl: '',
    liveDemoUrl: '',
    visibility: 'PUBLIC' as 'PUBLIC' | 'PRIVATE',
  });

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchCareerProfileApi(token);
    if (res.success && res.data) {
      setProjects(res.data.profile.projects || []);
    } else {
      setError(res.error?.message || 'Failed to load project portfolio.');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentProjectId(null);
    setForm({
      title: '',
      description: '',
      techInput: '',
      role: '',
      duration: '',
      githubUrl: '',
      liveDemoUrl: '',
      visibility: 'PUBLIC',
    });
    setModalError(null);
    setShowModal(true);
  };

  const openEditModal = (proj: ProjectItem) => {
    setIsEditing(true);
    setCurrentProjectId(proj.id);
    setForm({
      title: proj.title,
      description: proj.description,
      techInput: proj.technologies ? proj.technologies.join(', ') : '',
      role: proj.role || '',
      duration: proj.duration || '',
      githubUrl: proj.githubUrl || '',
      liveDemoUrl: proj.liveDemoUrl || '',
      visibility: proj.visibility,
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (form.title.trim().length < 2) {
      setModalError('Project title must be at least 2 characters.');
      return;
    }
    if (form.description.trim().length < 10) {
      setModalError('Project description must be at least 10 characters.');
      return;
    }
    if (form.githubUrl && !form.githubUrl.startsWith('http')) {
      setModalError('GitHub URL must start with http:// or https://');
      return;
    }
    if (form.liveDemoUrl && !form.liveDemoUrl.startsWith('http')) {
      setModalError('Live Demo URL must start with http:// or https://');
      return;
    }

    setSaving(true);
    const techArray = form.techInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: Partial<ProjectItem> = {
      title: form.title.trim(),
      description: form.description.trim(),
      technologies: techArray,
      role: form.role.trim() || undefined,
      duration: form.duration.trim() || undefined,
      githubUrl: form.githubUrl.trim() || undefined,
      liveDemoUrl: form.liveDemoUrl.trim() || undefined,
      visibility: form.visibility,
    };

    if (isEditing && currentProjectId) {
      const res = await updateProjectApi(currentProjectId, payload, token);
      if (res.success && res.data) {
        setProjects((prev) =>
          prev.map((p) => (p.id === currentProjectId ? (res.data as ProjectItem) : p))
        );
        setSuccessMessage('Project updated successfully.');
        setShowModal(false);
      } else {
        setModalError(res.error?.message || 'Failed to update project.');
      }
    } else {
      const res = await addProjectApi(payload, token);
      if (res.success && res.data) {
        setProjects((prev) => [...prev, res.data as ProjectItem]);
        setSuccessMessage('New project added to portfolio!');
        setShowModal(false);
      } else {
        setModalError(res.error?.message || 'Failed to add project.');
      }
    }
    setSaving(false);
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to remove this project from your portfolio?')) return;
    const res = await deleteProjectApi(projectId, token);
    if (res.success) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setSuccessMessage('Project deleted from portfolio.');
    } else {
      setError(res.error?.message || 'Failed to delete project.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-blue-600" /> Project Portfolio
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Showcase real-world technical builds, hackathon solutions, and open-source contributions.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-600 font-bold">
            ×
          </button>
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="text-red-600 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="flex justify-center p-12 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center p-12 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
          <FolderGit2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-700">No Projects in Portfolio Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Adding at least one project increases your recruiter visibility score by 15% and provides concrete evidence of your practical engineering skills.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Add Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{proj.title}</h3>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          proj.visibility === 'PUBLIC'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {proj.visibility === 'PUBLIC' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {proj.visibility}
                      </span>
                    </div>
                    {proj.role && <p className="text-xs text-blue-600 font-medium mt-0.5">{proj.role}</p>}
                  </div>

                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      type="button"
                      onClick={() => openEditModal(proj)}
                      className="p-1 hover:text-blue-600 rounded"
                      title="Edit project"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(proj.id)}
                      className="p-1 hover:text-red-600 rounded"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{proj.description}</p>

                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {proj.technologies.map((t) => (
                      <span
                        key={t}
                        className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Links Footer */}
              <div className="flex items-center gap-3 pt-4 mt-4 border-t border-slate-100 text-xs">
                {proj.githubUrl && (
                  <a
                    href={proj.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-medium"
                  >
                    <Github className="w-3.5 h-3.5" /> Repository
                  </a>
                )}
                {proj.liveDemoUrl && (
                  <a
                    href={proj.liveDemoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                  </a>
                )}
                {proj.duration && <span className="ml-auto text-[11px] text-slate-400">{proj.duration}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {isEditing ? 'Edit Portfolio Project' : 'Add New Portfolio Project'}
            </h3>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProject} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Offline-First AgriTelemetry Hub"
                  className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the challenge solved, architecture used, and quantifiable outcome..."
                  className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Technologies Used (Comma-separated)
                </label>
                <input
                  type="text"
                  value={form.techInput}
                  onChange={(e) => setForm({ ...form, techInput: e.target.value })}
                  placeholder="e.g. React, Node.js, TypeScript, MongoDB, MQTT"
                  className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Role</label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="e.g. Lead Architect, Full Stack"
                    className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration / Timeline</label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="e.g. 3 Months, Dec 2025"
                    className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GitHub Repository URL</label>
                  <input
                    type="url"
                    value={form.githubUrl}
                    onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Live Demo URL</label>
                  <input
                    type="url"
                    value={form.liveDemoUrl}
                    onChange={(e) => setForm({ ...form, liveDemoUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Visibility in Candidate Reviews</label>
                <select
                  value={form.visibility}
                  onChange={(e) => setForm({ ...form, visibility: e.target.value as 'PUBLIC' | 'PRIVATE' })}
                  className="w-full p-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PUBLIC">Public — Visible to Verified Recruiters</option>
                  <option value="PRIVATE">Private — Draft (Hidden)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
