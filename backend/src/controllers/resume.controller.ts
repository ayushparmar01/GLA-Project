import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Resume, IResume } from '../models/resume.model.js';
import { User } from '../models/user.model.js';
import { PlacementApplication } from '../models/placementApplication.model.js';
import { PlacementDrive } from '../models/placementDrive.model.js';
import { getDbStatus } from '../config/db.js';
import { generateResumePdf } from '../services/pdfGenerator.service.js';
import { ResumeTemplate, ResumeData, ResumeStructuredContent } from '../types/index.js';

export const createResume = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only students can create resumes.' },
    });
    return;
  }

  const { title, template = 'MODERN', structuredContent, isDefault = false } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Resume title is required (minimum 2 characters).' },
    });
    return;
  }

  if (!['MODERN', 'PROFESSIONAL', 'MINIMAL'].includes(template)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Template must be MODERN, PROFESSIONAL, or MINIMAL.' },
    });
    return;
  }

  if (!structuredContent || typeof structuredContent !== 'object') {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Resume structured content is required.' },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is currently unavailable.' },
    });
    return;
  }

  try {
    const studentObjectId = new mongoose.Types.ObjectId(req.user.sub);

    // If marked as default, unset other defaults
    if (isDefault) {
      await Resume.updateMany({ studentId: studentObjectId }, { isDefault: false });
    }

    // Determine version number for resumes with matching title
    const existingVersions = await Resume.find({
      studentId: studentObjectId,
      title: title.trim(),
    }).sort({ version: -1 });

    const nextVersion = existingVersions.length > 0 ? existingVersions[0].version + 1 : 1;

    const resume = new Resume({
      studentId: studentObjectId,
      title: title.trim(),
      template: template as ResumeTemplate,
      structuredContent,
      version: nextVersion,
      isDefault: Boolean(isDefault),
    });

    await resume.save();

    res.status(201).json({
      success: true,
      data: resume.toSafeObject(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create resume.',
        details: error instanceof Error ? error.message : undefined,
      },
    });
  }
};

export const listMyResumes = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only students can list their resumes.' },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is currently unavailable.' },
    });
    return;
  }

  try {
    const studentObjectId = new mongoose.Types.ObjectId(req.user.sub);
    const resumes = await Resume.find({ studentId: studentObjectId }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: resumes.map((r) => r.toSafeObject()),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch resumes.',
        details: error instanceof Error ? error.message : undefined,
      },
    });
  }
};

export const getResumeById = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only students can view their resumes.' },
    });
    return;
  }

  const resumeId = String(req.params.resumeId);
  if (!mongoose.Types.ObjectId.isValid(resumeId)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid resume ID format.' },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is currently unavailable.' },
    });
    return;
  }

  try {
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resume not found.' },
      });
      return;
    }

    if (resume.studentId.toString() !== req.user.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to access this resume.' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: resume.toSafeObject(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch resume.',
        details: error instanceof Error ? error.message : undefined,
      },
    });
  }
};

export const updateResume = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only students can update their resumes.' },
    });
    return;
  }

  const resumeId = String(req.params.resumeId);
  const { title, template, structuredContent, isDefault } = req.body;

  if (!mongoose.Types.ObjectId.isValid(resumeId)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid resume ID format.' },
    });
    return;
  }

  if (template && !['MODERN', 'PROFESSIONAL', 'MINIMAL'].includes(template)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Template must be MODERN, PROFESSIONAL, or MINIMAL.' },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is currently unavailable.' },
    });
    return;
  }

  try {
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resume not found.' },
      });
      return;
    }

    if (resume.studentId.toString() !== req.user.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to modify this resume.' },
      });
      return;
    }

    if (isDefault) {
      await Resume.updateMany(
        { studentId: resume.studentId, _id: { $ne: resume._id } },
        { isDefault: false }
      );
    }

    if (title !== undefined && title.trim().length >= 2) resume.title = title.trim();
    if (template !== undefined) resume.template = template;
    if (structuredContent !== undefined) resume.structuredContent = structuredContent;
    if (isDefault !== undefined) resume.isDefault = Boolean(isDefault);

    await resume.save();

    res.status(200).json({
      success: true,
      data: resume.toSafeObject(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update resume.',
        details: error instanceof Error ? error.message : undefined,
      },
    });
  }
};

