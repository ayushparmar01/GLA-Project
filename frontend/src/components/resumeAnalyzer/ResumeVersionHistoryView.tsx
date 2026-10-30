import React, { useState } from 'react';
import { ResumeVersionData } from '../../types';
import {
  History,
  GitCompare,
  Clock,
  ArrowRight,
  CheckCircle2,
  X,
  FileText,
} from 'lucide-react';

interface ResumeVersionHistoryViewProps {
  versions: ResumeVersionData[];
  onSelectVersion?: (version: ResumeVersionData) => void;
}

export const ResumeVersionHistoryView: React.FC<ResumeVersionHistoryViewProps> = ({
  versions,
  onSelectVersion,
}) => {
  const [comparingVersions, setComparingVersions] = useState<{
    vA: ResumeVersionData | null;
    vB: ResumeVersionData | null;
  }>({ vA: null, vB: null });

  const handleStartCompare = (v: ResumeVersionData) => {
    if (!comparingVersions.vA) {
      setComparingVersions({ vA: v, vB: null });
    } else if (!comparingVersions.vB && comparingVersions.vA.id !== v.id) {
      setComparingVersions((prev) => ({ ...prev, vB: v }));
    }
  };

  const handleCloseCompare = () => {
    setComparingVersions({ vA: null, vB: null });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5 text-slate-600" />
            Resume Revision Ledger
          </div>
          <h3 className="text-lg font-bold text-slate-900">Document Version History</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Review previous ATS optimizations, compare revisions, and track your wording improvements over time.
          </p>
        </div>

        <span className="text-xs text-slate-400 font-semibold bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
          {versions.length} {versions.length === 1 ? 'version' : 'versions'} saved
        </span>
      </div>

      {/* Version List */}
      {versions.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
          No previous versions recorded yet. As you refine your resume in the improvement workspace, versions will appear here.
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((ver) => (
            <div
              key={ver.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Version {ver.versionNumber}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">{ver.changeSummary}</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {new Date(ver.createdAt).toLocaleString()} &bull;{' '}
                  {ver.structuredData?.technicalSkills?.length || 0} skills &bull;{' '}
                  {ver.structuredData?.projects?.length || 0} projects
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleStartCompare(ver)}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <GitCompare className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Compare</span>
                </button>

                {onSelectVersion && (
                  <button
                    type="button"
                    onClick={() => onSelectVersion(ver)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Load into Workspace
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {comparingVersions.vA && comparingVersions.vB && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-indigo-600" />
                  Side-by-Side Version Comparison
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Comparing Version {comparingVersions.vA.versionNumber} with Version {comparingVersions.vB.versionNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseCompare}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Version A */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1">
                  Version {comparingVersions.vA.versionNumber} ({new Date(comparingVersions.vA.createdAt).toLocaleDateString()})
                </span>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Summary:</span>
                  <p className="text-slate-700 mt-0.5">{comparingVersions.vA.structuredData?.contact?.summary || 'None'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Skills:</span>
                  <p className="text-slate-700 mt-0.5">{(comparingVersions.vA.structuredData?.technicalSkills || []).join(', ')}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Projects:</span>
                  <div className="space-y-1 mt-1">
                    {(comparingVersions.vA.structuredData?.projects || []).map((p, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border border-slate-200">
                        <span className="font-bold block">{p.title}</span>
                        <span className="text-[11px] text-slate-500 block">{(p.bullets || []).join(' | ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Version B */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-3">
                <span className="font-bold text-slate-900 block border-b border-emerald-200 pb-1">
                  Version {comparingVersions.vB.versionNumber} ({new Date(comparingVersions.vB.createdAt).toLocaleDateString()})
                </span>
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">Summary:</span>
                  <p className="text-slate-700 mt-0.5">{comparingVersions.vB.structuredData?.contact?.summary || 'None'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">Skills:</span>
                  <p className="text-slate-700 mt-0.5">{(comparingVersions.vB.structuredData?.technicalSkills || []).join(', ')}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">Projects:</span>
                  <div className="space-y-1 mt-1">
                    {(comparingVersions.vB.structuredData?.projects || []).map((p, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border border-emerald-200">
                        <span className="font-bold block">{p.title}</span>
                        <span className="text-[11px] text-slate-500 block">{(p.bullets || []).join(' | ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
