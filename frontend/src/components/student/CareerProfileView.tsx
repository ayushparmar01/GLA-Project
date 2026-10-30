import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchCareerProfileApi,
  updateCareerProfileApi,
  fetchProfileCompletionApi,
} from '../../services/api';
import {
  StudentProfileData,
  ProfileCompletionReport,
  EducationItem,
  CertificationItem,
} from '../../types';
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Award,
  BookOpen,
  Briefcase,
  Globe,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface CareerProfileViewProps {
  onNavigateToProjects?: () => void;
  onNavigateToResumes?: () => void;
}

export const CareerProfileView: React.FC<CareerProfileViewProps> = ({
  onNavigateToProjects,
  onNavigateToResumes,
}) => {
  const { token, user } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Profile completion report
  const [completionReport, setCompletionReport] = useState<ProfileCompletionReport | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<StudentProfileData>>({
    headline: '',
    careerObjective: '',
    specialization: '',
    collegeName: '',
    course: '',
    graduationYear: 2026,
    cgpa: undefined,
    educationLevel: 'Undergraduate',
    technicalSkills: [],
    softSkills: [],
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    workModePreference: 'ANY',
    certifications: [],
  });

  // Skill input buffers
  const [newTechSkill, setNewTechSkill] = useState<string>('');
  const [newSoftSkill, setNewSoftSkill] = useState<string>('');

  // Certification modal state
  const [showCertModal, setShowCertModal] = useState<boolean>(false);
  const [certForm, setCertForm] = useState<CertificationItem>({
    title: '',
    issuer: '',
    issueDate: '',
    credentialUrl: '',
  });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, completionRes] = await Promise.all([
        fetchCareerProfileApi(token),
        fetchProfileCompletionApi(token),
      ]);

      if (profileRes.success && profileRes.data) {
        const p = profileRes.data.profile;
        setFormData({
          headline: p.headline || '',
          careerObjective: p.careerObjective || '',
          specialization: p.specialization || '',
          collegeName: p.collegeName || user?.studentProfile?.collegeName || '',
          course: p.course || user?.studentProfile?.course || '',
          graduationYear: p.graduationYear || user?.studentProfile?.graduationYear || 2026,
          cgpa: p.cgpa,
          educationLevel: p.educationLevel || 'Undergraduate',
          technicalSkills: p.technicalSkills || p.skills || [],
          softSkills: p.softSkills || [],
          githubUrl: p.githubUrl || '',
          linkedinUrl: p.linkedinUrl || '',
          portfolioUrl: p.portfolioUrl || '',
          workModePreference: p.workModePreference || 'ANY',
          certifications: p.certifications || [],
        });
      }

      if (completionRes.success && completionRes.data) {
        setCompletionReport(completionRes.data);
      }
    } catch {
      setError('Unable to load career profile information.');
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    // Frontend validation
    if (formData.githubUrl && !formData.githubUrl.startsWith('http')) {
      setError('GitHub URL must start with http:// or https://');
      setSaving(false);
      return;
    }
    if (formData.linkedinUrl && !formData.linkedinUrl.startsWith('http')) {
      setError('LinkedIn URL must start with http:// or https://');
      setSaving(false);
      return;
    }
    if (formData.portfolioUrl && !formData.portfolioUrl.startsWith('http')) {
      setError('Portfolio URL must start with http:// or https://');
      setSaving(false);
      return;
    }

    const res = await updateCareerProfileApi(formData, token);
    if (res.success && res.data) {
      setSuccessMessage('Career profile updated successfully!');
      if (res.data.profileCompletion) {
        setCompletionReport(res.data.profileCompletion);
      }
    } else {
      setError(res.error?.message || 'Failed to update career profile.');
    }
    setSaving(false);
  };

  const addTechSkill = () => {
    const val = newTechSkill.trim();
    if (val && !formData.technicalSkills?.includes(val)) {
      setFormData((prev) => ({
        ...prev,
        technicalSkills: [...(prev.technicalSkills || []), val],
      }));
      setNewTechSkill('');
    }
  };

  const removeTechSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      technicalSkills: prev.technicalSkills?.filter((s) => s !== skill),
    }));
  };

  const addSoftSkill = () => {
    const val = newSoftSkill.trim();
    if (val && !formData.softSkills?.includes(val)) {
      setFormData((prev) => ({
        ...prev,
        softSkills: [...(prev.softSkills || []), val],
      }));
      setNewSoftSkill('');
    }
  };

  const removeSoftSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      softSkills: prev.softSkills?.filter((s) => s !== skill),
    }));
  };

  const handleAddCert = () => {
    if (!certForm.title.trim() || !certForm.issuer.trim()) return;
    setFormData((prev) => ({
      ...prev,
      certifications: [...(prev.certifications || []), { ...certForm, id: `cert_${Date.now()}` }],
    }));
    setCertForm({ title: '', issuer: '', issueDate: '', credentialUrl: '' });
    setShowCertModal(false);
  };

  const removeCert = (id?: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications?.filter((c) => c.id !== id),
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm">Loading your verified career profile...</p>
      </div>
    );
  }

  const score = completionReport?.score || 0;

  return (
    <div className="space-y-6">
      {/* 1. Header & Completion Meter */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-semibold tracking-wider uppercase text-blue-200">
                Verified Career Portfolio
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white">{user?.fullName}</h2>
            <p className="text-blue-200 text-sm mt-1 max-w-xl">
              {formData.headline || 'Add your professional headline to stand out to verified recruiters.'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 min-w-[280px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-100 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Profile Strength
              </span>
              <span className="text-lg font-bold text-white">{score}%</span>
            </div>
            <div className="w-full bg-blue-950/60 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  score >= 80 ? 'bg-emerald-400' : score >= 50 ? 'bg-amber-400' : 'bg-blue-400'
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
            <p className="text-[11px] text-blue-200 mt-2">
              {completionReport?.isComplete
                ? 'All sections complete! Your ATS score is maximized.'
                : `${completionReport?.completedCount || 0} of ${completionReport?.totalCount || 8} sections completed.`}
            </p>
          </div>
        </div>

        {/* Action Shortcut Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-white/10 text-xs">
          {onNavigateToProjects && (
            <button
              type="button"
              onClick={onNavigateToProjects}
              className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg transition"
            >
              <Briefcase className="w-3.5 h-3.5" /> Manage Project Portfolio
              <ChevronRight className="w-3 h-3 text-blue-300" />
            </button>
          )}
          {onNavigateToResumes && (
            <button
              type="button"
              onClick={onNavigateToResumes}
              className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg transition"
            >
              <Award className="w-3.5 h-3.5" /> ATS Resume Builder
              <ChevronRight className="w-3 h-3 text-blue-300" />
            </button>
          )}
        </div>
      </div>

      {/* Transparent Completion Breakdown Card */}
      {completionReport && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
            Transparent Profile Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {completionReport.sections.map((sec) => (
              <div
                key={sec.key}
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 transition ${
                  sec.completed
                    ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                {sec.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold flex items-center justify-between gap-1">
                    <span>{sec.label}</span>
                    <span className="text-[10px] font-mono text-slate-500">+{sec.weight}%</span>
                  </div>
                  <p className="text-[11px] mt-0.5 text-slate-500 leading-snug">{sec.details}</p>
                </div>
              </div>
            ))}
          </div>

          {completionReport.nextSteps.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Next Steps to 100% Strength: </span>
                <span>{completionReport.nextSteps.join(' • ')}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Career Profile Edit Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Professional Headline & Objective */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2 border-b pb-2">
            <Sparkles className="w-4 h-4 text-blue-600" /> Professional Identity & Career Objective
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Professional Headline <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.headline || ''}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                placeholder="e.g. B.Tech Computer Science | Full-Stack Developer | React & Node.js"
                maxLength={150}
                className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Brief summary shown prominently to recruiters (max 150 chars).</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Career Objective / Professional Summary
              </label>
              <textarea
                rows={3}
                value={formData.careerObjective || ''}
                onChange={(e) => setFormData({ ...formData, careerObjective: e.target.value })}
                placeholder="State your career ambitions, technical strengths, and what value you offer to hiring teams..."
                maxLength={1500}
                className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization / Domain</label>
              <input
                type="text"
                value={formData.specialization || ''}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g. Web Development, Cloud Computing, IoT"
                className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Mode Preference</label>
              <select
                value={formData.workModePreference || 'ANY'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    workModePreference: e.target.value as 'ONSITE' | 'REMOTE' | 'HYBRID' | 'ANY',
                  })
                }
                className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="ANY">Flexible / Any Mode</option>
                <option value="ONSITE">On-Site Only</option>
                <option value="REMOTE">Remote Only</option>
                <option value="HYBRID">Hybrid Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Academic Background */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2 border-b pb-2">
            <BookOpen className="w-4 h-4 text-blue-600" /> Academic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">College / Institution</label>
              <input
                type="text"
                value={formData.collegeName || ''}
                onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                placeholder="College Name"
                className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Degree / Course</label>
              <input
                type="text"
                value={formData.course || ''}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                placeholder="e.g. B.Tech Computer Engineering"
                className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Graduation Year</label>
              <input
                type="number"
                min={1980}
                max={2040}
                value={formData.graduationYear || 2026}
                onChange={(e) => setFormData({ ...formData, graduationYear: parseInt(e.target.value) || 2026 })}
                className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">CGPA / Score (Optional)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                max={10}
                value={formData.cgpa !== undefined ? formData.cgpa : ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cgpa: e.target.value === '' ? undefined : parseFloat(e.target.value),
                  })
                }
                placeholder="e.g. 8.5"
                className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Technical & Soft Skills */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2 border-b pb-2">
            <Award className="w-4 h-4 text-blue-600" /> Skills & Competencies
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Technical Skills</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTechSkill}
                onChange={(e) => setNewTechSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTechSkill();
                  }
                }}
                placeholder="Add technical skill (e.g. TypeScript, React, SQL)"
                className="flex-1 text-sm px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={addTechSkill}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-slate-50 border rounded-lg">
              {formData.technicalSkills && formData.technicalSkills.length > 0 ? (
                formData.technicalSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeTechSkill(skill)}
                      className="hover:text-blue-900 font-bold ml-1 text-slate-500 hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">No technical skills added yet.</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Soft Skills</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSoftSkill}
                onChange={(e) => setNewSoftSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSoftSkill();
                  }
                }}
                placeholder="Add soft skill (e.g. Problem Solving, Team Leadership)"
                className="flex-1 text-sm px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={addSoftSkill}
                className="bg-slate-700 hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-slate-50 border rounded-lg">
              {formData.softSkills && formData.softSkills.length > 0 ? (
                formData.softSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 bg-slate-200 text-slate-800 text-xs px-2.5 py-1 rounded-full font-medium"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSoftSkill(skill)}
                      className="hover:text-slate-900 font-bold ml-1 text-slate-500 hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">No soft skills added yet.</span>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Professional Links */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2 border-b pb-2">
            <Globe className="w-4 h-4 text-blue-600" /> Professional Online Presence
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub Profile URL</label>
              <input
                type="url"
                value={formData.githubUrl || ''}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                placeholder="https://github.com/your-username"
                className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn Profile URL</label>
              <input
                type="url"
                value={formData.linkedinUrl || ''}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/your-profile"
                className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Portfolio / Website URL</label>
              <input
                type="url"
                value={formData.portfolioUrl || ''}
                onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                placeholder="https://yourportfolio.dev"
                className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Certifications */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" /> Certifications & Verified Credentials
            </h3>
            <button
              type="button"
              onClick={() => setShowCertModal(true)}
              className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Certification
            </button>
          </div>

          <div className="space-y-2">
            {formData.certifications && formData.certifications.length > 0 ? (
              formData.certifications.map((cert) => (
                <div
                  key={cert.id || cert.title}
                  className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 text-sm"
                >
                  <div>
                    <h4 className="font-semibold text-slate-900">{cert.title}</h4>
                    <p className="text-xs text-slate-500">
                      {cert.issuer} {cert.issueDate ? `• Issued ${cert.issueDate}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                      >
                        Verify <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => removeCert(cert.id)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-2">No certifications added yet.</p>
            )}
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Career Profile
          </button>
        </div>
      </form>

      {/* Add Certification Modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Certification</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Certification Title *</label>
                <input
                  type="text"
                  value={certForm.title}
                  onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                  placeholder="e.g. AWS Certified Cloud Practitioner"
                  className="w-full p-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Issuing Organization *</label>
                <input
                  type="text"
                  value={certForm.issuer}
                  onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                  placeholder="e.g. Amazon Web Services, Coursera, NPTEL"
                  className="w-full p-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Issue Date</label>
                <input
                  type="text"
                  value={certForm.issueDate || ''}
                  onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                  placeholder="e.g. January 2026"
                  className="w-full p-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Credential URL</label>
                <input
                  type="url"
                  value={certForm.credentialUrl || ''}
                  onChange={(e) => setCertForm({ ...certForm, credentialUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCertModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCert}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
              >
                Add Certification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
