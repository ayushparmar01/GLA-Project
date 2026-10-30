import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { PlacementApplication } from '../models/placementApplication.model.js';
import { PlacementDrive } from '../models/placementDrive.model.js';
import { User } from '../models/user.model.js';
import { getDbStatus } from '../config/db.js';
import { ApplicationStatus } from '../types/index.js';

const ALLOWED_EMPLOYER_STATUSES: ApplicationStatus[] = [
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'SELECTED',
  'REJECTED',
];

export const listEmployerApplications = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only employers can view applicant candidate submissions.' },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently offline.' },
    });
    return;
  }

  try {
    const employerObjectId = new mongoose.Types.ObjectId(req.user.sub);

    // Find all opportunities owned by this employer
    const opportunities = await PlacementDrive.find({
      $or: [{ employerId: employerObjectId }, { createdBy: employerObjectId }],
    });

    const driveIds = opportunities.map((d) => d._id);
    if (driveIds.length === 0) {
      res.status(200).json({
        success: true,
        data: [],
      });
      return;
    }

    const applications = await PlacementApplication.find({
      driveId: { $in: driveIds },
    }).sort({ appliedAt: -1 });

    const studentIds = applications.map((a) => a.studentId);
    const students = await User.find({ _id: { $in: studentIds } })
      .select('fullName email studentProfile preferredLanguage createdAt')
      .lean();

    const studentMap = new Map<string, {
      id: string;
      fullName: string;
      email: string;
      role: 'STUDENT';
      preferredLanguage: string;
      studentProfile?: {
        course?: string;
        educationLevel?: string;
        graduationYear?: number;
        skills?: string[];
        profileCompletionScore?: number;
      };
      createdAt: string;
      updatedAt: string;
    }>();

    students.forEach((s) => {
      studentMap.set(s._id.toString(), {
        id: s._id.toString(),
        fullName: s.fullName,
        email: s.email,
        role: 'STUDENT',
        preferredLanguage: s.preferredLanguage || 'en',
        studentProfile: s.studentProfile
          ? {
              course: s.studentProfile.course,
              educationLevel: s.studentProfile.educationLevel,
              graduationYear: s.studentProfile.graduationYear,
              skills: s.studentProfile.skills,
              profileCompletionScore: s.studentProfile.profileCompletionScore,
            }
          : undefined,
        createdAt: s.createdAt ? s.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: s.createdAt ? s.createdAt.toISOString() : new Date().toISOString(),
      });
    });

    const driveMap = new Map<string, ReturnType<typeof opportunities[0]['toSafeObject']>>();
    opportunities.forEach((d) => driveMap.set(d._id.toString(), d.toSafeObject()));

    res.status(200).json({
      success: true,
      data: applications.map((app) =>
        app.toSafeObject(
          driveMap.get(app.driveId.toString()),
          studentMap.get(app.studentId.toString())
        )
      ),
    });
  } catch (error) {
    console.error('[EmployerApplication Error] Failed to list applications:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve applications.' },
    });
  }
};

export const listOpportunityApplications = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only employers can view candidates for recruitment opportunities.' },
    });
    return;
  }

  const driveId = req.params.driveId as string;
  if (!mongoose.Types.ObjectId.isValid(driveId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid opportunity ID format.' },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently offline.' },
    });
    return;
  }

  try {
    const drive = await PlacementDrive.findById(driveId);
    if (!drive) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Opportunity not found.' },
      });
      return;
    }

    const isOwner =
      (drive.employerId && drive.employerId.toString() === req.user.sub) ||
      drive.createdBy.toString() === req.user.sub;

    if (!isOwner) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only view applications for your company\'s opportunities.' },
      });
      return;
    }

    const applications = await PlacementApplication.find({ driveId: drive._id }).sort({ appliedAt: -1 });
    const studentIds = applications.map((a) => a.studentId);
    const students = await User.find({ _id: { $in: studentIds } })
      .select('fullName email studentProfile preferredLanguage createdAt')
      .lean();

    const studentMap = new Map<string, {
      id: string;
      fullName: string;
      email: string;
      role: 'STUDENT';
      preferredLanguage: string;
      studentProfile?: {
        course?: string;
        educationLevel?: string;
        graduationYear?: number;
        skills?: string[];
        profileCompletionScore?: number;
      };
      createdAt: string;
      updatedAt: string;
    }>();

    students.forEach((s) => {
      studentMap.set(s._id.toString(), {
        id: s._id.toString(),
        fullName: s.fullName,
        email: s.email,
        role: 'STUDENT',
        preferredLanguage: s.preferredLanguage || 'en',
        studentProfile: s.studentProfile
          ? {
              course: s.studentProfile.course,
              educationLevel: s.studentProfile.educationLevel,
              graduationYear: s.studentProfile.graduationYear,
              skills: s.studentProfile.skills,
              profileCompletionScore: s.studentProfile.profileCompletionScore,
            }
          : undefined,
        createdAt: s.createdAt ? s.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: s.createdAt ? s.createdAt.toISOString() : new Date().toISOString(),
      });
    });

    res.status(200).json({
      success: true,
      data: {
        drive: drive.toSafeObject(applications.length),
        applications: applications.map((app) =>
          app.toSafeObject(undefined, studentMap.get(app.studentId.toString()))
        ),
      },
    });
  } catch (error) {
    console.error('[EmployerApplication Error] Failed to list drive applications:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve candidates.' },
    });
  }
};

