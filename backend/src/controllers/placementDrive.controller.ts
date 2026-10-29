import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { PlacementDrive } from '../models/placementDrive.model.js';
import { PlacementApplication } from '../models/placementApplication.model.js';
import { Cohort } from '../models/cohort.model.js';
import { User } from '../models/user.model.js';
import { getDbStatus } from '../config/db.js';
import { evaluateEligibility } from '../services/eligibility.service.js';
import { OpportunityType, WorkMode, DriveStatus } from '../types/index.js';

const VALID_OPPORTUNITY_TYPES: OpportunityType[] = ['JOB', 'INTERNSHIP', 'APPRENTICESHIP'];
const VALID_WORK_MODES: WorkMode[] = ['ONSITE', 'REMOTE', 'HYBRID'];

export const createDrive = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'COLLEGE') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only authorized colleges can create placement drives.' },
    });
    return;
  }

  const {
    title,
    description,
    organizationName,
    opportunityType,
    workMode = 'ONSITE',
    location = 'Pan-India',
    eligibleCourses = [],
    eligibleGraduationYears = [],
    requiredSkills = [],
    applicationDeadline,
    driveDate,
    cohortIds = [],
  } = req.body;

  // Validation
  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Title is required (minimum 3 characters).' },
    });
    return;
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Description is required.' },
    });
    return;
  }

  if (!organizationName || typeof organizationName !== 'string' || organizationName.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Hiring organization name is required.' },
    });
    return;
  }

  if (!opportunityType || !VALID_OPPORTUNITY_TYPES.includes(opportunityType as OpportunityType)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Opportunity type must be one of: ${VALID_OPPORTUNITY_TYPES.join(', ')}.`,
      },
    });
    return;
  }

  if (workMode && !VALID_WORK_MODES.includes(workMode as WorkMode)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Work mode must be one of: ${VALID_WORK_MODES.join(', ')}.`,
      },
    });
    return;
  }

  if (!applicationDeadline) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Application deadline is required.' },
    });
    return;
  }

  const deadlineParsed = new Date(applicationDeadline);
  if (isNaN(deadlineParsed.getTime())) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Application deadline must be a valid date format.' },
    });
    return;
  }

  if (cohortIds && Array.isArray(cohortIds)) {
    for (const cId of cohortIds) {
      if (!mongoose.Types.ObjectId.isValid(cId)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `Invalid cohort ID format: ${cId}` },
        });
        return;
      }
    }
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
    const collegeObjectId = new mongoose.Types.ObjectId(req.user.sub);

    // Verify cohorts belong to this college
    const validCohortObjectIds: mongoose.Types.ObjectId[] = [];
    if (Array.isArray(cohortIds) && cohortIds.length > 0) {
      const existingCohorts = await Cohort.find({
        _id: { $in: cohortIds.map((id) => new mongoose.Types.ObjectId(id)) },
        collegeId: collegeObjectId,
      });

      if (existingCohorts.length !== cohortIds.length) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_COHORTS',
            message: 'One or more selected cohorts do not belong to your college or do not exist.',
          },
        });
        return;
      }
      validCohortObjectIds.push(...existingCohorts.map((c) => c._id as mongoose.Types.ObjectId));
    }

    const drive = new PlacementDrive({
      title: title.trim(),
      description: description.trim(),
      organizationName: organizationName.trim(),
      collegeId: collegeObjectId,
      createdBy: collegeObjectId,
      opportunityType,
      workMode,
      location: typeof location === 'string' ? location.trim() : 'Pan-India',
      eligibleCourses: Array.isArray(eligibleCourses) ? eligibleCourses.map((c) => String(c).trim()).filter(Boolean) : [],
      eligibleGraduationYears: Array.isArray(eligibleGraduationYears)
        ? eligibleGraduationYears.map((y) => Number(y)).filter((y) => !isNaN(y) && y >= 1980 && y <= 2040)
        : [],
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills.map((s) => String(s).trim()).filter(Boolean) : [],
      applicationDeadline: deadlineParsed,
      driveDate: driveDate ? new Date(driveDate) : undefined,
      status: 'DRAFT',
      cohortIds: validCohortObjectIds,
    });

    await drive.save();

    res.status(201).json({
      success: true,
      data: drive.toSafeObject(0),
    });
  } catch (error) {
    console.error('[PlacementDrive Error] Failed to create drive:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to create placement drive.' },
    });
  }
};

