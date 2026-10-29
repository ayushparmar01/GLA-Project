import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { PlacementApplication } from '../models/placementApplication.model.js';
import { PlacementDrive } from '../models/placementDrive.model.js';
import { Cohort } from '../models/cohort.model.js';
import { User } from '../models/user.model.js';
import { getDbStatus } from '../config/db.js';
import { evaluateEligibility } from '../services/eligibility.service.js';
import { ApplicationStatus } from '../types/index.js';

const ALLOWED_COLLEGE_STATUSES: ApplicationStatus[] = ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED'];

export const applyToDrive = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only students can apply to placement drives.' },
    });
    return;
  }

  const driveId = req.params.driveId as string;

  if (!mongoose.Types.ObjectId.isValid(driveId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid placement drive ID format.' },
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
        error: { code: 'NOT_FOUND', message: 'Placement drive not found.' },
      });
      return;
    }

    if (drive.status !== 'PUBLISHED') {
      res.status(400).json({
        success: false,
        error: {
          code: 'DRIVE_NOT_OPEN',
          message: `This placement drive is currently in ${drive.status} status and not accepting applications.`,
        },
      });
      return;
    }

    if (new Date() > new Date(drive.applicationDeadline)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'DEADLINE_PASSED',
          message: 'The application deadline for this drive has already passed.',
        },
      });
      return;
    }

    const studentUser = await User.findById(req.user.sub);
    if (!studentUser) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Student profile not found.' },
      });
      return;
    }

    // Server-side eligibility verification
    const studentCohorts = await Cohort.find({
      studentIds: studentUser._id,
      status: 'ACTIVE',
    }).select('_id');
    const studentCohortIds = studentCohorts.map((c) => c._id.toString());

    const eligibilityResult = evaluateEligibility({
      driveStatus: drive.status,
      applicationDeadline: drive.applicationDeadline,
      driveCohortIds: Array.isArray(drive.cohortIds) ? drive.cohortIds.map((id) => id.toString()) : [],
      eligibleCourses: drive.eligibleCourses,
      eligibleGraduationYears: drive.eligibleGraduationYears,
      requiredSkills: drive.requiredSkills,
      studentProfile: studentUser.studentProfile,
      studentEnrolledCohortIds: studentCohortIds,
    });

    if (!eligibilityResult.eligible) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INELIGIBLE',
          message: 'You do not meet the eligibility criteria for this placement drive.',
          details: eligibilityResult.reasons,
          missingRequirements: eligibilityResult.missingRequirements,
        },
      });
      return;
    }

    // Check duplicate application
    const existingApp = await PlacementApplication.findOne({
      driveId: drive._id,
      studentId: studentUser._id,
    });

    if (existingApp) {
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_APPLICATION',
          message: 'You have already submitted an application for this placement drive.',
        },
      });
      return;
    }

    const application = new PlacementApplication({
      driveId: drive._id,
      studentId: studentUser._id,
      collegeId: drive.collegeId,
      status: 'APPLIED',
      appliedAt: new Date(),
      statusHistory: [
        {
          fromStatus: 'APPLIED',
          toStatus: 'APPLIED',
          changedBy: studentUser._id,
          changedAt: new Date(),
          note: 'Application submitted by student.',
        },
      ],
    });

    await application.save();

    res.status(201).json({
      success: true,
      data: application.toSafeObject(drive.toSafeObject()),
    });
  } catch (error: unknown) {
    console.error('[Application Error] Failed to submit application:', error);
    // MongoDB duplicate key error (code 11000) safety net
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: number }).code === 11000) {
      res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_APPLICATION', message: 'You have already applied to this drive.' },
      });
      return;
    }

    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to record application.' },
    });
  }
};

