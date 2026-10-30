import { Request, Response } from 'express';
import { ResumeAnalyzerService } from '../services/resumeAnalyzer.service.js';
import { generateResumePdf } from '../services/pdfGenerator.service.js';
import { ResumeData } from '../types/index.js';

export class ResumeAnalyzerController {
  /**
   * Uploads and parses a PDF or DOCX resume document.
   * POST /api/resume-analyzer/upload
   */
  public static async uploadResume(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      if (!studentId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { fileName, fileBase64 } = req.body;
      if (!fileName || !fileBase64) {
        res.status(400).json({
          success: false,
          message: 'Both fileName and fileBase64 are required for resume upload.',
        });
        return;
      }

      // Convert base64 to Buffer
      let cleanBase64 = fileBase64;
      if (cleanBase64.includes(',')) {
        cleanBase64 = cleanBase64.split(',')[1];
      }
      const buffer = Buffer.from(cleanBase64, 'base64');

      const document = await ResumeAnalyzerService.uploadDocument(studentId, buffer, fileName);

      res.status(201).json({
        success: true,
        message: 'Resume uploaded and parsed successfully.',
        data: document,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to process resume upload.',
      });
    }
  }

  /**
   * Lists all uploaded resume documents for the authenticated student.
   * GET /api/resume-analyzer/documents
   */
  public static async listDocuments(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      if (!studentId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const documents = await ResumeAnalyzerService.listDocuments(studentId);
      res.status(200).json({
        success: true,
        data: documents,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve resume documents.',
      });
    }
  }

  /**
   * Retrieves single document by ID.
   * GET /api/resume-analyzer/documents/:id
   */
  public static async getDocument(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      if (!studentId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const document = await ResumeAnalyzerService.getDocument(req.params.id, studentId);
      res.status(200).json({
        success: true,
        data: document,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Document not found.',
      });
    }
  }

