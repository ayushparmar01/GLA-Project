import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { PlacementDrive } from '../models/placementDrive.model.js';
import { PlacementApplication } from '../models/placementApplication.model.js';
import { getDbStatus } from '../config/db.js';
import { OpportunityType, WorkMode } from '../types/index.js';

const VALID_OPPORTUNITY_TYPES: OpportunityType[] = ['JOB', 'INTERNSHIP', 'APPRENTICESHIP'];
const VALID_WORK_MODES: WorkMode[] = ['ONSITE', 'REMOTE', 'HYBRID'];

export const createEmployerOpportunity = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only registered employers can post placement opportunities.' },
    });
    return;
  }

  const {
    jobTitle,
    title,
    companyName,
    organizationName,
    jobDescription,
    description,
    opportunityType,
    workMode = 'ONSITE',
    jobLocation,
    location = 'Pan-India',
    requiredSkills = [],
    preferredSkills = [],
    minimumQualification,
    eligibleCourses = [],
    eligibleGraduationYears = [],
    minimumCGPA,
    salaryRange,
    internshipDuration,
    numberOfOpenings,
    applicationDeadline,
    recruitmentProcess = [],
  } = req.body;

  const actualTitle = (jobTitle || title || '').trim();
  const actualOrg = (companyName || organizationName || 'Company').trim();
  const actualDesc = (jobDescription || description || '').trim();
  const actualLocation = (jobLocation || location || 'Pan-India').trim();

  if (!actualTitle) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Title is required.' },
    });
    return;
  }

  if (actualTitle.length < 3) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Title must be at least 3 characters.' },
    });
    return;
  }

  if (!actualDesc || actualDesc.length === 0) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Description is required.' },
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

  if (deadlineParsed.getTime() <= Date.now()) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Application deadline must be in the future.' },
    });
    return;
  }

  if (minimumCGPA !== undefined && (typeof minimumCGPA !== 'number' || minimumCGPA < 0 || minimumCGPA > 10)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Minimum CGPA must be a number between 0 and 10.' },
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

    const drive = new PlacementDrive({
      title: actualTitle,
      organizationName: actualOrg,
      description: actualDesc,
      opportunityType,
      workMode,
      location: actualLocation,
      employerId: employerObjectId,
      createdBy: employerObjectId,
      eligibleCourses: Array.isArray(eligibleCourses) ? eligibleCourses.map((c) => String(c).trim()).filter(Boolean) : [],
      eligibleGraduationYears: Array.isArray(eligibleGraduationYears)
        ? eligibleGraduationYears.map((y) => Number(y)).filter((y) => !isNaN(y) && y >= 1980 && y <= 2040)
        : [],
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills.map((s) => String(s).trim()).filter(Boolean) : [],
      preferredSkills: Array.isArray(preferredSkills) ? preferredSkills.map((s) => String(s).trim()).filter(Boolean) : [],
      minimumQualification: minimumQualification ? String(minimumQualification).trim() : undefined,
      minimumCGPA: typeof minimumCGPA === 'number' ? minimumCGPA : undefined,
      salaryRange: salaryRange ? String(salaryRange).trim() : undefined,
      internshipDuration: internshipDuration ? String(internshipDuration).trim() : undefined,
      numberOfOpenings: typeof numberOfOpenings === 'number' && numberOfOpenings > 0 ? numberOfOpenings : undefined,
      recruitmentProcess: Array.isArray(recruitmentProcess) ? recruitmentProcess.map((p) => String(p).trim()).filter(Boolean) : [],
      applicationDeadline: deadlineParsed,
      status: 'DRAFT',
    });

    await drive.save();

    res.status(201).json({
      success: true,
      data: drive.toSafeObject(0),
    });
  } catch (error) {
    console.error('[EmployerOpportunity Error] Failed to create opportunity:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to create placement opportunity.' },
    });
  }
};

