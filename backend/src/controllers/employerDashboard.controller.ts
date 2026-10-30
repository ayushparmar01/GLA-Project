import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { PlacementDrive } from '../models/placementDrive.model.js';
import { PlacementApplication } from '../models/placementApplication.model.js';
import { EmployerProfile } from '../models/employerProfile.model.js';
import { getDbStatus } from '../config/db.js';
import { EmployerDashboardStatsData, VerificationStatus } from '../types/index.js';

export const getEmployerDashboard = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only authenticated employers can access the employer dashboard.' },
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

    // Fetch employer's profile, opportunities, and applications in parallel
    const [profile, opportunities] = await Promise.all([
      EmployerProfile.findOne({ userId: employerObjectId }),
      PlacementDrive.find({
        $or: [{ employerId: employerObjectId }, { createdBy: employerObjectId }],
      }).sort({ createdAt: -1 }),
    ]);

    const totalOpportunities = opportunities.length;
    const draftOpportunities = opportunities.filter((o) => o.status === 'DRAFT' || o.status === 'PENDING_APPROVAL').length;
    const publishedOpportunities = opportunities.filter((o) => o.status === 'PUBLISHED').length;

    const driveIds = opportunities.map((o) => o._id);

    // Fetch applications received for these opportunities
    let totalApplications = 0;
    let shortlistedCandidates = 0;
    let interviewStageCandidates = 0;
    let selectedCandidates = 0;
    let recentApplications: ReturnType<typeof PlacementApplication.prototype.toSafeObject>[] = [];

    if (driveIds.length > 0) {
      const applications = await PlacementApplication.find({
        driveId: { $in: driveIds },
      }).sort({ appliedAt: -1 });

      totalApplications = applications.length;
      shortlistedCandidates = applications.filter((a) => a.status === 'SHORTLISTED').length;
      interviewStageCandidates = applications.filter((a) => a.status === 'INTERVIEW_SCHEDULED').length;
      selectedCandidates = applications.filter((a) => a.status === 'SELECTED').length;

      // Populate drive details for recent applications
      const driveMap = new Map<string, ReturnType<typeof PlacementDrive.prototype.toSafeObject>>();
      opportunities.forEach((d) => driveMap.set(d._id.toString(), d.toSafeObject()));

      recentApplications = applications.slice(0, 5).map((app) =>
        app.toSafeObject(driveMap.get(app.driveId.toString()))
      );
    }

    // Calculate real profile completion percentage based on validated fields
    let profileCompletionScore = 0;
    let verificationStatus: VerificationStatus = 'PENDING';
    let verified = false;

    if (profile) {
      let completedFields = 0;
      const totalFields = 8;
      if (profile.companyName) completedFields++;
      if (profile.companyDescription) completedFields++;
      if (profile.companyWebsite) completedFields++;
      if (profile.industry) completedFields++;
      if (profile.companySize) completedFields++;
      if (profile.headquarters) completedFields++;
      if (profile.contactPerson) completedFields++;
      if (profile.designation) completedFields++;

      profileCompletionScore = Math.round((completedFields / totalFields) * 100);
      verificationStatus = profile.verificationStatus;
      verified = profile.verified;
    }

    const data: EmployerDashboardStatsData = {
      totalOpportunities,
      draftOpportunities,
      publishedOpportunities,
      totalApplications,
      shortlistedCandidates,
      interviewStageCandidates,
      selectedCandidates,
      recentOpportunities: opportunities.slice(0, 5).map((o) => o.toSafeObject()),
      recentApplications,
      profileCompletionScore,
      verificationStatus,
      verified,
    };

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[EmployerDashboard Error] Failed to aggregate metrics:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to aggregate employer dashboard metrics.' },
    });
  }
};
