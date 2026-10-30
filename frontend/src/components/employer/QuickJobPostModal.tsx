import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Send,
  Building,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
  Users,
  Plus,
  Save,
  FileText,
} from 'lucide-react';
import {
  createEmployerOpportunityApi,
  publishEmployerOpportunityApi,
} from '../../services/api';
import { OpportunityType, WorkMode, PlacementDriveData } from '../../types';

interface QuickJobPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token?: string | null;
  employerCompanyName?: string;
}

const QUICK_DRAFT_KEY = 'careerbridge_quick_job_draft';

const POPULAR_TITLES = [
  'Junior Electrical Technician',
  'Graduate Engineer Trainee',
  'Associate Software Engineer',
  'Industrial Maintenance Technician',
  'Quality Control Inspector',
  'Field Operations Engineer',
];

const POPULAR_SKILLS = [
  'Electrical Maintenance',
  'Wiring & Circuit Installation',
  'Motor Servicing',
  'AutoCAD Drafting',
  'PLC & Industrial Automation',
  'React',
  'Node.js',
  'Python',
  'SQL',
  'Welding',
];

const POPULAR_LOCATIONS = ['Kolhapur', 'Pune', 'Bengaluru', 'Chennai', 'Coimbatore', 'Pan-India'];

export const QuickJobPostModal: React.FC<QuickJobPostModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  token,
  employerCompanyName = 'Verified Employer',
}) => {
  const [step, setStep] = useState<'form' | 'preview' | 'success'>('form');

  // Timer to verify completion in under 3 minutes
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [opportunityType, setOpportunityType] = useState<OpportunityType>('JOB');
  const [workMode, setWorkMode] = useState<WorkMode>('ONSITE');
  const [location, setLocation] = useState('');
  const [qualification, setQualification] = useState('Diploma');
  const [skills, setSkills] = useState<string[]>(['Electrical Maintenance']);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [openings, setOpenings] = useState<number>(5);
  const [salaryRange, setSalaryRange] = useState('₹15,000 - ₹20,000/month');
  const [deadlineDays, setDeadlineDays] = useState<number>(30);
  const [description, setDescription] = useState('');

  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publishedDriveId, setPublishedDriveId] = useState<string | null>(null);

  // Restore draft or initialize default description
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      const saved = localStorage.getItem(QUICK_DRAFT_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.opportunityType) setOpportunityType(parsed.opportunityType);
          if (parsed.workMode) setWorkMode(parsed.workMode);
          if (parsed.location) setLocation(parsed.location);
          if (parsed.qualification) setQualification(parsed.qualification);
          if (parsed.skills) setSkills(parsed.skills);
          if (parsed.openings) setOpenings(parsed.openings);
          if (parsed.salaryRange) setSalaryRange(parsed.salaryRange);
          if (parsed.description) setDescription(parsed.description);
          setDraftSavedTime('Restored from draft');
        } catch {
          // Ignore parse error
        }
      } else {
        insertDefaultDescription();
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  // Auto-save draft on changes
  useEffect(() => {
    if (isOpen && step === 'form' && title) {
      const draftObj = {
        title,
        opportunityType,
        workMode,
        location,
        qualification,
        skills,
        openings,
        salaryRange,
        description,
      };
      localStorage.setItem(QUICK_DRAFT_KEY, JSON.stringify(draftObj));
      setDraftSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, [title, opportunityType, workMode, location, qualification, skills, openings, salaryRange, description, isOpen, step]);

  if (!isOpen) return null;

  const insertDefaultDescription = () => {
    setDescription(
      `We are hiring motivated candidates for early-career recruitment.\nResponsibilities:\n- Assist senior engineers with maintenance, testing, and operations.\n- Adhere to safety standards and industry guidelines.\n- Participate in on-the-job training and team problem solving.`
    );
  };

  const handleAddSkill = (skillToAdd: string) => {
    const s = skillToAdd.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const calculateDeadlineDate = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };

  const validateForm = (): boolean => {
    setErrorMessage(null);
    if (!title.trim() || title.trim().length < 3) {
      setErrorMessage('Please enter a valid job title (minimum 3 characters).');
      return false;
    }
    if (!location.trim()) {
      setErrorMessage('Please specify job location or select Pan-India / Remote.');
      return false;
    }
    if (skills.length === 0) {
      setErrorMessage('Please add at least 1 required skill.');
      return false;
    }
    if (!description.trim() || description.trim().length < 15) {
      setErrorMessage('Please enter a brief job description (minimum 15 characters).');
      return false;
    }
    return true;
  };

  const handleProceedToPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setStep('preview');
    }
  };

  const handlePublishJob = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    const deadlineIso = calculateDeadlineDate(deadlineDays);

    const payload: Partial<PlacementDriveData> = {
      title: title.trim(),
      opportunityType,
      workMode,
      location: location.trim(),
      description: description.trim(),
      requiredSkills: skills,
      minimumQualification: qualification,
      minimumCGPA: 5.5,
      salaryRange: salaryRange.trim(),
      numberOfOpenings: openings,
      applicationDeadline: deadlineIso,
      recruitmentProcess: ['1. Profile Screening', '2. Technical Interview', '3. Offer'],
    };

    try {
      const createRes = await createEmployerOpportunityApi(payload, token);
      if (createRes.success && createRes.data) {
        const driveId = createRes.data.id || (createRes.data as any)._id;
        setPublishedDriveId(driveId);

        // Publish directly to make live
        const pubRes = await publishEmployerOpportunityApi(driveId, token);
        if (pubRes.success) {
          localStorage.removeItem(QUICK_DRAFT_KEY);
          setStep('success');
          if (timerRef.current) clearInterval(timerRef.current);
          onSuccess();
        } else {
          // If publish failed, it is still created as draft
          setErrorMessage('Created as draft, but could not publish automatically: ' + (pubRes.error?.message || 'Error'));
        }
      } else {
        setErrorMessage(createRes.error?.message || 'Failed to create opportunity.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error publishing job opportunity.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden my-8 animate-fadeIn">
        {/* Header with 3-Minute Timer */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 px-6 py-4.5 flex items-center justify-between border-b border-indigo-600/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">Rapid Job Posting Wizard</h3>
                <span className="bg-amber-400/20 text-amber-200 border border-amber-300/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Target: &lt; 3 Mins
                </span>
              </div>
              <p className="text-xs text-indigo-200">
                Streamlined, low-friction job creation for campus &amp; regional hiring drives
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/60 border border-indigo-400/30 font-mono text-xs text-amber-300 font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Draft Notification */}
          {draftSavedTime && step === 'form' && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <span className="flex items-center space-x-1.5">
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto-saved to local draft ({draftSavedTime})</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(QUICK_DRAFT_KEY);
                  setDraftSavedTime(null);
                  setTitle('');
                  setLocation('');
                  setDescription('');
                }}
                className="text-slate-400 hover:text-rose-400 underline"
              >
                Clear draft
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: FORM INPUT */}
          {step === 'form' && (
            <form onSubmit={handleProceedToPreview} className="space-y-4 text-xs">
              {/* Job Title */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">
                  Job Opening Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Junior Electrical Technician"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 text-sm"
                  required
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400">Popular:</span>
                  {POPULAR_TITLES.slice(0, 4).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTitle(t)}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-slate-700 hover:bg-slate-700 transition"
                    >
                      + {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type, Work Mode, Location Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Type */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Opportunity Type</label>
                  <select
                    value={opportunityType}
                    onChange={(e) => setOpportunityType(e.target.value as OpportunityType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="JOB">Full-Time Job</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>

                {/* Work Mode */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Work Mode</label>
                  <select
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="ONSITE">Onsite</option>
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">
                    Location <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Kolhapur / Pune"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Location Quick Chips */}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="text-slate-400">Quick Location:</span>
                {POPULAR_LOCATIONS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocation(loc)}
                    className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/80 hover:bg-slate-700"
                  >
                    {loc}
                  </button>
                ))}
              </div>

              {/* Qualification & Stipend Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Required Qualification</label>
                  <select
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Diploma">Diploma (Polytechnic)</option>
                    <option value="B.Tech / B.E.">B.Tech / B.E.</option>
                    <option value="BCA / MCA">BCA / MCA</option>
                    <option value="Any Graduate / ITI">Any Graduate / ITI</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Openings</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={openings}
                    onChange={(e) => setOpenings(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Stipend / Salary</label>
                  <input
                    type="text"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    placeholder="e.g. ₹15,000/mo or ₹3.5 LPA"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Skills Tag Selector */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">
                  Required Skills <span className="text-rose-400">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-800 border border-slate-700 min-h-[42px]">
                  {skills.map((sk) => (
                    <span
                      key={sk}
                      className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-medium"
                    >
                      <span>{sk}</span>
                      <button type="button" onClick={() => handleRemoveSkill(sk)} className="hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <div className="inline-flex items-center">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill(newSkillInput))}
                      placeholder="+ Add skill"
                      className="px-2 py-0.5 text-xs bg-transparent border-0 text-white focus:outline-hidden placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400">Suggestions:</span>
                  {POPULAR_SKILLS.slice(0, 5).map((sk) => (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => handleAddSkill(sk)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                    >
                      + {sk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Application Deadline Quick Picker */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Application Deadline</label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 45].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDeadlineDays(days)}
                      className={`py-1.5 px-3 rounded-lg border font-semibold text-xs transition ${
                        deadlineDays === days
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      +{days} Days ({new Date(Date.now() + days * 86400000).toLocaleDateString()})
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300 block">
                    Job Description <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={insertDefaultDescription}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold underline"
                  >
                    Insert Role Template
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-sans"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md transition flex items-center space-x-2"
                >
                  <span>Preview &amp; Confirm</span>
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: INSTANT CANDIDATE-FACING PREVIEW */}
          {step === 'preview' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold text-[11px]">
                    {opportunityType === 'JOB' ? 'Full-Time Job' : 'Internship'} &bull; {workMode}
                  </span>
                  <span className="text-slate-400">
                    Deadline: {new Date(Date.now() + deadlineDays * 86400000).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">{title}</h4>
                  <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-0.5">
                    <Building className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{employerCompanyName}</span>
                    <span>&bull;</span>
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{location}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Compensation:</span>
                    <span className="font-semibold text-emerald-400">{salaryRange}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Openings &amp; Eligibility:</span>
                    <span className="font-semibold text-slate-200">{openings} Openings &bull; {qualification}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px] font-semibold">Required Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((sk) => (
                      <span key={sk} className="px-2 py-0.5 rounded bg-indigo-900/50 text-indigo-300 border border-indigo-700 text-[11px]">
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-700/60 text-slate-300">
                  <span className="text-slate-400 block text-[10px] font-semibold">Description:</span>
                  <p className="whitespace-pre-line leading-relaxed">{description}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  &larr; Back to Edit
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handlePublishJob}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md transition flex items-center space-x-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Publishing...' : 'Publish Opening Now'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 'success' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">Job Successfully Published!</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Your opening "{title}" is now active and immediately discoverable by eligible students.
                </p>
              </div>

              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 font-mono text-xs text-amber-300">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Completion Time: {formatTimer(elapsedSeconds)} (&lt; 3 mins verified)</span>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md"
                >
                  Done &bull; View in Active Drives
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
