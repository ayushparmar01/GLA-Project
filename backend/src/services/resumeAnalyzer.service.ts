import mongoose from 'mongoose';
import { ResumeDocument, IResumeDocument } from '../models/resumeDocument.model.js';
import { ResumeAnalysis, IResumeAnalysis } from '../models/resumeAnalysis.model.js';
import { ResumeVersion, IResumeVersion } from '../models/resumeVersion.model.js';
import { ResumeSuggestion, IResumeSuggestion } from '../models/resumeSuggestion.model.js';
import { PlacementDrive } from '../models/placementDrive.model.js';
import { PlacementApplication } from '../models/placementApplication.model.js';
import { User } from '../models/user.model.js';
import { ResumeDocumentParserService } from './resumeDocumentParser.service.js';
import { AtsScoringService, JobRequirementsInput } from './atsScoring.service.js';
import { ResumeAiFeedbackService } from './resumeAiFeedback.service.js';
import { NotificationService } from './notification/notification.service.js';
import {
  ResumeDocumentData,
  AtsAnalysisResultData,
  ResumeSuggestionData,
  ResumeVersionData,
  CollegeResumeAnalyticsReport,
  ExtractedStructuredResume,
} from '../types/index.js';

export class ResumeAnalyzerService {
  /**
   * Uploads and parses a student resume document (PDF or DOCX).
   */
  public static async uploadDocument(
    studentId: string,
    fileBuffer: Buffer,
    fileName: string
  ): Promise<ResumeDocumentData> {
    // 1. Validate file format and size
    const validation = ResumeDocumentParserService.validateDocument(fileBuffer, fileName);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid resume document format.');
    }

    // 2. Generate secure non-traversable storage reference
    const storageRef = ResumeDocumentParserService.generateSecureStorageReference(
      studentId,
      fileName
    );

    // 3. Extract text
    const { text, isScannedOrEmpty } = ResumeDocumentParserService.extractRawText(
      fileBuffer,
      validation.fileType
    );

    if (isScannedOrEmpty && (!text || text.length < 20)) {
      throw new Error(
        'The uploaded document contains no readable selectable text. Scanned image-based PDFs without an embedded text layer are not supported. Please upload a PDF with selectable text or a DOCX file.'
      );
    }

    // 4. Parse structured fields
    const structuredData = ResumeDocumentParserService.parseStructuredFields(text);

    // 5. Persist document
    const doc = await ResumeDocument.create({
      studentId,
      fileName: fileName.trim(),
      fileType: validation.fileType,
      fileSize: fileBuffer.length,
      secureStorageReference: storageRef,
      extractionStatus: 'PARSED',
      extractedText: text,
      structuredData,
      rawBufferData: fileBuffer.toString('base64'),
    });

    // Notify student via in-app notification engine
    try {
      const notifService = NotificationService.getInstance();
      await notifService.createNotification({
        recipientId: studentId,
        type: 'SYSTEM_ANNOUNCEMENT',
        title: 'Resume Extracted Successfully',
        message: `Your resume "${fileName}" was parsed into structured sections. You can now analyze it against job listings.`,
        relatedEntityType: 'RESUME',
        relatedEntityId: doc._id.toString(),
      });
    } catch {
      // Non-blocking notification delivery
    }