export const listMyApplications = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only students can view their application history.' },
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
    const applications = await PlacementApplication.find({
      studentId: new mongoose.Types.ObjectId(req.user.sub),
    }).sort({ appliedAt: -1 });

    const driveIds = applications.map((a) => a.driveId);
    const drives = await PlacementDrive.find({ _id: { $in: driveIds } });
    const driveMap = new Map<string, ReturnType<typeof drives[0]['toSafeObject']>>();
    drives.forEach((d) => {
      driveMap.set(d._id.toString(), d.toSafeObject());
    });

    res.status(200).json({
      success: true,
      data: applications.map((app) =>
        app.toSafeObject(driveMap.get(app.driveId.toString()))
      ),
    });
  } catch (error) {
    console.error('[Application Error] Failed to list applications:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve applications.' },
    });
  }
};

export const listDriveApplications = async (req: Request, res: Response): Promise<void> => {
  const driveId = req.params.driveId as string;

  if (!req.user || req.user.role !== 'COLLEGE') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only college administrators can view drive candidates.' },
    });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(driveId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid placement drive ID format.' },
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
        error: { code: 'NOT_FOUND', message: 'Placement drive not found.' },
      });
      return;
    }

    if (drive.collegeId.toString() !== req.user.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only view applications for drives owned by your college.' },
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
    console.error('[Application Error] Failed to list drive applications:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve drive candidates.' },
    });
  }
};

export const updateApplicationStatus = async (req: Request, res: Response): Promise<void> => {
  const applicationId = req.params.applicationId as string;
  const { status, note } = req.body;

  if (!req.user || req.user.role !== 'COLLEGE') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only colleges can update candidate statuses.' },
    });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid application ID format.' },
    });
    return;
  }

  if (!status || !ALLOWED_COLLEGE_STATUSES.includes(status as ApplicationStatus)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Status must be one of: ${ALLOWED_COLLEGE_STATUSES.join(', ')}.`,
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

    if (application.collegeId.toString() !== req.user.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only review applications for your own college drives.' },
      });
      return;
    }

    const currentStatus = application.status;

    // Enforce workflow transition rules
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

    // Allowed transitions:
    // APPLIED -> SHORTLISTED | REJECTED
    // SHORTLISTED -> INTERVIEW_SCHEDULED | REJECTED
    // INTERVIEW_SCHEDULED -> SELECTED | REJECTED
    // REJECTED -> cannot transition further (or vice versa)
    const validTransitions: Record<string, string[]> = {
      APPLIED: ['SHORTLISTED', 'REJECTED'],
      SHORTLISTED: ['INTERVIEW_SCHEDULED', 'REJECTED'],
      INTERVIEW_SCHEDULED: ['SELECTED', 'REJECTED'],
      REJECTED: ['SHORTLISTED'], // Permitted reconsider
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

    application.status = status as ApplicationStatus;
    application.statusHistory.push({
      fromStatus: currentStatus,
      toStatus: status as ApplicationStatus,
      changedBy: new mongoose.Types.ObjectId(req.user.sub),
      changedAt: new Date(),
      note: typeof note === 'string' ? note.trim().substring(0, 300) : undefined,
    });

    await application.save();

    res.status(200).json({
      success: true,
      data: application.toSafeObject(),
    });
  } catch (error) {
    console.error('[Application Error] Failed to update application status:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to update application status.' },
    });
  }
};

export const withdrawApplication = async (req: Request, res: Response): Promise<void> => {
  const applicationId = req.params.applicationId as string;

  if (!req.user || req.user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only students can withdraw their applications.' },
    });
    return;
  }

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

    if (application.studentId.toString() !== req.user.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only withdraw your own applications.' },
      });
      return;
    }

    if (application.status !== 'APPLIED') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Cannot withdraw application once it has advanced to ${application.status}.`,
        },
      });
      return;
    }

    application.status = 'WITHDRAWN';
    application.statusHistory.push({
      fromStatus: 'APPLIED',
      toStatus: 'WITHDRAWN',
      changedBy: new mongoose.Types.ObjectId(req.user.sub),
      changedAt: new Date(),
      note: 'Withdrawn by student.',
    });

    await application.save();

    res.status(200).json({
      success: true,
      data: application.toSafeObject(),
    });
  } catch (error) {
    console.error('[Application Error] Failed to withdraw application:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to withdraw application.' },
    });
  }
};
