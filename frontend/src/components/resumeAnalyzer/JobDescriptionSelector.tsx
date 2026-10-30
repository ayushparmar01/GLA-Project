import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  FileCode,
  Search,
  Building,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { PlacementDriveData } from '../../types';
import { fetchPublicOpportunitiesApi } from '../../services/api';

interface JobDescriptionSelectorProps {
  onSelectJob: (params: {
    jobId?: string;
    customJobTitle?: string;
    customJobDescription?: string;
    customCompanyName?: string;
  }) => void;
  isAnalyzing: boolean;
  disabled: boolean;
}

export const JobDescriptionSelector: React.FC<JobDescriptionSelectorProps> = ({
  onSelectJob,
  isAnalyzing,
  disabled,
}) => {
  const [mode, setMode] = useState<'EXISTING' | 'CUSTOM'>('EXISTING');

  // Existing drives state
  const [drives, setDrives] = useState<PlacementDriveData[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [loadingDrives, setLoadingDrives] = useState<boolean>(true);
  const [driveSearch, setDriveSearch] = useState<string>('');

  // Custom JD state
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customCompany, setCustomCompany] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');

  useEffect(() => {
    loadDrives();
  }, []);

  const loadDrives = async () => {
    setLoadingDrives(true);
    try {
      const res = await fetchPublicOpportunitiesApi();
      if (res.success && res.data) {
        const list = res.data.opportunities || [];
        setDrives(list);
        if (list.length > 0) {
          setSelectedJobId(list[0].id);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoadingDrives(false);
    }
  };

  const handleStartAnalysis = () => {
    if (mode === 'EXISTING') {
      if (!selectedJobId) return;
      onSelectJob({ jobId: selectedJobId });
    } else {
      if (!customDescription || customDescription.trim().length < 30) return;
      onSelectJob({
        customJobTitle: customTitle.trim() || 'Software Engineer',
        customCompanyName: customCompany.trim() || 'Target Employer',
        customJobDescription: customDescription.trim(),
      });
    }
  };

  const filteredDrives = drives.filter(
    (d) =>
      d.title.toLowerCase().includes(driveSearch.toLowerCase()) ||
      d.organizationName.toLowerCase().includes(driveSearch.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-semibold mb-2">
          <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
          Step 2: Choose Target Role
        </div>
        <h3 className="text-lg font-bold text-slate-900">Target Job Description &amp; ATS Benchmark</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Select an active CareerBridge placement drive or paste a custom job description from external job boards.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
        <button
          type="button"
          onClick={() => setMode('EXISTING')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            mode === 'EXISTING'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Active CareerBridge Jobs ({drives.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('CUSTOM')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            mode === 'CUSTOM'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Paste Custom Job Description</span>
        </button>
      </div>

      {/* Option A: Existing CareerBridge Jobs */}
      {mode === 'EXISTING' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by role title or company..."
              value={driveSearch}
              onChange={(e) => setDriveSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
          </div>

          {loadingDrives ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading active placement drives...</div>
          ) : filteredDrives.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
              No matching drives found. Try pasting a custom job description instead.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {filteredDrives.map((drive) => {
                const isSelected = selectedJobId === drive.id;
                return (
                  <div
                    key={drive.id}
                    onClick={() => setSelectedJobId(drive.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/10'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-xs text-slate-900 block truncate">{drive.title}</span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          {drive.organizationName}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {(drive.requiredSkills || []).slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600"
                        >
                          {skill}
                        </span>
                      ))}
                      {(drive.requiredSkills || []).length > 3 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{drive.requiredSkills!.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Option B: Custom Job Description */}
      {mode === 'CUSTOM' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Target Job Title</label>
              <input
                type="text"
                placeholder="e.g. Associate Software Engineer / Frontend Developer"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Hiring Organization (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Infosys, TCS, or Target Startup"
                value={customCompany}
                onChange={(e) => setCustomCompany(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Job Description &amp; Technical Requirements
            </label>
            <textarea
              rows={6}
              placeholder="Paste the complete job description from LinkedIn, Naukri, or corporate career portals (minimum 30 characters)..."
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Character count: {customDescription.length} (minimum 30 required)
            </span>
          </div>
        </div>
      )}

      {/* Action CTA Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleStartAnalysis}
          disabled={disabled || isAnalyzing || (mode === 'CUSTOM' && customDescription.trim().length < 30)}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyzing Resume Against Job Requirements...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Analyze My Resume Against This Job</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
