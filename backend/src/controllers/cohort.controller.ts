import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Cohort } from '../models/cohort.model.js';
import { User } from '../models/user.model.js';
import { getDbStatus } from '../config/db.js';

export const createCohort = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'COLLEGE') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only authorized college administrators can create cohorts.' },
    });
    return;
  }

  const { name, description, academicYear, course, graduationYear } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Cohort name is required (minimum 2 characters).' },
    });
    return;
  }

  if (graduationYear !== undefined && (typeof graduationYear !== 'number' || graduationYear < 1980 || graduationYear > 2040)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Graduation year must be a valid year between 1980 and 2040.' },
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
    const cohort = new Cohort({
      name: name.trim().substring(0, 100),
      description: typeof description === 'string' ? description.trim().substring(0, 500) : undefined,
      collegeId: new mongoose.Types.ObjectId(req.user.sub),
      academicYear: typeof academicYear === 'string' ? academicYear.trim().substring(0, 20) : undefined,
      course: typeof course === 'string' ? course.trim().substring(0, 100) : undefined,
      graduationYear: typeof graduationYear === 'number' ? graduationYear : undefined,
      status: 'ACTIVE',
      studentIds: [],
    });

    await cohort.save();

    res.status(201).json({
      success: true,
      data: cohort.toSafeObject(),
    });
  } catch (error) {
    console.error('[Cohort Error] Failed to create cohort:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to create cohort in database.' },
    });
  }
};

export const listCohorts = async (req: Request, res: Response): Promise<void> => {
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
    const query: Record<string, unknown> = {};

    if (req.user.role === 'COLLEGE') {
      query.collegeId = new mongoose.Types.ObjectId(req.user.sub);
      if (req.query.status && ['ACTIVE', 'ARCHIVED'].includes(req.query.status as string)) {
        query.status = req.query.status;
      }
    } else if (req.user.role === 'STUDENT') {
      // Students only see cohorts where they are enrolled members
      query.studentIds = new mongoose.Types.ObjectId(req.user.sub);
      query.status = 'ACTIVE';
    } else {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Employers cannot access college cohort lists.' },
      });
      return;
    }

    const cohorts = await Cohort.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: cohorts.map((c) => c.toSafeObject()),
    });
  } catch (error) {
    console.error('[Cohort Error] Failed to list cohorts:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve cohorts.' },
    });
  }
};

export const getCohortById = async (req: Request, res: Response): Promise<void> => {
  const cohortId = req.params.cohortId as string;

  if (!mongoose.Types.ObjectId.isValid(cohortId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid cohort ID format.' },
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
    const cohort = await Cohort.findById(cohortId);
    if (!cohort) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cohort not found.' },
      });
      return;
    }

    // Ownership check: College must own it OR student must be enrolled in it
    const isOwner = req.user?.role === 'COLLEGE' && cohort.collegeId.toString() === req.user.sub;
    const isMember = req.user?.role === 'STUDENT' && cohort.studentIds.some((id) => id.toString() === req.user?.sub);

    if (!isOwner && !isMember) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to view this cohort.' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: cohort.toSafeObject(),
    });
  } catch (error) {
    console.error('[Cohort Error] Failed to get cohort:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve cohort details.' },
    });
  }
};

export const updateCohort = async (req: Request, res: Response): Promise<void> => {
  const cohortId = req.params.cohortId as string;

  if (!mongoose.Types.ObjectId.isValid(cohortId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid cohort ID format.' },
    });
    return;
  }

  // Reject attempts to modify ownership or membership via generic update
  if ('collegeId' in req.body || 'studentIds' in req.body || '_id' in req.body) {
    res.status(400).json({
      success: false,
      error: { code: 'PROTECTED_FIELD_MODIFICATION', message: 'Cannot modify collegeId or studentIds directly.' },
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
    const cohort = await Cohort.findById(cohortId);
    if (!cohort) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cohort not found.' },
      });
      return;
    }

    if (cohort.collegeId.toString() !== req.user?.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only update cohorts created by your college.' },
      });
      return;
    }

    const { name, description, academicYear, course, graduationYear } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Cohort name must be at least 2 characters.' },
        });
        return;
      }
      cohort.name = name.trim().substring(0, 100);
    }

    if (description !== undefined) {
      cohort.description = typeof description === 'string' ? description.trim().substring(0, 500) : undefined;
    }

    if (academicYear !== undefined) {
      cohort.academicYear = typeof academicYear === 'string' ? academicYear.trim().substring(0, 20) : undefined;
    }

    if (course !== undefined) {
      cohort.course = typeof course === 'string' ? course.trim().substring(0, 100) : undefined;
    }

    if (graduationYear !== undefined) {
      if (typeof graduationYear !== 'number' || graduationYear < 1980 || graduationYear > 2040) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Graduation year must be between 1980 and 2040.' },
        });
        return;
      }
      cohort.graduationYear = graduationYear;
    }

    await cohort.save();

    res.status(200).json({
      success: true,
      data: cohort.toSafeObject(),
    });
  } catch (error) {
    console.error('[Cohort Error] Failed to update cohort:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to update cohort.' },
    });
  }
};