export const deleteResume = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only students can delete resumes.' },
    });
    return;
  }

  const resumeId = String(req.params.resumeId);
  if (!mongoose.Types.ObjectId.isValid(resumeId)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid resume ID format.' },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is currently unavailable.' },
    });
    return;
  }

  try {
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resume not found.' },
      });
      return;
    }

    if (resume.studentId.toString() !== req.user.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to delete this resume.' },
      });
      return;
    }

    await Resume.findByIdAndDelete(resumeId);

    res.status(200).json({
      success: true,
      data: { message: 'Resume deleted successfully.', resumeId },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete resume.',
        details: error instanceof Error ? error.message : undefined,
      },
    });
  }
};

export const downloadResumePdf = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only students can download their resumes.' },
    });
    return;
  }

  const resumeId = String(req.params.resumeId);
  if (!mongoose.Types.ObjectId.isValid(resumeId)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid resume ID format.' },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is currently unavailable.' },
    });
    return;
  }

  try {
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resume not found.' },
      });
      return;
    }

    if (resume.studentId.toString() !== req.user.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to download this resume.' },
      });
      return;
    }

    const pdfBuffer = await generateResumePdf(resume.toSafeObject());

    const safeFilename = `${resume.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_v${resume.version}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate PDF resume.',
        details: error instanceof Error ? error.message : undefined,
      },
    });
  }
};

export const downloadEmployerCandidateResume = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only employers can download candidate resumes.' },
    });
    return;
  }

  const applicationId = String(req.params.applicationId);
  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid application ID format.' },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is currently unavailable.' },
    });
    return;
  }

  try {
    const application = await PlacementApplication.findById(applicationId);
    if (!application) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Candidate application not found.' },
      });
      return;
    }

    // Verify employer owns the drive for this application
    const drive = await PlacementDrive.findById(application.driveId);
    if (!drive || (drive.employerId?.toString() !== req.user.sub && drive.createdBy?.toString() !== req.user.sub)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to view candidates for this placement drive.' },
      });
      return;
    }

    const studentUser = await User.findById(application.studentId);
    if (!studentUser) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Candidate student record not found.' },
      });
      return;
    }

    // Attempt to find default resume or create structured content on the fly from studentProfile
    const defaultResume = await Resume.findOne({ studentId: studentUser._id, isDefault: true }) ||
      await Resume.findOne({ studentId: studentUser._id }).sort({ updatedAt: -1 });

    let resumeData: ResumeData;

    if (defaultResume) {
      resumeData = defaultResume.toSafeObject();
    } else {
      const sp = studentUser.studentProfile || {};
      const structuredContent: ResumeStructuredContent = {
        personalInfo: {
          fullName: studentUser.fullName,
          email: studentUser.email,
          location: sp.preferredWorkLocation?.[0] || 'Pan-India',
          headline: sp.headline || sp.course || 'Career Candidate',
          githubUrl: sp.githubUrl,
          linkedinUrl: sp.linkedinUrl,
          portfolioUrl: sp.portfolioUrl,
          summary: sp.careerObjective || 'Aspiring professional seeking impactful roles.',
        },
        education: sp.educationHistory && sp.educationHistory.length > 0
          ? sp.educationHistory
          : [
              {
                institution: sp.collegeName || 'Accredited Institution',
                degree: sp.course || 'Bachelor Degree',
                graduationYear: sp.graduationYear,
                cgpa: sp.cgpa,
              },
            ],
        technicalSkills: sp.technicalSkills || sp.skills || [],
        softSkills: sp.softSkills || [],
        projects: (sp.projects || []).filter((p) => p.visibility === 'PUBLIC'),
        experience: sp.internships || sp.workExperience || [],
        certifications: sp.certifications || [],
        achievements: sp.achievements || [],
      };

      resumeData = {
        id: `auto_${studentUser._id}`,
        studentId: studentUser._id.toString(),
        title: `${studentUser.fullName}_Resume`,
        template: 'MODERN',
        structuredContent,
        version: 1,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const pdfBuffer = await generateResumePdf(resumeData);
    const safeFilename = `${studentUser.fullName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Resume.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate candidate resume.',
        details: error instanceof Error ? error.message : undefined,
      },
    });
  }
};
