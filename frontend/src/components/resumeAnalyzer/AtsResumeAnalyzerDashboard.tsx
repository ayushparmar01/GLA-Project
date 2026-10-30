import React, { useState, useEffect } from 'react';
import {
  ResumeDocumentData,
  AtsAnalysisResultData,
  ResumeSuggestionData,
  ResumeVersionData,
} from '../../types';
import {
  fetchResumeDocumentsApi,
  fetchResumeAnalysesApi,
  fetchResumeSuggestionsApi,
  fetchResumeVersionsApi,
  analyzeResumeApi,
} from '../../services/api';
import { ResumeUploadCard } from './ResumeUploadCard';
import { JobDescriptionSelector } from './JobDescriptionSelector';
import { AtsScoreCard } from './AtsScoreCard';
import { KeywordComparisonCard } from './KeywordComparisonCard';
import { SkillGapReportCard } from './SkillGapReportCard';
import { ResumeQualityReportCard } from './ResumeQualityReportCard';
import { AIBulletOptimizationPanel } from './AIBulletOptimizationPanel';
import { ResumeImprovementWorkspace } from './ResumeImprovementWorkspace';
import { ResumeVersionHistoryView } from './ResumeVersionHistoryView';
import {
  Sparkles,
  UploadCloud,
  FileCheck2,
  FileEdit,
  History,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface AtsResumeAnalyzerDashboardProps {
  token?: string | null;
  onNavigateToResumeBuilder?: () => void;
  onBackToPlacementDrives?: () => void;
}

type TabType = 'upload' | 'report' | 'improve' | 'history';

export const AtsResumeAnalyzerDashboard: React.FC<AtsResumeAnalyzerDashboardProps> = ({
  token,
  onNavigateToResumeBuilder,
  onBackToPlacementDrives,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('upload');

  // Documents state
  const [documents, setDocuments] = useState<ResumeDocumentData[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<ResumeDocumentData | null>(null);

  // Analyses state
  const [analyses, setAnalyses] = useState<AtsAnalysisResultData[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<AtsAnalysisResultData | null>(null);
  const [suggestions, setSuggestions] = useState<ResumeSuggestionData[]>([]);
  const [versions, setVersions] = useState<ResumeVersionData[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadInitialData();
  }, [token]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [docsRes, analysesRes] = await Promise.all([
        fetchResumeDocumentsApi(token),
        fetchResumeAnalysesApi(token),
      ]);

      if (docsRes.success && docsRes.data) {
        setDocuments(docsRes.data);
        if (docsRes.data.length > 0) {
          setSelectedDoc(docsRes.data[0]);
        }
      }

      if (analysesRes.success && analysesRes.data) {
        setAnalyses(analysesRes.data);
        if (analysesRes.data.length > 0) {
          setActiveAnalysis(analysesRes.data[0]);
          loadSuggestionsAndVersions(analysesRes.data[0]);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestionsAndVersions = async (analysis: AtsAnalysisResultData) => {
    try {
      const [sugRes, verRes] = await Promise.all([
        fetchResumeSuggestionsApi(analysis.id, token),
        fetchResumeVersionsApi(analysis.documentId, token),
      ]);
      if (sugRes.success && sugRes.data) setSuggestions(sugRes.data);
      if (verRes.success && verRes.data) setVersions(verRes.data);
    } catch {
      // Handled
    }
  };

  const handleDocumentUploaded = (doc: ResumeDocumentData) => {
    setSelectedDoc(doc);
    setDocuments((prev) => [doc, ...prev]);
    setNotice({
      type: 'success',
      text: `Resume "${doc.fileName}" parsed successfully. Now choose a target job below to calculate your ATS alignment score.`,
    });
  };

  const handleRunAnalysis = async (params: {
    jobId?: string;
    customJobTitle?: string;
    customJobDescription?: string;
    customCompanyName?: string;
  }) => {
    if (!selectedDoc) {
      setNotice({
        type: 'error',
        text: 'Please upload or select a resume document first.',
      });
      return;
    }

    setIsAnalyzing(true);
    setNotice(null);

    try {
      const res = await analyzeResumeApi(
        {
          documentId: selectedDoc.id,
          ...params,
        },
        token
      );

      if (res.success && res.data) {
        setActiveAnalysis(res.data);
        setAnalyses((prev) => [res.data!, ...prev]);
        await loadSuggestionsAndVersions(res.data);
        setActiveTab('report');
        setNotice({
          type: 'success',
          text: `ATS Analysis completed with a score of ${res.data.atsScore}/100!`,
        });
      } else {
        setNotice({
          type: 'error',
          text: res.error?.message || 'Failed to complete resume analysis.',
        });
      }
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error running analysis',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> AI ATS Resume Optimization · Phase 15
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            ATS Resume Analyzer &amp; Optimization System
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Extract structured resume intelligence, benchmark against actual corporate job descriptions, close keyword gaps, and optimize phrasing using action-oriented engineering bullets.
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="relative z-10 flex items-center gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">Latest ATS Score</span>
            <span className="text-2xl font-black text-emerald-400 block">
              {activeAnalysis ? `${activeAnalysis.atsScore}/100` : '--/100'}
            </span>
          </div>
          <div className="border-l border-slate-700 pl-4">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">Analyses Done</span>
            <span className="text-2xl font-black text-indigo-400 block">{analyses.length}</span>
          </div>
        </div>
      </div>

      {/* Floating Notice */}
      {notice && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium transition-all ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload &amp; Analyze</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('report')}
          disabled={!activeAnalysis}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            activeTab === 'report'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>ATS Diagnostic Report {activeAnalysis ? `(${activeAnalysis.atsScore}%)` : ''}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('improve')}
          disabled={!selectedDoc}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            activeTab === 'improve'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <FileEdit className="w-4 h-4" />
          <span>Improvement Workspace</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Version History ({versions.length})</span>
        </button>
      </div>

      {/* TAB CONTENT AREAS */}

      {/* 1. Upload & Analyze Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          <ResumeUploadCard token={token} onUploadSuccess={handleDocumentUploaded} />
          <JobDescriptionSelector
            onSelectJob={handleRunAnalysis}
            isAnalyzing={isAnalyzing}
            disabled={!selectedDoc}
          />
        </div>
      )}

      {/* 2. Analysis Report Tab */}
      {activeTab === 'report' && activeAnalysis && (
        <div className="space-y-6">
          <AtsScoreCard
            score={activeAnalysis.atsScore}
            tier={activeAnalysis.scoreTier}
            breakdown={activeAnalysis.scoreBreakdown}
            dataCoverage={activeAnalysis.dataCoveragePercentage}
            reasons={activeAnalysis.reasons}
            jobTitle={activeAnalysis.jobTitle}
            companyName={activeAnalysis.companyName}
            disclaimer={activeAnalysis.disclaimer}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <KeywordComparisonCard keywordAnalysis={activeAnalysis.keywordAnalysis} />
            <SkillGapReportCard skillGaps={activeAnalysis.skillGapAnalysis} />
          </div>

          <ResumeQualityReportCard qualityReport={activeAnalysis.qualityReport} />

          <AIBulletOptimizationPanel
            aiFeedback={activeAnalysis.aiFeedback}
            suggestions={suggestions}
            token={token}
            onSuggestionUpdated={() => {
              if (activeAnalysis) loadSuggestionsAndVersions(activeAnalysis);
            }}
            onApplyToWorkspace={(suggested, orig) => {
              setNotice({
                type: 'success',
                text: 'Suggestion applied! Click "Improvement Workspace" above to review and export your updated resume.',
              });
            }}
          />
        </div>
      )}

      {/* 3. Improvement Workspace Tab */}
      {activeTab === 'improve' && selectedDoc && (
        <ResumeImprovementWorkspace
          documentId={selectedDoc.id}
          initialData={selectedDoc.structuredData}
          token={token}
          onVersionSaved={(newVer) => {
            setVersions((prev) => [newVer, ...prev]);
          }}
          onNavigateToResumeBuilder={onNavigateToResumeBuilder}
        />
      )}

      {/* 4. Version History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <ResumeVersionHistoryView
            versions={versions}
            onSelectVersion={(ver) => {
              if (selectedDoc) {
                selectedDoc.structuredData = ver.structuredData;
                setActiveTab('improve');
              }
            }}
          />

          {/* Past Analyses Table */}
          {analyses.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Past Resume Analyses ({analyses.length})
              </h4>
              <div className="divide-y divide-slate-100">
                {analyses.map((an) => (
                  <div
                    key={an.id}
                    className="py-3 flex items-center justify-between text-xs gap-3"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{an.jobTitle}</span>
                      <span className="text-slate-400">{an.companyName} &bull; {new Date(an.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {an.atsScore}/100
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAnalysis(an);
                          loadSuggestionsAndVersions(an);
                          setActiveTab('report');
                        }}
                        className="text-xs text-indigo-600 hover:underline font-semibold cursor-pointer"
                      >
                        View Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
