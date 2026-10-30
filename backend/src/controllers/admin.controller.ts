import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { EmployerProfile } from '../models/employerProfile.model.js';
import { Cohort } from '../models/cohort.model.js';
import { PlacementDrive } from '../models/placementDrive.model.js';
import { AuditLog } from '../models/auditLog.model.js';
import { ModerationItem } from '../models/moderationItem.model.js';
import { AdminAnalyticsService } from '../services/adminAnalytics.service.js';
import { AuditLoggerService } from '../services/auditLogger.service.js';
import { getDbStatus } from '../config/db.js';
import { Role } from '../types/index.js';

export const getDashboardMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await AdminAnalyticsService.getDashboardMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('[AdminController] Dashboard metrics failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve administrative dashboard metrics.' },
    });
  }
};

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const role = req.query.role as Role | undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const query: Record<string, any> = {};

    if (role && ['STUDENT', 'EMPLOYER', 'COLLEGE', 'ADMIN'].includes(role)) {
      query.role = role;
    }

    if (status === 'suspended') {
      query.isSuspended = true;
    } else if (status === 'active') {
      query.isSuspended = { $ne: true };
      query.isActive = true;
    }

    if (search && search.trim().length > 0) {
      const sanitized = search.trim();
      query.$or = [
        { fullName: { $regex: sanitized, $options: 'i' } },
        { email: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      User.countDocuments(query).exec(),
    ]);

    res.json({
      success: true,
      data: {
        users: users.map((u) => u.toSafeObject()),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('[AdminController] List users failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to list platform users.' },
    });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid user ID format.' },
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User account not found.' },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    console.error('[AdminController] Get user failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch user profile.' },
    });
  }
};

export const suspendUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid user ID format.' },
      });
      return;
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'A valid suspension reason is required.' },
      });
      return;
    }

    // Prevent admin from suspending themselves
    if (req.user?.userId === userId) {
      res.status(400).json({
        success: false,
        error: { code: 'SELF_SUSPENSION_PROHIBITED', message: 'Administrators cannot suspend their own account.' },
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Target user account not found.' },
      });
      return;
    }

    user.isSuspended = true;
    user.suspensionReason = reason.trim();
    user.suspendedAt = new Date();
    user.suspendedBy = new mongoose.Types.ObjectId(req.user!.userId);
    await user.save();

    await AuditLoggerService.log({
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      action: 'SUSPEND_USER',
      resourceType: 'USER',
      resourceId: userId,
      reason: reason.trim(),
      metadata: { targetUserEmail: user.email, targetRole: user.role },
    });

    res.json({
      success: true,
      data: {
        user: user.toSafeObject(),
        message: 'User account suspended successfully.',
      },
    });
  } catch (error) {
    console.error('[AdminController] Suspend user failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to suspend user account.' },
    });
  }
};

export const reactivateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid user ID format.' },
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Target user account not found.' },
      });
      return;
    }

    user.isSuspended = false;
    user.suspensionReason = undefined;
    user.suspendedAt = undefined;
    user.suspendedBy = undefined;
    await user.save();

    await AuditLoggerService.log({
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      action: 'REACTIVATE_USER',
      resourceType: 'USER',
      resourceId: userId,
      reason: 'Administrative reactivation',
      metadata: { targetUserEmail: user.email, targetRole: user.role },
    });

    res.json({
      success: true,
      data: {
        user: user.toSafeObject(),
        message: 'User account reactivated successfully.',
      },
    });
  } catch (error) {
    console.error('[AdminController] Reactivate user failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to reactivate user account.' },
    });
  }
};

export const listPendingEmployers = async (req: Request, res: Response): Promise<void> => {
  try {
    const pendingProfiles = await EmployerProfile.find({ verificationStatus: 'PENDING' })
      .populate('userId', 'fullName email phoneNumber createdAt')
      .sort({ createdAt: -1 })
      .exec();

    res.json({
      success: true,
      data: {
        employers: pendingProfiles.map((p) => p.toSafeObject()),
      },
    });
  } catch (error) {
    console.error('[AdminController] List pending employers failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to list pending employer verifications.' },
    });
  }
};