export const archiveCohort = async (req: Request, res: Response): Promise<void> => {
  const cohortId = req.params.cohortId as string;

  if (!mongoose.Types.ObjectId.isValid(cohortId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid cohort ID format.' },
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
    const cohort = await Cohort.findById(cohortId);
    if (!cohort) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cohort not found.' },
      });
      return;
    }

    if (cohort.collegeId.toString() !== req.user?.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only archive cohorts owned by your institution.' },
      });
      return;
    }

    cohort.status = 'ARCHIVED';
    await cohort.save();

    res.status(200).json({
      success: true,
      data: cohort.toSafeObject(),
    });
  } catch (error) {
    console.error('[Cohort Error] Failed to archive cohort:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to archive cohort.' },
    });
  }
};

export const listCohortStudents = async (req: Request, res: Response): Promise<void> => {
  const cohortId = req.params.cohortId as string;

  if (!mongoose.Types.ObjectId.isValid(cohortId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid cohort ID format.' },
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
    const cohort = await Cohort.findById(cohortId);
    if (!cohort) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cohort not found.' },
      });
      return;
    }

    if (cohort.collegeId.toString() !== req.user?.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only view members of cohorts owned by your college.' },
      });
      return;
    }

    // Populate students safely (strictly omit phone numbers from cohort list view for student privacy)
    const students = await User.find({ _id: { $in: cohort.studentIds } })
      .select('fullName email studentProfile preferredLanguage createdAt')
      .lean();

    const safeStudents = students.map((s) => ({
      id: s._id.toString(),
      fullName: s.fullName,
      email: s.email,
      course: s.studentProfile?.course || 'Not Specified',
      educationLevel: s.studentProfile?.educationLevel || 'Undergraduate',
      graduationYear: s.studentProfile?.graduationYear,
      skills: s.studentProfile?.skills || [],
      profileCompletionScore: s.studentProfile?.profileCompletionScore || 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        cohort: cohort.toSafeObject(),
        students: safeStudents,
      },
    });
  } catch (error) {
    console.error('[Cohort Error] Failed to list students:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve cohort students.' },
    });
  }
};

export const enrollStudent = async (req: Request, res: Response): Promise<void> => {
  const cohortId = req.params.cohortId as string;
  const { email } = req.body;

  if (!mongoose.Types.ObjectId.isValid(cohortId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid cohort ID format.' },
    });
    return;
  }

  if (!email || typeof email !== 'string') {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Student email is required for enrollment.' },
    });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service is currently offline.' },
    });
    return;
  }

  try {
    const cohort = await Cohort.findById(cohortId);
    if (!cohort) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cohort not found.' },
      });
      return;
    }

    if (cohort.collegeId.toString() !== req.user?.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only enroll students into cohorts owned by your institution.' },
      });
      return;
    }

    if (cohort.status === 'ARCHIVED') {
      res.status(400).json({
        success: false,
        error: { code: 'COHORT_ARCHIVED', message: 'Archived cohorts cannot accept new student memberships.' },
      });
      return;
    }

    // Resolve student user
    const studentUser = await User.findOne({ email: normalizedEmail });
    if (!studentUser) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: `No registered account found with email: ${normalizedEmail}` },
      });
      return;
    }

    if (studentUser.role !== 'STUDENT') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ROLE', message: `Account with email ${normalizedEmail} is an ${studentUser.role}, not a STUDENT.` },
      });
      return;
    }

    // Check duplicate membership
    const studentObjectId = studentUser._id as mongoose.Types.ObjectId;
    const isAlreadyMember = cohort.studentIds.some((id) => id.toString() === studentObjectId.toString());
    if (isAlreadyMember) {
      res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_MEMBERSHIP', message: 'This student is already enrolled in this cohort.' },
      });
      return;
    }

    cohort.studentIds.push(studentObjectId);
    await cohort.save();

    res.status(200).json({
      success: true,
      data: {
        cohort: cohort.toSafeObject(),
        enrolledStudent: {
          id: studentUser._id.toString(),
          fullName: studentUser.fullName,
          email: studentUser.email,
        },
      },
    });
  } catch (error) {
    console.error('[Cohort Error] Failed to enroll student:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to enroll student into cohort.' },
    });
  }
};

export const removeStudent = async (req: Request, res: Response): Promise<void> => {
  const cohortId = req.params.cohortId as string;
  const studentId = req.params.studentId as string;

  if (!mongoose.Types.ObjectId.isValid(cohortId) || !mongoose.Types.ObjectId.isValid(studentId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid cohort or student ID format.' },
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
    const cohort = await Cohort.findById(cohortId);
    if (!cohort) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cohort not found.' },
      });
      return;
    }

    if (cohort.collegeId.toString() !== req.user?.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only remove students from cohorts owned by your institution.' },
      });
      return;
    }

    cohort.studentIds = cohort.studentIds.filter((id) => id.toString() !== studentId);
    await cohort.save();

    res.status(200).json({
      success: true,
      data: cohort.toSafeObject(),
    });
  } catch (error) {
    console.error('[Cohort Error] Failed to remove student:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to remove student from cohort.' },
    });
  }
};