  /**
   * Deletes a resume document and its analyses.
   * DELETE /api/resume-analyzer/documents/:id
   */
  public static async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      if (!studentId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      await ResumeAnalyzerService.deleteDocument(req.params.id, studentId);
      res.status(200).json({
        success: true,
        message: 'Resume document deleted successfully.',
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Failed to delete resume document.',
      });
    }
  }

  /**
   * Analyzes an uploaded resume against a target job or custom description.
   * POST /api/resume-analyzer/analyze
   */
  public static async analyzeResume(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      if (!studentId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { documentId, jobId, customJobTitle, customJobDescription, customCompanyName } =
        req.body;

      if (!documentId) {
        res.status(400).json({
          success: false,
          message: 'Document ID is required for resume analysis.',
        });
        return;
      }

      const result = await ResumeAnalyzerService.analyzeResume(studentId, {
        documentId,
        jobId,
        customJobTitle,
        customJobDescription,
        customCompanyName,
      });

      res.status(201).json({
        success: true,
        message: 'Resume analysis completed successfully.',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to analyze resume.',
      });
    }
  }

  /**
   * Retrieves single analysis report by ID.
   * GET /api/resume-analyzer/analyses/:id
   */
  public static async getAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      if (!studentId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const analysis = await ResumeAnalyzerService.getAnalysis(req.params.id, studentId);
      res.status(200).json({
        success: true,
        data: analysis,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Analysis report not found.',
      });
    }
  }

  /**
   * Lists analysis history for the student.
   * GET /api/resume-analyzer/analyses
   */
  public static async listAnalyses(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      if (!studentId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const list = await ResumeAnalyzerService.listAnalyses(studentId);
      res.status(200).json({
        success: true,
        data: list,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve analysis history.',
      });
    }
  }

  /**
   * Lists suggestions associated with an analysis.
   * GET /api/resume-analyzer/analyses/:id/suggestions
   */
  public static async listSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      if (!studentId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const suggestions = await ResumeAnalyzerService.listSuggestions(
        req.params.id,
        studentId
      );
      res.status(200).json({
        success: true,
        data: suggestions,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve suggestions.',
      });
    }
  }

  /**
   * Updates suggestion status (ACCEPTED or REJECTED).
   * PATCH /api/resume-analyzer/suggestions/:id
   */
  public static async updateSuggestionStatus(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      if (!studentId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { status } = req.body;
      if (!['ACCEPTED', 'REJECTED'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Status must be either ACCEPTED or REJECTED.',
        });
        return;
      }

      const updated = await ResumeAnalyzerService.updateSuggestionStatus(
        req.params.id,
        studentId,
        status
      );

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update suggestion status.',
      });
    }
  }

  /**
   * Creates a new resume version.
   * POST /api/resume-analyzer/versions
   */
  public static async createVersion(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      if (!studentId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { documentId, structuredData, changeSummary } = req.body;
      if (!documentId || !structuredData) {
        res.status(400).json({
          success: false,
          message: 'Document ID and structured data are required.',
        });
        return;
      }

      const version = await ResumeAnalyzerService.createResumeVersion(studentId, {
        documentId,
        structuredData,
        changeSummary,
      });

      res.status(201).json({
        success: true,
        message: 'Resume version saved successfully.',
        data: version,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to save resume version.',
      });
    }
  }

  /**
   * Lists all versions for a document.
   * GET /api/resume-analyzer/versions/:documentId
   */
  public static async listVersions(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      if (!studentId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const versions = await ResumeAnalyzerService.listResumeVersions(
        req.params.documentId,
        studentId
      );
      res.status(200).json({
        success: true,
        data: versions,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Failed to retrieve version history.',
      });
    }
  }

  /**
   * Exports improved resume as an ATS-compliant PDF using Phase 5 pdfGenerator.
   * POST /api/resume-analyzer/export-improved-pdf
   */
  public static async exportImprovedPdf(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      if (!studentId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { title, structuredData, template } = req.body;
      if (!structuredData) {
        res.status(400).json({
          success: false,
          message: 'Structured resume data is required for PDF export.',
        });
        return;
      }

      // Adapt to Phase 5 ResumeData structure
      const resumeAdapter: ResumeData = {
        id: `exp_${Date.now()}`,
        studentId,
        title: title || 'ATS-Optimized Resume',
        template: template || 'MODERN',
        structuredContent: {
          personalInfo: {
            fullName: structuredData.contact?.fullName || 'Candidate',
            email: structuredData.contact?.email || '',
            phone: structuredData.contact?.phone || '',
            location: structuredData.contact?.location || '',
            linkedinUrl: structuredData.contact?.linkedinUrl || '',
            githubUrl: structuredData.contact?.githubUrl || '',
            portfolioUrl: structuredData.contact?.portfolioUrl || '',
            summary: structuredData.contact?.summary || '',
          },
          education: structuredData.education || [],
          technicalSkills: structuredData.technicalSkills || [],
          softSkills: structuredData.softSkills || [],
          projects: structuredData.projects || [],
          experience: structuredData.workExperience || [],
          certifications: structuredData.certifications || [],
          achievements: (structuredData.achievements || []).map((a: string) => ({
            title: a,
            description: a,
          })),
        },
        version: 1,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const pdfBuffer = await generateResumePdf(resumeAdapter);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="ATS_Optimized_Resume_${Date.now()}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export improved resume as PDF.',
      });
    }
  }

  /**
   * College-level aggregate analytics.
   * GET /api/resume-analyzer/college/analytics
   */
  public static async getCollegeAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const collegeId = req.user?.sub;
      if (!collegeId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const report = await ResumeAnalyzerService.getCollegeResumeAnalytics(collegeId);
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve college resume analytics.',
      });
    }
  }

  /**
   * Employer-side candidate resume inspection for authorized drives.
   * GET /api/resume-analyzer/employer/candidate-resume/:applicationId
   */
  public static async getEmployerCandidateResume(req: Request, res: Response): Promise<void> {
    try {
      const employerId = req.user?.sub;
      if (!employerId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const data = await ResumeAnalyzerService.getEmployerCandidateResume(
        employerId,
        req.params.applicationId
      );
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      res.status(403).json({
        success: false,
        message: error.message || 'Access denied to candidate resume.',
      });
    }
  }
}