export const verifyEmployer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employerId } = req.params;
    const { notes } = req.body || {};

    let profile = null;
    if (mongoose.Types.ObjectId.isValid(employerId)) {
      profile = await EmployerProfile.findOne({
        $or: [{ _id: employerId }, { userId: employerId }],
      });
    }

    if (!profile) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Employer profile not found.' },
      });
      return;
    }

    profile.verified = true;
    profile.verificationStatus = 'VERIFIED';
    profile.verifiedAt = new Date();
    profile.verifiedBy = new mongoose.Types.ObjectId(req.user!.userId);
    if (notes) profile.verificationNotes = notes;
    await profile.save();

    await AuditLoggerService.log({
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      action: 'VERIFY_EMPLOYER',
      resourceType: 'EMPLOYER',
      resourceId: profile._id.toString(),
      reason: notes || 'Company credentials verified by administrator',
      metadata: { companyName: profile.companyName, employerUserId: profile.userId.toString() },
    });

    res.json({
      success: true,
      data: {
        profile: profile.toSafeObject(),
        message: 'Employer verified successfully.',
      },
    });
  } catch (error) {
    console.error('[AdminController] Verify employer failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to verify employer.' },
    });
  }
};

export const rejectEmployer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employerId } = req.params;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Rejection reason is required.' },
      });
      return;
    }

    let profile = null;
    if (mongoose.Types.ObjectId.isValid(employerId)) {
      profile = await EmployerProfile.findOne({
        $or: [{ _id: employerId }, { userId: employerId }],
      });
    }

    if (!profile) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Employer profile not found.' },
      });
      return;
    }

    profile.verified = false;
    profile.verificationStatus = 'REJECTED';
    profile.verificationNotes = reason.trim();
    profile.verifiedAt = new Date();
    profile.verifiedBy = new mongoose.Types.ObjectId(req.user!.userId);
    await profile.save();

    await AuditLoggerService.log({
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      action: 'REJECT_EMPLOYER',
      resourceType: 'EMPLOYER',
      resourceId: profile._id.toString(),
      reason: reason.trim(),
      metadata: { companyName: profile.companyName, employerUserId: profile.userId.toString() },
    });

    res.json({
      success: true,
      data: {
        profile: profile.toSafeObject(),
        message: 'Employer verification rejected.',
      },
    });
  } catch (error) {
    console.error('[AdminController] Reject employer failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to reject employer verification.' },
    });
  }
};

export const listColleges = async (req: Request, res: Response): Promise<void> => {
  try {
    const colleges = await User.find({ role: 'COLLEGE' }).sort({ createdAt: -1 }).exec();

    const collegeSummaries = await Promise.all(
      colleges.map(async (college) => {
        const [cohortCount, driveCount] = await Promise.all([
          Cohort.countDocuments({ collegeId: college._id }).exec(),
          PlacementDrive.countDocuments({ collegeId: college._id }).exec(),
        ]);

        return {
          ...college.toSafeObject(),
          stats: {
            cohortCount,
            driveCount,
          },
        };
      })
    );

    res.json({
      success: true,
      data: {
        colleges: collegeSummaries,
      },
    });
  } catch (error) {
    console.error('[AdminController] List colleges failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to list registered colleges.' },
    });
  }
};

export const verifyCollege = async (req: Request, res: Response): Promise<void> => {
  try {
    const { collegeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(collegeId)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid college ID format.' },
      });
      return;
    }

    const college = await User.findOne({ _id: collegeId, role: 'COLLEGE' });
    if (!college) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'College account not found.' },
      });
      return;
    }

    if (!college.collegeProfile) {
      college.collegeProfile = {};
    }
    college.collegeProfile.verified = true;
    college.collegeProfile.verifiedAt = new Date().toISOString();
    college.collegeProfile.verifiedBy = req.user!.userId;
    await college.save();

    await AuditLoggerService.log({
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      action: 'VERIFY_COLLEGE',
      resourceType: 'COLLEGE',
      resourceId: collegeId,
      reason: 'College institutional credentials verified',
      metadata: { institutionName: college.collegeProfile.institutionName },
    });

    res.json({
      success: true,
      data: {
        college: college.toSafeObject(),
        message: 'College institution verified successfully.',
      },
    });
  } catch (error) {
    console.error('[AdminController] Verify college failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to verify college account.' },
    });
  }
};