    return doc.toSafeObject();
  }

  /**
   * Lists all uploaded resume documents for a student.
   */
  public static async listDocuments(studentId: string): Promise<ResumeDocumentData[]> {
    const docs = await ResumeDocument.find({ studentId }).sort({ createdAt: -1 });
    return docs.map((d) => d.toSafeObject());
  }

  /**
   * Retrieves a single document by ID verifying student ownership.
   */
  public static async getDocument(
    documentId: string,
    studentId: string
  ): Promise<ResumeDocumentData> {
    const doc = await ResumeDocument.findOne({ _id: documentId, studentId });
    if (!doc) {
      throw new Error('Resume document not found or access unauthorized.');
    }
    return doc.toSafeObject();
  }

  /**
   * Deletes a document and associated analyses, verifying student ownership.
   */
  public static async deleteDocument(documentId: string, studentId: string): Promise<boolean> {
    const doc = await ResumeDocument.findOne({ _id: documentId, studentId });
    if (!doc) {
      throw new Error('Resume document not found or access unauthorized.');
    }

    await ResumeDocument.deleteOne({ _id: documentId });
    await ResumeAnalysis.deleteMany({ documentId });
    await ResumeVersion.deleteMany({ documentId });

    return true;
  }

  /**
   * Analyzes an uploaded resume against an existing CareerBridge job or a custom job description.
   */
  public static async analyzeResume(
    studentId: string,
    params: {
      documentId: string;
      jobId?: string;
      customJobTitle?: string;
      customJobDescription?: string;
      customCompanyName?: string;
    }
  ): Promise<AtsAnalysisResultData> {
    // 1. Verify document ownership
    const doc = await ResumeDocument.findOne({ _id: params.documentId, studentId });
    if (!doc) {
      throw new Error('Resume document not found or unauthorized.');
    }

    let jobRequirements: JobRequirementsInput;
    let isCustomJob = false;
    let jobTitle = '';
    let companyName = '';
    let jobDescriptionText = '';

    // 2. Resolve Job Requirements
    if (params.jobId) {
      const drive = await PlacementDrive.findById(params.jobId);
      if (!drive) {
        throw new Error('Target CareerBridge placement drive not found.');
      }
      jobTitle = drive.title;
      companyName = drive.organizationName || 'Corporate Employer';
      jobDescriptionText = drive.description || '';
      jobRequirements = {
        title: drive.title,
        organizationName: drive.organizationName,
        description: drive.description || '',
        requiredSkills: drive.requiredSkills || [],
        preferredSkills: drive.preferredSkills || [],
        eligibleCourses: drive.eligibleCourses || [],
        minExperienceYears: drive.minExperienceYears || 0,
      };
    } else if (params.customJobDescription && params.customJobDescription.trim().length >= 30) {
      isCustomJob = true;
      jobTitle = params.customJobTitle?.trim() || 'Custom Software Role';
      companyName = params.customCompanyName?.trim() || 'Target Employer';
      jobDescriptionText = params.customJobDescription.trim();

      // Extract skills from text
      const extractedJobSkills = this.extractSkillsFromText(jobDescriptionText);
      jobRequirements = {
        title: jobTitle,
        organizationName: companyName,
        description: jobDescriptionText,
        requiredSkills: extractedJobSkills.length > 0 ? extractedJobSkills : ['JavaScript', 'React', 'Problem Solving'],
      };
    } else {
      throw new Error(
        'Please select a valid CareerBridge job listing or provide a detailed custom job description (minimum 30 characters).'
      );
    }

    // 3. Compute Deterministic ATS Score and Analysis
    const structuredResume = doc.structuredData || ResumeDocumentParserService.parseStructuredFields(doc.extractedText);
    const scoreResult = AtsScoringService.calculateAtsScore(structuredResume, jobRequirements);

    // 4. Generate AI-powered feedback & bullet enhancements
    const aiFeedback = await ResumeAiFeedbackService.generateFeedback(structuredResume, jobRequirements);

    // 5. Persist ResumeAnalysis record
    const analysis = await ResumeAnalysis.create({
      studentId,
      documentId: doc._id,
      jobId: params.jobId || undefined,
      jobTitle,
      companyName,
      isCustomJob,
      jobDescriptionText,
      atsScore: scoreResult.atsScore,
      scoreTier: scoreResult.scoreTier,
      scoreBreakdown: scoreResult.scoreBreakdown,
      dataCoveragePercentage: scoreResult.dataCoveragePercentage,
      reasons: scoreResult.reasons,
      keywordAnalysis: scoreResult.keywordAnalysis,
      skillGapAnalysis: scoreResult.skillGapAnalysis,
      qualityReport: scoreResult.qualityReport,
      aiFeedback,
      disclaimer:
        'ATS Compatibility Score is an internal algorithmic guidance metric. It does not represent or guarantee actual employer ATS decisions, shortlisting, or recruitment outcomes.',
    });

    // 6. Generate individual ResumeSuggestion records for student review
    for (const item of aiFeedback.bulletSuggestions) {
      await ResumeSuggestion.create({
        studentId,
        analysisId: analysis._id,
        section: item.section,
        originalText: item.originalBullet,
        suggestedText: item.suggestedBullet,
        reason: item.reason,
        status: 'PENDING',
      });
    }

    // 7. Dispatch in-app notification
    try {
      const notifService = NotificationService.getInstance();
      await notifService.createNotification({
        recipientId: studentId,
        type: 'SYSTEM_ANNOUNCEMENT',
        title: `ATS Analysis Complete: ${scoreResult.atsScore}/100`,
        message: `Your resume was analyzed for "${jobTitle}". Identified ${scoreResult.keywordAnalysis.matchedKeywords.length} matched skills and actionable bullet enhancements.`,
        relatedEntityType: 'RESUME',
        relatedEntityId: analysis._id.toString(),
      });
    } catch {
      // Non-blocking
    }

    return analysis.toSafeObject();
  }

  /**
   * Retrieves analysis by ID verifying student ownership.
   */
  public static async getAnalysis(
    analysisId: string,
    studentId: string
  ): Promise<AtsAnalysisResultData> {
    const analysis = await ResumeAnalysis.findOne({ _id: analysisId, studentId });
    if (!analysis) {
      throw new Error('Resume analysis report not found or unauthorized.');
    }
    return analysis.toSafeObject();
  }

  /**
   * Lists analysis history for a student.
   */
  public static async listAnalyses(studentId: string): Promise<AtsAnalysisResultData[]> {
    const list = await ResumeAnalysis.find({ studentId }).sort({ createdAt: -1 });
    return list.map((a) => a.toSafeObject());
  }

  /**
   * Lists suggestions associated with an analysis.
   */
  public static async listSuggestions(
    analysisId: string,
    studentId: string
  ): Promise<ResumeSuggestionData[]> {
    const list = await ResumeSuggestion.find({ analysisId, studentId }).sort({ createdAt: 1 });
    return list.map((s) => s.toSafeObject());
  }

  /**
   * Updates suggestion status (ACCEPTED or REJECTED).
   */
  public static async updateSuggestionStatus(
    suggestionId: string,
    studentId: string,
    status: 'ACCEPTED' | 'REJECTED'
  ): Promise<ResumeSuggestionData> {
    const suggestion = await ResumeSuggestion.findOne({ _id: suggestionId, studentId });
    if (!suggestion) {
      throw new Error('Suggestion not found or unauthorized.');
    }
    suggestion.status = status;
    await suggestion.save();
    return suggestion.toSafeObject();
  }

  /**
   * Saves a new resume version with student-approved edits.
   */
  public static async createResumeVersion(
    studentId: string,
    params: {
      documentId: string;
      structuredData: ExtractedStructuredResume;
      changeSummary?: string;
    }
  ): Promise<ResumeVersionData> {
    const doc = await ResumeDocument.findOne({ _id: params.documentId, studentId });
    if (!doc) {
      throw new Error('Resume document not found or unauthorized.');
    }

    // Determine next version number
    const highestVer = await ResumeVersion.findOne({ documentId: params.documentId })
      .sort({ versionNumber: -1 })
      .select('versionNumber');

    const nextVerNum = highestVer ? highestVer.versionNumber + 1 : 1;

    const version = await ResumeVersion.create({
      studentId,
      documentId: params.documentId,
      versionNumber: nextVerNum,
      structuredData: params.structuredData,
      changeSummary: params.changeSummary || `Version ${nextVerNum} update with improved ATS bullet phrasing`,
    });

    // Update base document's structured data
    doc.structuredData = params.structuredData;
    await doc.save();

    return version.toSafeObject();
  }

  /**
   * Lists version history for a resume document.
   */
  public static async listResumeVersions(
    documentId: string,
    studentId: string
  ): Promise<ResumeVersionData[]> {
    const doc = await ResumeDocument.findOne({ _id: documentId, studentId });
    if (!doc) {
      throw new Error('Resume document not found or unauthorized.');
    }

    const versions = await ResumeVersion.find({ documentId }).sort({ versionNumber: -1 });
    return versions.map((v) => v.toSafeObject());
  }

  /**
   * College-level institutional aggregate resume analytics with student privacy safeguards.
   */
  public static async getCollegeResumeAnalytics(
    collegeId: string
  ): Promise<CollegeResumeAnalyticsReport> {
    // 1. Find all students belonging to this college
    const students = await User.find({ collegeId, role: 'STUDENT' }).select('_id');
    const studentIds = students.map((s) => s._id);

    if (studentIds.length === 0) {
      return {
        collegeId,
        totalStudentsUsingAnalyzer: 0,
        totalAnalysesCompleted: 0,
        averageAtsScore: 0,
        commonMissingSkills: [],
        commonQualityIssues: [],
        generatedAt: new Date().toISOString(),
      };
    }

    // 2. Fetch all completed analyses for these students
    const analyses = await ResumeAnalysis.find({ studentId: { $in: studentIds } });

    const totalAnalysesCompleted = analyses.length;
    const participatingStudentIds = new Set(analyses.map((a) => a.studentId.toString()));
    const totalStudentsUsingAnalyzer = participatingStudentIds.size;

    let scoreSum = 0;
    const missingSkillCounts: Record<string, number> = {};
    const qualityIssueCounts: Record<string, number> = {};

    for (const a of analyses) {
      scoreSum += a.atsScore;

      // Missing skills
      const missingList = a.keywordAnalysis?.missingKeywords || [];
      for (const m of missingList) {
        missingSkillCounts[m] = (missingSkillCounts[m] || 0) + 1;
      }

      // Quality warnings
      const warnings = a.qualityReport?.warnings || [];
      for (const w of warnings) {
        qualityIssueCounts[w] = (qualityIssueCounts[w] || 0) + 1;
      }
    }

    const averageAtsScore =
      totalAnalysesCompleted > 0 ? Math.round(scoreSum / totalAnalysesCompleted) : 0;

    const commonMissingSkills = Object.entries(missingSkillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const commonQualityIssues = Object.entries(qualityIssueCounts)
      .map(([issue, occurrences]) => ({ issue, occurrences }))
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 6);

    return {
      collegeId,
      totalStudentsUsingAnalyzer,
      totalAnalysesCompleted,
      averageAtsScore,
      commonMissingSkills,
      commonQualityIssues,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Employer-side candidate resume inspection with strict privacy boundaries.
   */
  public static async getEmployerCandidateResume(
    employerId: string,
    applicationId: string
  ): Promise<{
    applicationId: string;
    studentName: string;
    jobTitle: string;
    extractedResume: ExtractedStructuredResume;
    keywordAlignment: {
      matched: string[];
      missing: string[];
    };
  }> {
    const application = await PlacementApplication.findById(applicationId);
    if (!application) {
      throw new Error('Application not found.');
    }

    // Verify application belongs to a drive owned by this employer
    const drive = await PlacementDrive.findById(application.placementDriveId);
    if (!drive || drive.employerId?.toString() !== employerId) {
      throw new Error('Unauthorized: You are only permitted to review candidates for your published drives.');
    }

    // Retrieve candidate document
    const student = await User.findById(application.studentId).select('name studentProfile');
    const doc = await ResumeDocument.findOne({ studentId: application.studentId }).sort({ createdAt: -1 });

    const extractedResume: ExtractedStructuredResume = doc?.structuredData || {
      contact: { fullName: student?.name || 'Applicant' },
      education: [],
      technicalSkills: student?.studentProfile?.technicalSkills || [],
      softSkills: [],
      workExperience: [],
      projects: [],
      certifications: [],
      achievements: [],
      rawTextLength: 0,
    };

    // Keyword alignment
    const driveReq = drive.requiredSkills || [];
    const resumeSkillsLower = extractedResume.technicalSkills.map((s) => s.toLowerCase());
    const matched = driveReq.filter((s) => resumeSkillsLower.includes(s.toLowerCase()));
    const missing = driveReq.filter((s) => !resumeSkillsLower.includes(s.toLowerCase()));

    return {
      applicationId,
      studentName: student?.name || 'Applicant',
      jobTitle: drive.title,
      extractedResume,
      keywordAlignment: {
        matched,
        missing,
      },
    };
  }

  private static extractSkillsFromText(text: string): string[] {
    const known = [
      'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'SQL', 'MongoDB',
      'Docker', 'AWS', 'REST APIs', 'Git', 'HTML', 'CSS', 'Redux', 'Express', 'Tailwind',
    ];
    const found: string[] = [];
    const lower = text.toLowerCase();
    for (const k of known) {
      if (lower.includes(k.toLowerCase())) {
        found.push(k);
      }
    }
    return found;
  }
}