export const listDrives = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
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
    if (req.user.role === 'COLLEGE') {
      const query: Record<string, unknown> = {
        collegeId: new mongoose.Types.ObjectId(req.user.sub),
      };

      if (req.query.status && ['DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED'].includes(req.query.status as string)) {
        query.status = req.query.status;
      }

      const drives = await PlacementDrive.find(query).sort({ createdAt: -1 });

      // Aggregate application counts for college
      const driveIds = drives.map((d) => d._id);
      const appCounts = await PlacementApplication.aggregate([
        { $match: { driveId: { $in: driveIds } } },
        { $group: { _id: '$driveId', count: { $sum: 1 } } },
      ]);

      const countMap = new Map<string, number>();
      appCounts.forEach((ac) => {
        countMap.set(ac._id.toString(), ac.count);
      });

      res.status(200).json({
        success: true,
        data: drives.map((d) => d.toSafeObject(countMap.get(d._id.toString()) || 0)),
      });
      return;
    }

    if (req.user.role === 'STUDENT') {
      // Students see only PUBLISHED drives
      const studentUser = await User.findById(req.user.sub);
      if (!studentUser) {
        res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'Student account not found.' },
        });
        return;
      }

      // Find cohorts student belongs to
      const studentCohorts = await Cohort.find({
        studentIds: studentUser._id,
        status: 'ACTIVE',
      }).select('_id');
      const studentCohortIds = studentCohorts.map((c) => c._id);

      // Student sees published drives that either:
      // 1. Have no cohort restrictions (open to all students of the college or general)
      // 2. Are targeted to a cohort the student is part of
      const query = {
        status: 'PUBLISHED',
        $or: [
          { cohortIds: { $exists: false } },
          { cohortIds: { $size: 0 } },
          { cohortIds: { $in: studentCohortIds } },
        ],
      };

      const drives = await PlacementDrive.find(query).sort({ applicationDeadline: 1 });

      res.status(200).json({
        success: true,
        data: drives.map((d) => d.toSafeObject()),
      });
      return;
    }

    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Employers cannot browse college placement drives.' },
    });
  } catch (error) {
    console.error('[PlacementDrive Error] Failed to list drives:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve placement drives.' },
    });
  }
};

export const getDriveById = async (req: Request, res: Response): Promise<void> => {
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

    // Role-based authorization
    if (req.user?.role === 'COLLEGE') {
      if (drive.collegeId.toString() !== req.user.sub) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You do not have access to placement drives of another college.' },
        });
        return;
      }
      const appCount = await PlacementApplication.countDocuments({ driveId: drive._id });
      res.status(200).json({
        success: true,
        data: drive.toSafeObject(appCount),
      });
      return;
    }

    if (req.user?.role === 'STUDENT') {
      if (drive.status !== 'PUBLISHED') {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'This placement drive is not open for viewing.' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: drive.toSafeObject(),
      });
      return;
    }

    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied.' },
    });
  } catch (error) {
    console.error('[PlacementDrive Error] Failed to get drive:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve drive details.' },
    });
  }
};

export const updateDrive = async (req: Request, res: Response): Promise<void> => {
  const driveId = req.params.driveId as string;

  if (!mongoose.Types.ObjectId.isValid(driveId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid placement drive ID format.' },
    });
    return;
  }

  // Reject tampering with ownership, creator, or status via generic patch
  if ('collegeId' in req.body || 'createdBy' in req.body || '_id' in req.body || 'status' in req.body) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PROTECTED_FIELD_MODIFICATION',
        message: 'Cannot modify ownership, creator, or status via standard update. Use dedicated workflow actions.',
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
    const drive = await PlacementDrive.findById(driveId);
    if (!drive) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Placement drive not found.' },
      });
      return;
    }

    if (drive.collegeId.toString() !== req.user?.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only update drives created by your college.' },
      });
      return;
    }

    if (drive.status === 'CLOSED' || drive.status === 'CANCELLED') {
      res.status(400).json({
        success: false,
        error: { code: 'DRIVE_FINALIZED', message: `Cannot edit a drive that has been ${drive.status.toLowerCase()}.` },
      });
      return;
    }

    const {
      title,
      description,
      organizationName,
      opportunityType,
      workMode,
      location,
      eligibleCourses,
      eligibleGraduationYears,
      requiredSkills,
      applicationDeadline,
      driveDate,
      cohortIds,
    } = req.body;

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length < 3) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Title must be at least 3 characters.' },
        });
        return;
      }
      drive.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Description cannot be empty.' },
        });
        return;
      }
      drive.description = description.trim();
    }

    if (organizationName !== undefined) {
      drive.organizationName = organizationName.trim();
    }

    if (opportunityType !== undefined) {
      if (!VALID_OPPORTUNITY_TYPES.includes(opportunityType)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `Invalid opportunity type: ${opportunityType}` },
        });
        return;
      }
      drive.opportunityType = opportunityType;
    }

    if (workMode !== undefined) {
      if (!VALID_WORK_MODES.includes(workMode)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `Invalid work mode: ${workMode}` },
        });
        return;
      }
      drive.workMode = workMode;
    }

    if (location !== undefined) {
      drive.location = typeof location === 'string' ? location.trim() : 'Pan-India';
    }

    if (eligibleCourses !== undefined && Array.isArray(eligibleCourses)) {
      drive.eligibleCourses = eligibleCourses.map((c) => String(c).trim()).filter(Boolean);
    }

    if (eligibleGraduationYears !== undefined && Array.isArray(eligibleGraduationYears)) {
      drive.eligibleGraduationYears = eligibleGraduationYears
        .map((y) => Number(y))
        .filter((y) => !isNaN(y) && y >= 1980 && y <= 2040);
    }

    if (requiredSkills !== undefined && Array.isArray(requiredSkills)) {
      drive.requiredSkills = requiredSkills.map((s) => String(s).trim()).filter(Boolean);
    }

    if (applicationDeadline !== undefined) {
      const parsedDeadline = new Date(applicationDeadline);
      if (isNaN(parsedDeadline.getTime())) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid application deadline format.' },
        });
        return;
      }
      drive.applicationDeadline = parsedDeadline;
    }

    if (driveDate !== undefined) {
      drive.driveDate = driveDate ? new Date(driveDate) : undefined;
    }

    if (cohortIds !== undefined && Array.isArray(cohortIds)) {
      for (const cId of cohortIds) {
        if (!mongoose.Types.ObjectId.isValid(cId)) {
          res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: `Invalid cohort ID: ${cId}` },
          });
          return;
        }
      }
      const existingCohorts = await Cohort.find({
        _id: { $in: cohortIds.map((id) => new mongoose.Types.ObjectId(id)) },
        collegeId: drive.collegeId,
      });
      drive.cohortIds = existingCohorts.map((c) => c._id as mongoose.Types.ObjectId);
    }

    await drive.save();

    res.status(200).json({
      success: true,
      data: drive.toSafeObject(),
    });
  } catch (error) {
    console.error('[PlacementDrive Error] Failed to update drive:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to update placement drive.' },
    });
  }
};