export const getEmployerApplicationById = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only employers can view application details.' },
    });
    return;
  }

  const applicationId = req.params.applicationId as string;
  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid application ID format.' },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently offline.' },
    });
    return;
  }

  try {
    const application = await PlacementApplication.findById(applicationId);
    if (!application) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Application not found.' },
      });
      return;
    }

    const drive = await PlacementDrive.findById(application.driveId);
    if (!drive) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Associated opportunity not found.' },
      });
      return;
    }

    const isOwner =
      (drive.employerId && drive.employerId.toString() === req.user.sub) ||
      drive.createdBy.toString() === req.user.sub;

    if (!isOwner) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You cannot view applications for opportunities belonging to another employer.' },
      });
      return;
    }

    const student = await User.findById(application.studentId)
      .select('fullName email studentProfile preferredLanguage createdAt')
      .lean();

    res.status(200).json({
      success: true,
      data: application.toSafeObject(
        drive.toSafeObject(),
        student
          ? {
              id: student._id.toString(),
              fullName: student.fullName,
              email: student.email,
              role: 'STUDENT',
              preferredLanguage: student.preferredLanguage || 'en',
              studentProfile: student.studentProfile,
              createdAt: student.createdAt ? student.createdAt.toISOString() : new Date().toISOString(),
              updatedAt: student.createdAt ? student.createdAt.toISOString() : new Date().toISOString(),
            }
          : undefined
      ),
    });
  } catch (error) {
    console.error('[EmployerApplication Error] Failed to get application:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve application details.' },
    });
  }
};

export const updateApplicationStatusByEmployer = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only employers can update candidate status for their opportunities.' },
    });
    return;
  }

  const applicationId = req.params.applicationId as string;
  const { status, note, reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid application ID format.' },
    });
    return;
  }

  if (!status || !ALLOWED_EMPLOYER_STATUSES.includes(status as ApplicationStatus)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Status must be one of: ${ALLOWED_EMPLOYER_STATUSES.join(', ')}.`,
      },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently offline.' },
    });
    return;
  }

  try {
    const application = await PlacementApplication.findById(applicationId);
    if (!application) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Application record not found.' },
      });
      return;
    }

    const drive = await PlacementDrive.findById(application.driveId);
    if (!drive) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Associated opportunity not found.' },
      });
      return;
    }

    const isOwner =
      (drive.employerId && drive.employerId.toString() === req.user.sub) ||
      drive.createdBy.toString() === req.user.sub;

    if (!isOwner) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only update candidates for your own company\'s opportunities.' },
      });
      return;
    }

    const currentStatus = application.status;

    // Reject tampering with withdrawn applications
    if (currentStatus === 'WITHDRAWN') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS_TRANSITION', message: 'Cannot modify an application that was withdrawn by the student.' },
      });
      return;
    }

    if (currentStatus === 'SELECTED') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS_TRANSITION', message: 'Candidate has already been selected.' },
      });
      return;
    }

    // Permitted transitions:
    // APPLIED -> SHORTLISTED | REJECTED
    // SHORTLISTED -> INTERVIEW_SCHEDULED | REJECTED
    // INTERVIEW_SCHEDULED -> SELECTED | REJECTED
    // REJECTED -> SHORTLISTED (reconsider)
    const validTransitions: Record<string, string[]> = {
      APPLIED: ['SHORTLISTED', 'REJECTED'],
      SHORTLISTED: ['INTERVIEW_SCHEDULED', 'REJECTED'],
      INTERVIEW_SCHEDULED: ['SELECTED', 'REJECTED'],
      REJECTED: ['SHORTLISTED'],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(status)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Cannot transition application status from ${currentStatus} to ${status}.`,
        },
      });
      return;
    }

    const auditNote = typeof note === 'string' ? note.trim() : typeof reason === 'string' ? reason.trim() : undefined;

    application.status = status as ApplicationStatus;
    application.statusHistory.push({
      fromStatus: currentStatus,
      toStatus: status as ApplicationStatus,
      changedBy: new mongoose.Types.ObjectId(req.user.sub),
      changedAt: new Date(),
      note: auditNote ? auditNote.substring(0, 300) : undefined,
    });

    await application.save();

    res.status(200).json({
      success: true,
      data: application.toSafeObject(),
    });
  } catch (error) {
    console.error('[EmployerApplication Error] Failed to update application status:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to update candidate status.' },
    });
  }
};