export const listModerationItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const targetType = req.query.targetType as string | undefined;

    const query: Record<string, any> = {};
    if (status) query.status = status;
    if (targetType) query.targetType = targetType;

    const items = await ModerationItem.find(query).sort({ createdAt: -1 }).limit(100).exec();

    res.json({
      success: true,
      data: {
        items: items.map((i) => i.toSafeObject()),
      },
    });
  } catch (error) {
    console.error('[AdminController] List moderation items failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to list moderation queue.' },
    });
  }
};

export const createModerationItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetType, targetId, targetTitle, reason } = req.body;

    if (!targetType || !targetId || !reason) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'targetType, targetId, and reason are required.' },
      });
      return;
    }

    const item = await ModerationItem.create({
      targetType,
      targetId,
      targetTitle,
      reason,
      flaggedBy: req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : undefined,
      flaggedByName: req.user?.email || 'System / User Report',
      status: 'PENDING',
    });

    res.status(201).json({
      success: true,
      data: {
        item: item.toSafeObject(),
      },
    });
  } catch (error) {
    console.error('[AdminController] Create moderation item failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to report item for moderation.' },
    });
  }
};

export const reviewModerationItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid moderation item ID format.' },
      });
      return;
    }

    const validStatuses = ['APPROVED', 'REJECTED', 'DISMISSED', 'ACTION_TAKEN'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `Status must be one of: ${validStatuses.join(', ')}` },
      });
      return;
    }

    const item = await ModerationItem.findById(id);
    if (!item) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Moderation item not found.' },
      });
      return;
    }

    item.status = status;
    item.moderatorNotes = notes || '';
    item.reviewedBy = new mongoose.Types.ObjectId(req.user!.userId);
    item.reviewedAt = new Date();
    await item.save();

    await AuditLoggerService.log({
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      action: 'REVIEW_MODERATION',
      resourceType: 'MODERATION',
      resourceId: id,
      reason: notes || `Moderation status updated to ${status}`,
      metadata: { targetType: item.targetType, targetId: item.targetId, status },
    });

    res.json({
      success: true,
      data: {
        item: item.toSafeObject(),
        message: 'Moderation item reviewed successfully.',
      },
    });
  } catch (error) {
    console.error('[AdminController] Review moderation item failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to review moderation item.' },
    });
  }
};

export const getPlatformAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const analytics = await AdminAnalyticsService.getPlatformAnalytics();
    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('[AdminController] Get platform analytics failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to generate platform analytics report.' },
    });
  }
};

export const getPlacementReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const analytics = await AdminAnalyticsService.getPlatformAnalytics();
    res.json({
      success: true,
      data: {
        applicationFunnel: analytics.applicationFunnel,
        transparentPlacementOutcomes: analytics.transparentPlacementOutcomes,
        opportunityCategories: analytics.opportunityCategories,
        topSkillsInDemand: analytics.topSkillsInDemand,
      },
    });
  } catch (error) {
    console.error('[AdminController] Get placement reports failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to compile placement reports.' },
    });
  }
};

export const listAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const action = req.query.action as string | undefined;
    const resourceType = req.query.resourceType as string | undefined;

    const query: Record<string, any> = {};
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      AuditLog.countDocuments(query).exec(),
    ]);

    res.json({
      success: true,
      data: {
        logs: logs.map((l) => l.toSafeObject()),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('[AdminController] List audit logs failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to query system audit logs.' },
    });
  }
};

export const getSystemHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const health = AdminAnalyticsService.getSystemHealthDiagnostics();
    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    console.error('[AdminController] Get system health failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to run administrative system health diagnostics.' },
    });
  }
};
