import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Cohort } from '../models/cohort.model.js';
import { PlacementDrive } from '../models/placementDrive.model.js';
import { PlacementApplication } from '../models/placementApplication.model.js';
import { getDbStatus } from '../config/db.js';
import { CollegeStatsData } from '../types/index.js';

export const getCollegeStats = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'COLLEGE') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only colleges can view institutional placement statistics.' },
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
    const collegeId = new mongoose.Types.ObjectId(req.user.sub);

    const [
      cohorts,
      drives,
      applications,
    ] = await Promise.all([
      Cohort.find({ collegeId }).sort({ createdAt: -1 }),
      PlacementDrive.find({ collegeId }).sort({ createdAt: -1 }),
      PlacementApplication.find({ collegeId }),
    ]);

    const totalCohorts = cohorts.length;
    const activeCohorts = cohorts.filter((c) => c.status === 'ACTIVE').length;

    // Collect unique enrolled students across all college cohorts
    const uniqueStudentIdSet = new Set<string>();
    cohorts.forEach((cohort) => {
      cohort.studentIds.forEach((sId) => uniqueStudentIdSet.add(sId.toString()));
    });
    const totalStudentsEnrolled = uniqueStudentIdSet.size;

    const totalDrives = drives.length;
    const publishedDrives = drives.filter((d) => d.status === 'PUBLISHED').length;
    const totalApplications = applications.length;

    const stats: CollegeStatsData = {
      totalCohorts,
      activeCohorts,
      totalStudentsEnrolled,
      totalDrives,
      publishedDrives,
      totalApplications,
      recentCohorts: cohorts.slice(0, 5).map((c) => c.toSafeObject()),
      recentDrives: drives.slice(0, 5).map((d) => d.toSafeObject()),
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[CollegeStats Error] Failed to compute stats:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve college placement statistics.' },
    });
  }
};