export const publishDrive = async (req: Request, res: Response): Promise<void> => {
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

    if (drive.collegeId.toString() !== req.user?.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only publish drives created by your college.' },
      });
      return;
    }

    if (drive.status !== 'DRAFT') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Only DRAFT drives can be published. Current status is ${drive.status}.`,
        },
      });
      return;
    }

    // Check application deadline is strictly in future before publishing
    if (new Date(drive.applicationDeadline) <= new Date()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'EXPIRED_DEADLINE',
          message: 'Cannot publish a placement drive whose application deadline has already passed.',
        },
      });
      return;
    }

    drive.status = 'PUBLISHED';
    await drive.save();

    res.status(200).json({
      success: true,
      data: drive.toSafeObject(),
    });
  } catch (error) {
    console.error('[PlacementDrive Error] Failed to publish drive:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to publish placement drive.' },
    });
  }
};

export const closeDrive = async (req: Request, res: Response): Promise<void> => {
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

    if (drive.collegeId.toString() !== req.user?.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only close drives created by your college.' },
      });
      return;
    }

    if (drive.status !== 'PUBLISHED') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Only PUBLISHED drives can be closed. Current status is ${drive.status}.`,
        },
      });
      return;
    }

    drive.status = 'CLOSED';
    await drive.save();

    res.status(200).json({
      success: true,
      data: drive.toSafeObject(),
    });
  } catch (error) {
    console.error('[PlacementDrive Error] Failed to close drive:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to close placement drive.' },
    });
  }
};

export const cancelDrive = async (req: Request, res: Response): Promise<void> => {
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

    if (drive.collegeId.toString() !== req.user?.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only cancel drives created by your college.' },
      });
      return;
    }

    if (drive.status === 'CLOSED' || drive.status === 'CANCELLED') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Drive is already ${drive.status.toLowerCase()} and cannot be cancelled.`,
        },
      });
      return;
    }

    drive.status = 'CANCELLED';
    await drive.save();

    res.status(200).json({
      success: true,
      data: drive.toSafeObject(),
    });
  } catch (error) {
    console.error('[PlacementDrive Error] Failed to cancel drive:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to cancel placement drive.' },
    });
  }
};

export const checkDriveEligibility = async (req: Request, res: Response): Promise<void> => {
  const driveId = req.params.driveId as string;

  if (!req.user || req.user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only students can evaluate drive eligibility.' },
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

    const studentUser = await User.findById(req.user.sub);
    if (!studentUser) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Student account not found.' },
      });
      return;
    }

    // Check cohorts student is enrolled in
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

    res.status(200).json({
      success: true,
      data: {
        drive: drive.toSafeObject(),
        eligibility: eligibilityResult,
      },
    });
  } catch (error) {
    console.error('[PlacementDrive Error] Failed to evaluate eligibility:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to evaluate eligibility.' },
    });
  }
};