export const listEmployerOpportunities = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only employers can view their recruitment opportunities.' },
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
    const query: Record<string, unknown> = {
      $or: [{ employerId: employerObjectId }, { createdBy: employerObjectId }],
    };

    if (req.query.status && ['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'CLOSED', 'CANCELLED'].includes(req.query.status as string)) {
      query.status = req.query.status;
    }

    const drives = await PlacementDrive.find(query).sort({ createdAt: -1 });
    const driveIds = drives.map((d) => d._id);

    const appCounts = await PlacementApplication.aggregate([
      { $match: { driveId: { $in: driveIds } } },
      { $group: { _id: '$driveId', count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
    appCounts.forEach((ac) => countMap.set(ac._id.toString(), ac.count));

    res.status(200).json({
      success: true,
      data: drives.map((d) => d.toSafeObject(countMap.get(d._id.toString()) || 0)),
    });
  } catch (error) {
    console.error('[EmployerOpportunity Error] Failed to list opportunities:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve employer opportunities.' },
    });
  }
};

export const getEmployerOpportunityById = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only employers can view detailed opportunity data.' },
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

    // Ownership check: must belong to this employer
    const isOwner =
      (drive.employerId && drive.employerId.toString() === req.user.sub) ||
      drive.createdBy.toString() === req.user.sub;

    if (!isOwner) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to access another company\'s opportunity.' },
      });
      return;
    }

    const appCount = await PlacementApplication.countDocuments({ driveId: drive._id });

    res.status(200).json({
      success: true,
      data: drive.toSafeObject(appCount),
    });
  } catch (error) {
    console.error('[EmployerOpportunity Error] Failed to get opportunity:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve opportunity details.' },
    });
  }
};

export const updateEmployerOpportunity = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only employers can modify their opportunities.' },
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

  // Reject tampering with ownership, creator, or status via generic update
  if ('employerId' in req.body || 'createdBy' in req.body || 'collegeId' in req.body || 'status' in req.body || '_id' in req.body) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PROTECTED_FIELD_MODIFICATION',
        message: 'Cannot modify ownership, creator, or status via generic update. Use dedicated lifecycle actions.',
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
        error: { code: 'FORBIDDEN', message: 'You cannot update an opportunity belonging to another company.' },
      });
      return;
    }

    if (drive.status === 'CLOSED' || drive.status === 'CANCELLED') {
      res.status(400).json({
        success: false,
        error: { code: 'DRIVE_FINALIZED', message: `Cannot modify an opportunity that is ${drive.status.toLowerCase()}.` },
      });
      return;
    }

    const {
      jobTitle,
      title,
      companyName,
      organizationName,
      jobDescription,
      description,
      opportunityType,
      workMode,
      jobLocation,
      location,
      requiredSkills,
      preferredSkills,
      minimumQualification,
      eligibleCourses,
      eligibleGraduationYears,
      minimumCGPA,
      salaryRange,
      internshipDuration,
      numberOfOpenings,
      applicationDeadline,
      recruitmentProcess,
    } = req.body;

    const newTitle = jobTitle || title;
    if (newTitle !== undefined) {
      if (typeof newTitle !== 'string' || newTitle.trim().length < 3) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Job title must be at least 3 characters.' },
        });
        return;
      }
      drive.title = newTitle.trim();
    }

    const newOrg = companyName || organizationName;
    if (newOrg !== undefined) drive.organizationName = String(newOrg).trim();

    const newDesc = jobDescription || description;
    if (newDesc !== undefined) drive.description = String(newDesc).trim();

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

    const newLoc = jobLocation || location;
    if (newLoc !== undefined) drive.location = String(newLoc).trim();

    if (requiredSkills !== undefined && Array.isArray(requiredSkills)) {
      drive.requiredSkills = requiredSkills.map((s) => String(s).trim()).filter(Boolean);
    }

    if (preferredSkills !== undefined && Array.isArray(preferredSkills)) {
      drive.preferredSkills = preferredSkills.map((s) => String(s).trim()).filter(Boolean);
    }

    if (minimumQualification !== undefined) {
      drive.minimumQualification = minimumQualification ? String(minimumQualification).trim() : undefined;
    }

    if (eligibleCourses !== undefined && Array.isArray(eligibleCourses)) {
      drive.eligibleCourses = eligibleCourses.map((c) => String(c).trim()).filter(Boolean);
    }

    if (eligibleGraduationYears !== undefined && Array.isArray(eligibleGraduationYears)) {
      drive.eligibleGraduationYears = eligibleGraduationYears
        .map((y) => Number(y))
        .filter((y) => !isNaN(y) && y >= 1980 && y <= 2040);
    }

    if (minimumCGPA !== undefined) {
      if (typeof minimumCGPA !== 'number' || minimumCGPA < 0 || minimumCGPA > 10) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Minimum CGPA must be a number between 0 and 10.' },
        });
        return;
      }
      drive.minimumCGPA = minimumCGPA;
    }

    if (salaryRange !== undefined) drive.salaryRange = salaryRange ? String(salaryRange).trim() : undefined;
    if (internshipDuration !== undefined) drive.internshipDuration = internshipDuration ? String(internshipDuration).trim() : undefined;
    if (numberOfOpenings !== undefined) drive.numberOfOpenings = Number(numberOfOpenings) || undefined;

    if (recruitmentProcess !== undefined && Array.isArray(recruitmentProcess)) {
      drive.recruitmentProcess = recruitmentProcess.map((p) => String(p).trim()).filter(Boolean);
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

    await drive.save();

    res.status(200).json({
      success: true,
      data: drive.toSafeObject(),
    });
  } catch (error) {
    console.error('[EmployerOpportunity Error] Failed to update opportunity:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to update opportunity.' },
    });
  }
};

