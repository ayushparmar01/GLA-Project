import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchCareerProfileApi,
  createResumeApi,
  fetchResumesApi,
  deleteResumeApi,
  downloadResumePdfApi,
} from '../../services/api';
import {
  ResumeData,
  ResumeTemplate,
  ResumeStructuredContent,
  EducationItem,
  ProjectItem,
  ExperienceItem,
  CertificationItem,
} from '../../types';
import {
  FileText,
  Download,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  Layers,
  Sparkles,
  Award,
  Check,
} from 'lucide-react';
import { AiResumeFeedbackModal } from './AiResumeFeedbackModal';

export const ResumeBuilderView: React.FC = () => {
  const { token, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'BUILDER' | 'PREVIEW' | 'VERSIONS'>('BUILDER');
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>('MODERN');
  const [resumeTitle, setResumeTitle] = useState<string>('Software Developer Resume');
  const [isDefault, setIsDefault] = useState<boolean>(true);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);

  // Resume Content State
  const [content, setContent] = useState<ResumeStructuredContent>({
    personalInfo: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      location: 'Pan-India',
      headline: '',
      summary: '',
      githubUrl: '',
      linkedinUrl: '',
      portfolioUrl: '',
    },
    education: [],
    technicalSkills: [],
    softSkills: [],
    projects: [],
    experience: [],
    certifications: [],
    achievements: [],
    visibleSections: {
      summary: true,
      skills: true,
      education: true,
      projects: true,
      experience: true,
      certifications: true,
      achievements: true,
    },
  });

  // Saved Resumes
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [loadingResumes, setLoadingResumes] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync content from student profile
  const syncFromProfile = useCallback(async () => {
    const res = await fetchCareerProfileApi(token);
    if (res.success && res.data) {
      const p = res.data.profile;
      setContent({
        personalInfo: {
          fullName: res.data.user.fullName || user?.fullName || '',
          email: res.data.user.email || user?.email || '',
          phoneNumber: res.data.user.phoneNumber || user?.phoneNumber || '',
          location: p.preferredWorkLocation?.[0] || 'Pan-India',
          headline: p.headline || p.course || 'Career Candidate',
          summary: p.careerObjective || '',
          githubUrl: p.githubUrl || '',
          linkedinUrl: p.linkedinUrl || '',
          portfolioUrl: p.portfolioUrl || '',
        },
        education: p.educationHistory && p.educationHistory.length > 0
          ? p.educationHistory
          : [
              {
                institution: p.collegeName || 'Accredited Institution',
                degree: p.course || 'Bachelor Degree',
                graduationYear: p.graduationYear,
                cgpa: p.cgpa,
              },
            ],
        technicalSkills: p.technicalSkills || p.skills || [],
        softSkills: p.softSkills || [],
        projects: p.projects || [],
        experience: p.internships || p.workExperience || [],
        certifications: p.certifications || [],
        achievements: p.achievements || [],
        visibleSections: {
          summary: true,
          skills: true,
          education: true,
          projects: true,
          experience: true,
          certifications: true,
          achievements: true,
        },
      });
      setSuccessMessage('Content synced from your career profile!');
    }
  }, [token, user]);

  const loadSavedResumes = useCallback(async () => {
    setLoadingResumes(true);
    const res = await fetchResumesApi(token);
    if (res.success && res.data) {
      setResumes(res.data);
    }
    setLoadingResumes(false);
  }, [token]);

  useEffect(() => {
    syncFromProfile();
    loadSavedResumes();
  }, [syncFromProfile, loadSavedResumes]);

  const handleSaveResume = async () => {
    if (!resumeTitle.trim()) {
      setError('Resume title is required.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const res = await createResumeApi(
      {
        title: resumeTitle.trim(),
        template: selectedTemplate,
        structuredContent: content,
        isDefault,
      },
      token
    );

    if (res.success && res.data) {
      setSuccessMessage(`Resume saved as version v${res.data.version}!`);
      loadSavedResumes();
      setActiveTab('VERSIONS');
    } else {
      setError(res.error?.message || 'Failed to save resume version.');
    }
    setSaving(false);
  };

  const handleDownload = async (resume: ResumeData) => {
    setDownloadingId(resume.id);
    const filename = `${resume.title.replace(/\s+/g, '_')}_v${resume.version}.pdf`;
    await downloadResumePdfApi(resume.id, filename, token);
    setDownloadingId(null);
  };

  const handleDelete = async (resumeId: string) => {
    if (!window.confirm('Are you sure you want to delete this saved resume version?')) return;
    const res = await deleteResumeApi(resumeId, token);
    if (res.success) {
      setResumes((prev) => prev.filter((r) => r.id !== resumeId));
      setSuccessMessage('Resume version deleted.');
    } else {
      setError(res.error?.message || 'Failed to delete resume.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" /> ATS Resume Builder & Version Studio
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Build clean, recruiter-approved ATS resumes compliant with top screening systems.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={syncFromProfile}
            className="inline-flex items-center gap-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sync from Profile
          </button>
          <button
            type="button"
            onClick={() => setIsFeedbackModalOpen(true)}
            className="inline-flex items-center gap-1.5 border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-2 rounded-lg transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> ATS Diagnostic & AI Feedback
          </button>
          <button
            type="button"
            onClick={handleSaveResume}
            disabled={saving}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Save Resume Version
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('BUILDER')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
            activeTab === 'BUILDER'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" /> Builder & Sections
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('PREVIEW')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
            activeTab === 'PREVIEW'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Eye className="w-4 h-4" /> Live ATS Preview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('VERSIONS')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${
            activeTab === 'VERSIONS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" /> Saved Versions ({resumes.length})
        </button>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-700 font-bold">
            ×
          </button>
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="text-red-700 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Tab 1: Builder */}
      {activeTab === 'BUILDER' && (
        <div className="space-y-6">
          {/* Template Selection */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. Select ATS-Optimized Template
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'MODERN' as ResumeTemplate,
                  name: 'Modern Accent',
                  desc: 'Clean bold accent divider, prominent skills grid. Ideal for tech roles.',
                },
                {
                  id: 'PROFESSIONAL' as ResumeTemplate,
                  name: 'Executive Classic',
                  desc: 'Traditional serif structure with centered header. Ideal for corporate hiring.',
                },
                {
                  id: 'MINIMAL' as ResumeTemplate,
                  name: 'High-Density Minimal',
                  desc: 'Streamlined single-column text maximizing keyword density for strict ATS parsers.',
                },
              ].map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`p-4 rounded-xl border text-left transition relative ${
                    selectedTemplate === tpl.id
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {selectedTemplate === tpl.id && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                  <h4 className="font-bold text-sm text-slate-900">{tpl.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tpl.desc}</p>
                </button>
              ))}
            </div>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resume Title</label>
                <input
                  type="text"
                  value={resumeTitle}
                  onChange={(e) => setResumeTitle(e.target.value)}
                  placeholder="e.g. Full Stack Developer - General"
                  className="w-full text-xs p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="isDefaultCheck"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isDefaultCheck" className="text-xs font-semibold text-slate-700">
                  Set as default resume for drive applications
                </label>
              </div>
            </div>
          </div>

          {/* Section Visibility Toggles */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. Section Inclusions (Customize for Target Drive)
            </h3>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { key: 'summary', label: 'Summary' },
                { key: 'skills', label: 'Skills' },
                { key: 'experience', label: 'Experience' },
                { key: 'projects', label: 'Projects' },
                { key: 'education', label: 'Education' },
                { key: 'certifications', label: 'Certifications' },
                { key: 'achievements', label: 'Achievements' },
              ].map((s) => {
                const isVis = content.visibleSections?.[s.key as keyof typeof content.visibleSections] !== false;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() =>
                      setContent((prev) => ({
                        ...prev,
                        visibleSections: {
                          ...prev.visibleSections,
                          [s.key]: !isVis,
                        },
                      }))
                    }
                    className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition ${
                      isVis
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                    }`}
                  >
                    {isVis && <Check className="w-3 h-3" />}
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Personal Info Review */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              3. Personal Details (Extracted from Verified Profile)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-500 mb-0.5">Full Name</label>
                <input
                  type="text"
                  value={content.personalInfo.fullName}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      personalInfo: { ...content.personalInfo, fullName: e.target.value },
                    })
                  }
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-0.5">Email</label>
                <input
                  type="email"
                  value={content.personalInfo.email}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      personalInfo: { ...content.personalInfo, email: e.target.value },
                    })
                  }
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-0.5">Phone Number</label>
                <input
                  type="text"
                  value={content.personalInfo.phoneNumber || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      personalInfo: { ...content.personalInfo, phoneNumber: e.target.value },
                    })
                  }
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 mb-0.5">Professional Summary</label>
              <textarea
                rows={2}
                value={content.personalInfo.summary || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    personalInfo: { ...content.personalInfo, summary: e.target.value },
                  })
                }
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Live ATS Preview */}
      {activeTab === 'PREVIEW' && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-md max-w-3xl mx-auto space-y-6">
          <div className="flex justify-between items-center pb-4 border-b">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Live Preview: {selectedTemplate} ATS Template
            </span>
            <button
              type="button"
              onClick={handleSaveResume}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
            >
              Save This Version
            </button>
          </div>

          {/* Render ATS Preview Mock */}
          <div className="space-y-4 text-slate-800">
            {/* Header */}
            <div className={selectedTemplate === 'PROFESSIONAL' ? 'text-center space-y-1' : 'space-y-1'}>
              <h1 className="text-2xl font-bold tracking-tight">
                {content.personalInfo.fullName || 'Candidate Name'}
              </h1>
              {content.personalInfo.headline && (
                <p className="text-xs font-semibold text-blue-600">{content.personalInfo.headline}</p>
              )}
              <div className="text-[11px] text-slate-500 flex flex-wrap gap-2 justify-start">
                <span>{content.personalInfo.email}</span>
                {content.personalInfo.phoneNumber && <span>• {content.personalInfo.phoneNumber}</span>}
                {content.personalInfo.location && <span>• {content.personalInfo.location}</span>}
                {content.personalInfo.githubUrl && <span>• GitHub</span>}
                {content.personalInfo.linkedinUrl && <span>• LinkedIn</span>}
              </div>
            </div>

            {/* Divider */}
            <div
              className={`h-0.5 ${
                selectedTemplate === 'MODERN' ? 'bg-blue-600' : 'bg-slate-400'
              }`}
            />

            {/* Summary */}
            {content.visibleSections?.summary !== false && content.personalInfo.summary && (
              <div className="space-y-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5">
                  Professional Summary
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">{content.personalInfo.summary}</p>
              </div>
            )}

            {/* Skills */}
            {content.visibleSections?.skills !== false && (
              <div className="space-y-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5">
                  Skills & Competencies
                </h2>
                <p className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Technical: </span>
                  {content.technicalSkills.join(', ') || 'N/A'}
                </p>
                {content.softSkills.length > 0 && (
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Core Strengths: </span>
                    {content.softSkills.join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Experience */}
            {content.visibleSections?.experience !== false && content.experience.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5">
                  Experience & Internships
                </h2>
                {content.experience.map((exp, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{exp.title} | {exp.company}</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                      </span>
                    </div>
                    {exp.description && <p className="text-[11px] text-slate-600 mt-0.5">{exp.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {content.visibleSections?.projects !== false && content.projects.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5">
                  Key Projects
                </h2>
                {content.projects.map((proj, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{proj.title} {proj.role ? `(${proj.role})` : ''}</span>
                      {proj.duration && <span className="text-[11px] font-normal text-slate-500">{proj.duration}</span>}
                    </div>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <p className="text-[11px] text-slate-500 italic">Tech: {proj.technologies.join(', ')}</p>
                    )}
                    <p className="text-[11px] text-slate-600 mt-0.5">{proj.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {content.visibleSections?.education !== false && content.education.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5">
                  Education
                </h2>
                {content.education.map((edu, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{edu.degree} — {edu.institution}</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        {edu.startYear ? `${edu.startYear} - ` : ''}{edu.endYear || edu.graduationYear}
                      </span>
                    </div>
                    {edu.cgpa !== undefined && <p className="text-[11px] text-slate-600">CGPA: {edu.cgpa}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Certifications */}
            {content.visibleSections?.certifications !== false && content.certifications.length > 0 && (
              <div className="space-y-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-0.5">
                  Certifications
                </h2>
                {content.certifications.map((c, i) => (
                  <p key={i} className="text-xs text-slate-700">
                    • <span className="font-semibold">{c.title}</span> — {c.issuer} {c.issueDate ? `(${c.issueDate})` : ''}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Saved Versions */}
      {activeTab === 'VERSIONS' && (
        <div className="space-y-4">
          {loadingResumes ? (
            <div className="flex justify-center p-12 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center p-12 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-semibold text-slate-700">No Saved Resume Versions Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Customize your sections in the Builder tab and save your first version to download an ATS-compliant PDF.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('BUILDER')}
                className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Go to Builder
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resumes.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900">{r.title}</h3>
                          <span className="text-[10px] font-mono bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                            v{r.version}
                          </span>
                          {r.isDefault && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Created {new Date(r.createdAt).toLocaleDateString()} • Template: {r.template}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded"
                        title="Delete version"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <p>
                        Candidate: <span className="font-medium text-slate-700">{r.structuredContent.personalInfo.fullName}</span>
                      </p>
                      <p>
                        Skills: <span className="font-medium text-slate-700">{r.structuredContent.technicalSkills?.length || 0} technical</span>
                      </p>
                      <p>
                        Projects: <span className="font-medium text-slate-700">{r.structuredContent.projects?.length || 0} showcased</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(r)}
                      disabled={downloadingId === r.id}
                      className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition disabled:opacity-50"
                    >
                      {downloadingId === r.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      Download ATS PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Phase 7 AI Resume Diagnostic Modal */}
      <AiResumeFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        token={token}
        structuredContent={content}
        targetRole={resumeTitle}
      />
    </div>
  );
};
