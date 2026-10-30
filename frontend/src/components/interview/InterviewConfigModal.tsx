import React, { useState, useEffect } from 'react';
import {
  MockInterviewType,
  MockInterviewDifficulty,
  MockInterviewSessionConfig,
  PlacementDriveData,
  ResumeData,
} from '../../types';
import {
  createMockInterviewSessionApi,
  startMockInterviewSessionApi,
  fetchPublicOpportunitiesApi,
  fetchResumesApi,
} from '../../services/api';
import {
  Sparkles,
  X,
  Clock,
  HelpCircle,
  Briefcase,
  Code2,
  Users,
  Target,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface InterviewConfigModalProps {
  token: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSessionStarted: (sessionId: string) => void;
  initialType?: MockInterviewType;
  initialJobId?: string;
}

const POPULAR_ROLES = [
  'Full-Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Software Engineer',
  'Data Analyst',
  'AI/ML Engineer',
  'General Fresher',
];

export const InterviewConfigModal: React.FC<InterviewConfigModalProps> = ({
  token,
  isOpen,
  onClose,
  onSessionStarted,
  initialType = 'TECHNICAL',
  initialJobId,
}) => {
  const [interviewType, setInterviewType] = useState<MockInterviewType>(initialType);
  const [targetRole, setTargetRole] = useState<string>('Software Engineer');
  const [difficulty, setDifficulty] = useState<MockInterviewDifficulty>('INTERMEDIATE');
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [language, setLanguage] = useState<string>('en');

  // Job selection
  const [drives, setDrives] = useState<PlacementDriveData[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || '');

  // Resume selection
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadContextData();
    }
  }, [isOpen]);

  const loadContextData = async () => {
    try {
      const [drivesRes, resumesRes] = await Promise.all([
        fetchPublicOpportunitiesApi(),
        token ? fetchResumesApi(token) : Promise.resolve({ success: false, data: [] }),
      ]);

      if (drivesRes.success && drivesRes.data) {
        setDrives(drivesRes.data);
        if (!selectedJobId && drivesRes.data.length > 0) {
          setSelectedJobId(drivesRes.data[0].id);
        }
      }
      if (resumesRes.success && resumesRes.data) {
        setResumes(resumesRes.data);
        if (resumesRes.data.length > 0) {
          setSelectedResumeId(resumesRes.data[0].id);
        }
      }
    } catch {
      // Ignore background load error
    }
  };

  if (!isOpen) return null;

  const handleStartInterview = async () => {
    if (!token) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const config: MockInterviewSessionConfig = {
        interviewType,
        targetRole: targetRole.trim(),
        difficulty,
        durationMinutes,
        questionCount,
        language,
        jobId: interviewType === 'JOB_SPECIFIC' ? selectedJobId : undefined,
        resumeId: interviewType === 'RESUME_BASED' ? selectedResumeId : undefined,
      };

      const createRes = await createMockInterviewSessionApi(config, token);
      if (!createRes.success || !createRes.data) {
        throw new Error(createRes.error?.message || 'Failed to initialize session.');
      }

      const sessionId = createRes.data.id;
      // Start session
      await startMockInterviewSessionApi(sessionId, token);
      onSessionStarted(sessionId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error starting mock interview.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative my-8 animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Interview Preparation Setup
          </div>
          <h3 className="text-xl font-bold text-slate-900">Configure Your Mock Interview</h3>
          <p className="text-xs text-slate-500">
            Tailor questions, time limits, and evaluation rubrics to match your target job profile.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          {/* 1. Interview Category */}
          <div>
            <label className="font-bold text-slate-800 block mb-1.5">Interview Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'TECHNICAL', label: 'Technical / DSA', icon: Code2 },
                { id: 'HR', label: 'HR & Culture', icon: Users },
                { id: 'BEHAVIORAL', label: 'Behavioral (STAR)', icon: Target },
                { id: 'ROLE_SPECIFIC', label: 'Role Specific', icon: Briefcase },
                { id: 'JOB_SPECIFIC', label: 'Job Description', icon: Briefcase },
                { id: 'RESUME_BASED', label: 'Resume Based', icon: FileText },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = interviewType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setInterviewType(item.id as MockInterviewType)}
                    className={`p-2.5 rounded-xl border text-left font-semibold flex items-center gap-2 transition ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Job Selection if Job Specific */}
          {interviewType === 'JOB_SPECIFIC' && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <label className="font-bold text-slate-800 block">Select Target Placement Drive</label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium"
              >
                {drives.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.organizationName})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 block">
                Practice questions generated directly from this job’s required skills and responsibilities.
              </span>
            </div>
          )}

          {/* Resume Selection if Resume Based */}
          {interviewType === 'RESUME_BASED' && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <label className="font-bold text-slate-800 block">Select Resume for Questions</label>
              {resumes.length === 0 ? (
                <p className="text-[11px] text-amber-700">
                  No saved resumes found. Questions will be generated from your profile portfolio projects.
                </p>
              ) : (
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium"
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.targetRole || 'Software Engineer'}) - v{r.version}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* 2. Target Job Role */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">Target Job Role</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Full-Stack Developer, Data Analyst..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {POPULAR_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setTargetRole(role)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition ${
                    targetRole === role
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Difficulty & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as MockInterviewDifficulty)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium"
              >
                <option value="BEGINNER">Beginner (Fresher entry)</option>
                <option value="INTERMEDIATE">Intermediate (Standard)</option>
                <option value="ADVANCED">Advanced (In-depth)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Duration &amp; Questions</label>
              <div className="flex items-center gap-2">
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-1/2 px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium"
                >
                  <option value={15}>15 mins</option>
                  <option value={20}>20 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                </select>

                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-1/2 px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium"
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={8}>8 Questions</option>
                  <option value={10}>10 Questions</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. Language Selection */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">Preferred Language</label>
            <div className="flex gap-2">
              {[
                { code: 'en', label: 'English' },
                { code: 'hi', label: 'Hindi (हिंदी)' },
                { code: 'hi-Latn', label: 'Hinglish' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition ${
                    language === lang.code
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={handleStartInterview}
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 shadow-md transition"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            {loading ? 'Starting Mock Interview...' : 'Start Mock Interview Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