export const publishEmployerOpportunity = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only employers can publish their opportunities.' },
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
        error: { code: 'FORBIDDEN', message: 'You can only publish opportunities created by your organization.' },
      });
      return;
    }

    if (drive.status !== 'DRAFT' && drive.status !== 'PENDING_APPROVAL') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Only DRAFT opportunities can be published. Current status is ${drive.status}.`,
        },
      });
      return;
    }

    // Check application deadline is in the future
    if (new Date(drive.applicationDeadline) <= new Date()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'EXPIRED_DEADLINE',
          message: 'Cannot publish an opportunity whose application deadline has already passed.',
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
    console.error('[EmployerOpportunity Error] Failed to publish opportunity:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to publish opportunity.' },
    });
  }
};

export const closeEmployerOpportunity = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only employers can close their opportunities.' },
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
        error: { code: 'FORBIDDEN', message: 'You can only close opportunities belonging to your organization.' },
      });
      return;
    }

    if (drive.status !== 'PUBLISHED') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Only PUBLISHED opportunities can be closed. Current status is ${drive.status}.`,
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
    console.error('[EmployerOpportunity Error] Failed to close opportunity:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to close opportunity.' },
    });
  }
};

export const cancelEmployerOpportunity = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only employers can cancel their opportunities.' },
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
        error: { code: 'FORBIDDEN', message: 'You can only cancel opportunities belonging to your organization.' },
      });
      return;
    }

    if (drive.status === 'CLOSED' || drive.status === 'CANCELLED') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Opportunity is already ${drive.status.toLowerCase()} and cannot be cancelled.`,
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
    console.error('[EmployerOpportunity Error] Failed to cancel opportunity:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to cancel opportunity.' },
    });
  }
};

export const listPublicOpportunities = async (req: Request, res: Response): Promise<void> => {
  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently offline.' },
    });
    return;
  }

  try {
    // Only published opportunities
    const opportunities = await PlacementDrive.find({ status: 'PUBLISHED' }).sort({ applicationDeadline: 1 });

    res.status(200).json({
      success: true,
      data: opportunities.map((d) => d.toSafeObject()),
    });
  } catch (error) {
    console.error('[PublicOpportunities Error] Failed to list opportunities:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve public opportunities.' },
    });
  }
};

export const getPublicOpportunityById = async (req: Request, res: Response): Promise<void> => {
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

    if (drive.status !== 'PUBLISHED') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'This opportunity is not open for public viewing.' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: drive.toSafeObject(),
    });
  } catch (error) {
    console.error('[PublicOpportunity Error] Failed to get opportunity:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve opportunity.' },
    });
  }
};
