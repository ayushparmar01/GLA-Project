import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { ResumeDocumentData } from '../../types';
import { uploadResumeDocumentApi } from '../../services/api';

interface ResumeUploadCardProps {
  token?: string | null;
  onUploadSuccess: (doc: ResumeDocumentData) => void;
}

export const ResumeUploadCard: React.FC<ResumeUploadCardProps> = ({
  token,
  onUploadSuccess,
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedDoc, setUploadedDoc] = useState<ResumeDocumentData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.pdf') && !lowerName.endsWith('.docx') && !lowerName.endsWith('.doc')) {
      setError('Unsupported file type. Please upload a PDF (.pdf) or Word document (.docx).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit. Please upload a smaller document.');
      return;
    }
    setSelectedFile(file);
    setUploadedDoc(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUploadAndParse = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = reader.result as string;
        const res = await uploadResumeDocumentApi(selectedFile.name, base64String, token);

        if (res.success && res.data) {
          setUploadedDoc(res.data);
          onUploadSuccess(res.data);
        } else {
          setError(res.error?.message || 'Failed to upload and parse resume document.');
        }
        setUploading(false);
      };
      reader.onerror = () => {
        setError('Error reading local file.');
        setUploading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setUploadedDoc(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2">
          <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
          Step 1: Upload Student Resume
        </div>
        <h3 className="text-lg font-bold text-slate-900">Resume Document Ingestion &amp; Text Extraction</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload your resume in PDF or DOCX format. Our engine extracts structured sections without leaking host paths.
        </p>
      </div>

      {/* Drag & Drop Box */}
      {!selectedFile && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={handleChange}
            className="hidden"
          />
          <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-center mx-auto mb-3 text-emerald-600">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">
            Drag &amp; drop your resume file here, or{' '}
            <span className="text-emerald-700 hover:underline">browse files</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Supported formats: PDF (.pdf), Word (.docx) &bull; Maximum file size: 5MB
          </p>
        </div>
      )}

      {/* Selected File Details */}
      {selectedFile && !uploadedDoc && (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-800 flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                {selectedFile.name}
              </div>
              <div className="text-xs text-slate-400">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready to parse
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleUploadAndParse}
              disabled={uploading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Parsing Document...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Extract Resume Text</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Extracted Structured Preview */}
      {uploadedDoc && (
        <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Resume Extracted Successfully ({uploadedDoc.fileName})</span>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs text-emerald-700 hover:underline"
            >
              Upload Different File
            </button>
          </div>

          {/* Quick Structured Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-emerald-100">
              <span className="text-[11px] font-semibold text-slate-400 block">Identified Candidate</span>
              <span className="font-bold text-slate-800 block truncate">
                {uploadedDoc.structuredData?.contact?.fullName || 'Candidate Name'}
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                {uploadedDoc.structuredData?.contact?.email || 'No email detected'}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-emerald-100">
              <span className="text-[11px] font-semibold text-slate-400 block">Technical Skills</span>
              <span className="font-bold text-emerald-700 block text-base">
                {uploadedDoc.structuredData?.technicalSkills?.length || 0} skills
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                {(uploadedDoc.structuredData?.technicalSkills || []).slice(0, 3).join(', ') || 'None found'}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-emerald-100">
              <span className="text-[11px] font-semibold text-slate-400 block">Sections Parsed</span>
              <span className="font-bold text-indigo-700 block text-base">
                {(uploadedDoc.structuredData?.projects?.length || 0)} Projects &bull;{' '}
                {(uploadedDoc.structuredData?.education?.length || 0)} Degrees
              </span>
              <span className="text-[10px] text-slate-500 block">
                {uploadedDoc.structuredData?.rawTextLength || 0} characters extracted
              </span>
            </div>
          </div>

          {/* Security & Privacy Notice */}
          <div className="flex items-start gap-2 text-[11px] text-emerald-800 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Document Privacy Safeguard:</strong> This document is stored in an encrypted student vault and is strictly evaluated as data. It will never be indexed publicly or shared with employers without your explicit job application submission.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
