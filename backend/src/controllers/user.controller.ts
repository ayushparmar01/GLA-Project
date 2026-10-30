import { Request, Response } from 'express';
import { User } from '../models/user.model.js';
import { getDbStatus } from '../config/db.js';

export const SUPPORTED_LANGUAGES = ['en', 'hi', 'hi-Latn', 'ta', 'kn'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const updateMe = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required to update profile.',
      },
    });
    return;
  }

  // Security Check 1: Explicit rejection of role modification / privilege escalation
  if ('role' in req.body && req.body.role !== req.user.role) {
    res.status(400).json({
      success: false,
      error: {
        code: 'ROLE_MODIFICATION_PROHIBITED',
        message: 'Account role modification is strictly prohibited. You cannot change your role.',
      },
    });
    return;
  }

  // Security Check 2: Reject attempts to modify immutable identity fields
  if ('email' in req.body || '_id' in req.body || 'id' in req.body || 'passwordHash' in req.body || 'isActive' in req.body) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PROTECTED_FIELD_MODIFICATION',
        message: 'Email, ID, password hash, and active status cannot be modified via profile update.',
      },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is currently offline. Cannot update user profile.',
      },
    });
    return;
  }

  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found.',
        },
      });
      return;
    }

    const updates = req.body;

    // Strict allowlist updates for general fields
    if (typeof updates.fullName === 'string' && updates.fullName.trim().length >= 2) {
      user.fullName = updates.fullName.trim().substring(0, 100);
    }

    if (typeof updates.preferredLanguage === 'string') {
      const lang = updates.preferredLanguage.trim();
      if ((SUPPORTED_LANGUAGES as readonly string[]).includes(lang)) {
        user.preferredLanguage = lang;
      }
    }

    if (typeof updates.phoneNumber === 'string') {
      user.phoneNumber = updates.phoneNumber.trim().substring(0, 20);
    }

    // Role-specific allowlist updates
    if (user.role === 'STUDENT' && updates.studentProfile && typeof updates.studentProfile === 'object') {
      const sp = updates.studentProfile;
      if (!user.studentProfile) {
        user.studentProfile = {};
      }

      if (typeof sp.educationLevel === 'string') user.studentProfile.educationLevel = sp.educationLevel.trim().substring(0, 50);
      if (typeof sp.collegeName === 'string') user.studentProfile.collegeName = sp.collegeName.trim().substring(0, 120);
      if (typeof sp.course === 'string') user.studentProfile.course = sp.course.trim().substring(0, 100);
      if (typeof sp.graduationYear === 'number' && sp.graduationYear >= 1980 && sp.graduationYear <= 2040) {
        user.studentProfile.graduationYear = sp.graduationYear;
      }
      if (Array.isArray(sp.skills)) {
        user.studentProfile.skills = sp.skills
          .filter((s: unknown) => typeof s === 'string' && s.trim().length > 0)
          .map((s: string) => s.trim().substring(0, 40))
          .slice(0, 50);
      }
      if (Array.isArray(sp.careerInterests)) {
        user.studentProfile.careerInterests = sp.careerInterests
          .filter((s: unknown) => typeof s === 'string' && s.trim().length > 0)
          .map((s: string) => s.trim().substring(0, 60))
          .slice(0, 30);
      }
      if (Array.isArray(sp.preferredWorkLocation)) {
        user.studentProfile.preferredWorkLocation = sp.preferredWorkLocation
          .filter((s: unknown) => typeof s === 'string' && s.trim().length > 0)
          .map((s: string) => s.trim().substring(0, 60))
          .slice(0, 20);
      }

      // Automatically recalculate profile completion score
      user.studentProfile.profileCompletionScore = user.calculateStudentScore();
    }

    if (user.role === 'EMPLOYER' && updates.employerProfile && typeof updates.employerProfile === 'object') {
      const ep = updates.employerProfile;
      if (!user.employerProfile) {
        user.employerProfile = {};
      }

      if (typeof ep.organizationName === 'string') user.employerProfile.organizationName = ep.organizationName.trim().substring(0, 120);
      if (typeof ep.industry === 'string') user.employerProfile.industry = ep.industry.trim().substring(0, 80);
      if (typeof ep.organizationLocation === 'string') user.employerProfile.organizationLocation = ep.organizationLocation.trim().substring(0, 100);
      if (typeof ep.organizationDescription === 'string') user.employerProfile.organizationDescription = ep.organizationDescription.trim().substring(0, 1000);
      if (Array.isArray(ep.hiringInterests)) {
        user.employerProfile.hiringInterests = ep.hiringInterests
          .filter((s: unknown) => typeof s === 'string' && s.trim().length > 0)
          .map((s: string) => s.trim().substring(0, 60))
          .slice(0, 30);
      }
    }

    if (user.role === 'COLLEGE' && updates.collegeProfile && typeof updates.collegeProfile === 'object') {
      const cp = updates.collegeProfile;
      if (!user.collegeProfile) {
        user.collegeProfile = {};
      }

      if (typeof cp.institutionName === 'string') user.collegeProfile.institutionName = cp.institutionName.trim().substring(0, 150);
      if (typeof cp.institutionLocation === 'string') user.collegeProfile.institutionLocation = cp.institutionLocation.trim().substring(0, 100);
      if (typeof cp.institutionType === 'string') user.collegeProfile.institutionType = cp.institutionType.trim().substring(0, 60);
      if (typeof cp.contactPerson === 'string') user.collegeProfile.contactPerson = cp.contactPerson.trim().substring(0, 100);
      if (typeof cp.placementEmail === 'string') user.collegeProfile.placementEmail = cp.placementEmail.trim().toLowerCase().substring(0, 100);
      if (typeof cp.placementPhone === 'string') user.collegeProfile.placementPhone = cp.placementPhone.trim().substring(0, 20);
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    console.error('[UpdateMe Error] Failed to update profile:', error);
    res.status(503).json({
      success: false,
      error: {
        code: 'PERSISTENCE_ERROR',
        message: 'Failed to update user profile due to database communication error.',
      },
    });
  }
};

export const updateLanguagePreference = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required to update language preference.',
      },
    });
    return;
  }

  const { preferredLanguage } = req.body;
  if (
    !preferredLanguage ||
    typeof preferredLanguage !== 'string' ||
    !(SUPPORTED_LANGUAGES as readonly string[]).includes(preferredLanguage)
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_LANGUAGE_CODE',
        message: `Invalid language code. Supported languages are: ${SUPPORTED_LANGUAGES.join(', ')}`,
      },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is currently offline. Cannot update language preference.',
      },
    });
    return;
  }

  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found.',
        },
      });
      return;
    }

    user.preferredLanguage = preferredLanguage;
    await user.save();

    res.status(200).json({
      success: true,
      preferredLanguage: user.preferredLanguage,
      message: 'Language preference updated successfully.',
    });
  } catch (error) {
    console.error('[UpdateLanguagePreference Error]:', error);
    res.status(503).json({
      success: false,
      error: {
        code: 'PERSISTENCE_ERROR',
        message: 'Failed to update language preference due to database communication error.',
      },
    });
  }
};
