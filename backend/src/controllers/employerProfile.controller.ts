import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { EmployerProfile } from '../models/employerProfile.model.js';
import { getDbStatus } from '../config/db.js';
import { VerificationStatus } from '../types/index.js';

const URL_REGEX = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

export const createEmployerProfile = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only registered employers can create a company profile.' },
    });
    return;
  }

  const {
    companyName,
    companyDescription,
    companyWebsite,
    industry,
    companySize = '11-50',
    headquarters,
    companyLogo,
    contactPerson,
    designation,
  } = req.body;

  // Validation
  if (!companyName || typeof companyName !== 'string') {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Company name is required.' },
    });
    return;
  }

  if (companyName.trim().length < 2) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Company name must be at least 2 characters.' },
    });
    return;
  }

  if (!companyDescription || typeof companyDescription !== 'string') {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Company description is required.' },
    });
    return;
  }

  if (companyDescription.trim().length < 10) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Company description must be at least 10 characters.' },
    });
    return;
  }

  if (!industry || typeof industry !== 'string' || industry.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Industry sector is required.' },
    });
    return;
  }

  if (headquarters && (typeof headquarters !== 'string' || headquarters.trim().length === 0)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Headquarters location must be a non-empty string.' },
    });
    return;
  }

  if (!contactPerson || typeof contactPerson !== 'string' || contactPerson.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Contact person name is required.' },
    });
    return;
  }

  if (!designation || typeof designation !== 'string' || designation.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Contact person designation is required.' },
    });
    return;
  }

  if (!companyWebsite || typeof companyWebsite !== 'string' || !URL_REGEX.test(companyWebsite.trim())) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Valid company website URL is required (must start with http:// or https://).' },
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
    const userId = new mongoose.Types.ObjectId(req.user.sub);

    // Prevent duplicate employer profile
    const existing = await EmployerProfile.findOne({ userId });
    if (existing) {
      res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_PROFILE', message: 'A company profile already exists for this employer account.' },
      });
      return;
    }

    const profile = new EmployerProfile({
      userId,
      companyName: companyName.trim(),
      companyDescription: companyDescription.trim(),
      companyWebsite: companyWebsite ? companyWebsite.trim() : undefined,
      industry: industry.trim(),
      companySize: companySize ? String(companySize).trim() : '11-50',
      headquarters: headquarters.trim(),
      companyLogo: companyLogo ? String(companyLogo).trim() : undefined,
      contactPerson: contactPerson.trim(),
      designation: designation.trim(),
      verified: false,
      verificationStatus: 'PENDING',
    });

    await profile.save();

    res.status(201).json({
      success: true,
      data: profile.toSafeObject(),
    });
  } catch (error) {
    console.error('[EmployerProfile Error] Failed to create profile:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to create employer profile.' },
    });
  }
};

export const getMyEmployerProfile = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only employers can view their company profile details.' },
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
    const profile = await EmployerProfile.findOne({ userId: req.user.sub });
    if (!profile) {
      res.status(404).json({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', message: 'Company profile not yet set up for this employer account.' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: profile.toSafeObject(),
    });
  } catch (error) {
    console.error('[EmployerProfile Error] Failed to fetch profile:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve employer profile.' },
    });
  }
};

export const updateMyEmployerProfile = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only employers can update their company profile.' },
    });
    return;
  }

  // Enforce self-verification protection
  if (
    'verified' in req.body ||
    'verificationStatus' in req.body ||
    'verifiedBy' in req.body ||
    'verifiedAt' in req.body ||
    'userId' in req.body ||
    '_id' in req.body
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PROTECTED_FIELD_MODIFICATION',
        message: 'Employers cannot modify verification status directly or self-verify (protected fields: verified, verificationStatus, userId).',
      },
    });
    return;
  }

  const {
    companyName,
    companyDescription,
    companyWebsite,
    industry,
    companySize,
    headquarters,
    companyLogo,
    contactPerson,
    designation,
  } = req.body;

  if (companyWebsite && (typeof companyWebsite !== 'string' || !URL_REGEX.test(companyWebsite.trim()))) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Company website must be a valid URL starting with http:// or https://.' },
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
    const profile = await EmployerProfile.findOne({ userId: req.user.sub });
    if (!profile) {
      res.status(404).json({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', message: 'Employer profile not found. Please create one first.' },
      });
      return;
    }

    if (companyName !== undefined) {
      if (typeof companyName !== 'string' || companyName.trim().length < 2) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Company name must be at least 2 characters.' },
        });
        return;
      }
      profile.companyName = companyName.trim();
    }

    if (companyDescription !== undefined) profile.companyDescription = String(companyDescription).trim();
    if (companyWebsite !== undefined) profile.companyWebsite = companyWebsite ? String(companyWebsite).trim() : undefined;
    if (industry !== undefined) profile.industry = String(industry).trim();
    if (companySize !== undefined) profile.companySize = String(companySize).trim();
    if (headquarters !== undefined) profile.headquarters = String(headquarters).trim();
    if (companyLogo !== undefined) profile.companyLogo = companyLogo ? String(companyLogo).trim() : undefined;
    if (contactPerson !== undefined) profile.contactPerson = String(contactPerson).trim();
    if (designation !== undefined) profile.designation = String(designation).trim();

    await profile.save();

    res.status(200).json({
      success: true,
      data: profile.toSafeObject(),
    });
  } catch (error) {
    console.error('[EmployerProfile Error] Failed to update profile:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to update employer profile.' },
    });
  }
};

export const getPublicEmployerProfile = async (req: Request, res: Response): Promise<void> => {
  const employerId = req.params.employerId as string;

  if (!mongoose.Types.ObjectId.isValid(employerId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid employer ID format.' },
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
    // Search by profile ID or userId
    const profile = await EmployerProfile.findOne({
      $or: [{ _id: employerId }, { userId: employerId }],
    });

    if (!profile) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Company profile not found.' },
      });
      return;
    }

    // Strictly returns public projection omitting private contact details
    res.status(200).json({
      success: true,
      data: profile.toPublicObject(),
    });
  } catch (error) {
    console.error('[EmployerProfile Error] Failed to get public profile:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve company profile.' },
    });
  }
};

export const verifyEmployerProfile = async (req: Request, res: Response): Promise<void> => {
  // Only COLLEGE or ADMIN role can verify employer
  if (!req.user || req.user.role !== 'COLLEGE') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only authorized college administrators can verify employer organizations.' },
    });
    return;
  }

  const employerId = req.params.employerId as string;
  const { status, notes } = req.body;

  if (!mongoose.Types.ObjectId.isValid(employerId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid employer ID format.' },
    });
    return;
  }

  if (!status || !['VERIFIED', 'REJECTED'].includes(status)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Verification status must be one of: VERIFIED, REJECTED.' },
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
    const profile = await EmployerProfile.findOne({
      $or: [{ _id: employerId }, { userId: employerId }],
    });

    if (!profile) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Employer profile not found.' },
      });
      return;
    }

    profile.verified = status === 'VERIFIED';
    profile.verificationStatus = status as VerificationStatus;
    profile.verificationNotes = typeof notes === 'string' ? notes.trim() : undefined;
    profile.verifiedBy = new mongoose.Types.ObjectId(req.user.sub);
    profile.verifiedAt = new Date();

    await profile.save();

    res.status(200).json({
      success: true,
      data: profile.toSafeObject(),
    });
  } catch (error) {
    console.error('[EmployerProfile Error] Failed to verify employer:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to update verification status.' },
    });
  }
};
