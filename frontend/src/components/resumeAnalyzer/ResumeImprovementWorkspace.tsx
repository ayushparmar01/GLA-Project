import React, { useState } from 'react';
import {
  ExtractedStructuredResume,
  ResumeVersionData,
} from '../../types';
import {
  FileEdit,
  Save,
  Download,
  Share2,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { createResumeVersionApi, exportImprovedResumePdfApi } from '../../services/api';

interface ResumeImprovementWorkspaceProps {
  documentId: string;
  initialData: ExtractedStructuredResume;
  token?: string | null;
  onVersionSaved?: (version: ResumeVersionData) => void;
  onNavigateToResumeBuilder?: () => void;
}

export const ResumeImprovementWorkspace: React.FC<ResumeImprovementWorkspaceProps> = ({
  documentId,
  initialData,
  token,
  onVersionSaved,
  onNavigateToResumeBuilder,
}) => {
  const [data, setData] = useState<ExtractedStructuredResume>(JSON.parse(JSON.stringify(initialData)));
  const [changeSummary, setChangeSummary] = useState<string>('Refined project bullets and technical skills alignment');
  const [saving, setSaving] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handlers for personal summary
  const handleSummaryChange = (val: string) => {
    setData((prev) => ({
      ...prev,
      contact: { ...prev.contact, summary: val },
    }));
  };

  // Handlers for technical skills
  const handleSkillChange = (idx: number, val: string) => {
    const next = [...data.technicalSkills];
    next[idx] = val;
    setData((prev) => ({ ...prev, technicalSkills: next }));
  };

  const handleAddSkill = () => {
    setData((prev) => ({
      ...prev,
      technicalSkills: [...prev.technicalSkills, 'New Skill'],
    }));
  };

  const handleRemoveSkill = (idx: number) => {
    setData((prev) => ({
      ...prev,
      technicalSkills: prev.technicalSkills.filter((_, i) => i !== idx),
    }));
  };

  // Handlers for project bullets
  const handleProjectBulletChange = (projIdx: number, bulletIdx: number, val: string) => {
    const nextProjects = [...data.projects];
    if (nextProjects[projIdx]?.bullets) {
      nextProjects[projIdx].bullets[bulletIdx] = val;
      setData((prev) => ({ ...prev, projects: nextProjects }));
    }
  };

  const handleAddProjectBullet = (projIdx: number) => {
    const nextProjects = [...data.projects];
    if (nextProjects[projIdx]) {
      nextProjects[projIdx].bullets = [...(nextProjects[projIdx].bullets || []), 'Engineered a modular component...'];
      setData((prev) => ({ ...prev, projects: nextProjects }));
    }
  };

  const handleRemoveProjectBullet = (projIdx: number, bulletIdx: number) => {
    const nextProjects = [...data.projects];
    if (nextProjects[projIdx]?.bullets) {
      nextProjects[projIdx].bullets = nextProjects[projIdx].bullets.filter((_, i) => i !== bulletIdx);
      setData((prev) => ({ ...prev, projects: nextProjects }));
    }
  };

  // Save Version
  const handleSaveVersion = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await createResumeVersionApi(
        {
          documentId,
          structuredData: data,
          changeSummary,
        },
        token
      );

      if (res.success && res.data) {
        setMessage({
          type: 'success',
          text: `Version ${res.data.versionNumber} saved successfully to your version history.`,
        });
        if (onVersionSaved) onVersionSaved(res.data);
      } else {
        setMessage({
          type: 'error',
          text: res.error?.message || 'Failed to save resume version.',
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error saving version.' });
    } finally {
      setSaving(false);
    }
  };

  // Export Improved PDF
  const handleExportPdf = async () => {
    setExporting(true);
    setMessage(null);
    try {
      const blob = await exportImprovedResumePdfApi(
        {
          title: 'ATS-Optimized Resume',
          structuredData: data,
          template: 'MODERN',
        },
        token
      );

      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ATS_Optimized_Resume_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setMessage({
          type: 'success',
          text: 'PDF downloaded successfully with clean ATS-compliant styling.',
        });
      } else {
        setMessage({ type: 'error', text: 'Failed to generate PDF.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error exporting PDF.' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2">
            <FileEdit className="w-3.5 h-3.5 text-emerald-600" />
            Resume Optimization Workspace
          </div>
          <h3 className="text-lg font-bold text-slate-900">Fine-Tune Sections &amp; Save Versions</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Apply accepted bullet phrasing, update technical skills, and export an ATS-compliant PDF document.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToResumeBuilder && (
            <button
              type="button"
              onClick={onNavigateToResumeBuilder}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Resume Builder</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exporting}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {exporting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Editor Sections */}
      <div className="space-y-6">
        {/* 1. Summary / Objective */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Professional Summary / Career Objective
          </label>
          <textarea
            rows={3}
            value={data.contact?.summary || ''}
            onChange={(e) => handleSummaryChange(e.target.value)}
            placeholder="Write a concise 2-sentence technical summary..."
            className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
          />
        </div>

        {/* 2. Technical Skills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Technical Skills List ({data.technicalSkills.length})
            </label>
            <button
              type="button"
              onClick={handleAddSkill}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Skill
            </button>
          </div>

          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            {data.technicalSkills.map((skill, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
              >
                <input
                  type="text"
                  value={skill}
                  onChange={(e) => handleSkillChange(idx, e.target.value)}
                  className="w-24 sm:w-28 text-xs font-medium text-slate-800 border-none focus:outline-hidden bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(idx)}
                  className="text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Project Bullets */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Project Accomplishment Bullets
          </label>

          {data.projects.map((proj, pIdx) => (
            <div key={pIdx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{proj.title}</span>
                <button
                  type="button"
                  onClick={() => handleAddProjectBullet(pIdx)}
                  className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3 h-3" /> Add Bullet
                </button>
              </div>

              <div className="space-y-2">
                {(proj.bullets || []).map((bullet, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-2">
                    <span className="text-slate-400 text-xs mt-2">&bull;</span>
                    <textarea
                      rows={2}
                      value={bullet}
                      onChange={(e) => handleProjectBulletChange(pIdx, bIdx, e.target.value)}
                      className="flex-1 p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveProjectBullet(pIdx, bIdx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 mt-1"
                      title="Delete bullet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Save Version Bar */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Change summary (e.g. Updated project action verbs & React skills)..."
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            className="w-full sm:w-80 p-2 text-xs border border-slate-200 rounded-xl bg-slate-50"
          />

          <button
            type="button"
            onClick={handleSaveVersion}
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Version...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save as New Version</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
