import crypto from 'crypto';
import mongoose from 'mongoose';
import { WhatsAppLinkToken } from '../../models/whatsAppLinkToken.model.js';
import { WhatsAppAccount } from '../../models/whatsAppAccount.model.js';
import { User } from '../../models/user.model.js';
import { WhatsAppService } from './whatsapp.service.js';
import {
  WhatsAppLinkRequestResult,
  WhatsAppStatusData,
  WhatsAppPreferences,
} from '../../types/index.js';

export class WhatsAppAccountLinkingService {
  /**
   * Generates a cryptographically secure, 6-character, 5-minute short-lived linking code.
   * Hashes the code with SHA-256 before persisting in MongoDB.
   */
  static async requestLinkingCode(userId: string): Promise<WhatsAppLinkRequestResult> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format.');
    }

    // Invalidate any prior active tokens for this user
    await WhatsAppLinkToken.updateMany(
      { userId: new mongoose.Types.ObjectId(userId), used: false },
      { $set: { used: true } }
    );

    // Generate random 6-character alphanumeric string (excluding confusing characters 0, O, 1, I)
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    const randomBytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      code += charset[randomBytes[i] % charset.length];
    }

    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresInSeconds = 300; // 5 minutes
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    await WhatsAppLinkToken.create({
      userId: new mongoose.Types.ObjectId(userId),
      codeHash,
      codeMasked: `${code.slice(0, 2)}***${code.slice(-1)}`,
      expiresAt,
      used: false,
      attempts: 0,
    });

    const officialNumber = WhatsAppService.getInstance().getOfficialPhoneNumber();

    return {
      code,
      expiresInSeconds,
      expiresAt: expiresAt.toISOString(),
      officialPhoneNumber: officialNumber,
      instruction: `Send this code "${code}" to CareerBridge on WhatsApp at ${officialNumber} to link your student account.`,
    };
  }

  /**
   * Validates linking code and binds verified WhatsApp phone number to the student account.
   */
  static async verifyAndLinkAccount(params: {
    rawCode: string;
    phoneNumber: string;
    userId?: string;
  }): Promise<{ success: boolean; message: string; accountId?: string }> {
    const { rawCode, phoneNumber, userId } = params;

    const normalizedCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

    if (normalizedCode.length !== 6) {
      return { success: false, message: 'Linking code must be exactly 6 alphanumeric characters.' };
    }

    if (cleanPhone.length < 10) {
      return { success: false, message: 'Please provide a valid E.164 phone number.' };
    }

    const codeHash = crypto.createHash('sha256').update(normalizedCode).digest('hex');

    // Query active unexpired token
    const tokenRecord = await WhatsAppLinkToken.findOne({
      codeHash,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenRecord) {
      return { success: false, message: 'Invalid or expired linking code. Please request a new code.' };
    }

    // Check brute force attempts
    if (tokenRecord.attempts >= 3) {
      tokenRecord.used = true;
      await tokenRecord.save();
      return { success: false, message: 'Too many failed verification attempts. Code revoked.' };
    }

    // If a specific userId was passed from web session, enforce matching
    if (userId && tokenRecord.userId.toString() !== userId) {
      tokenRecord.attempts += 1;
      await tokenRecord.save();
      return { success: false, message: 'Verification authorization mismatch.' };
    }

    const targetUserId = tokenRecord.userId;

    // Check if phone number is already linked to another active account
    const existingOther = await WhatsAppAccount.findOne({
      phoneNumber: cleanPhone,
      userId: { $ne: targetUserId },
      status: 'ACTIVE',
    });

    if (existingOther) {
      return {
        success: false,
        message: 'This WhatsApp phone number is already linked to another CareerBridge account.',
      };
    }

    // Mark token as used
    tokenRecord.used = true;
    await tokenRecord.save();

    // Upsert WhatsAppAccount
    const waAccount = await WhatsAppAccount.findOneAndUpdate(
      { userId: targetUserId },
      {
        phoneNumber: cleanPhone,
        verified: true,
        linkedAt: new Date(),
        notificationsEnabled: true,
        jobAlertsEnabled: true,
        applicationUpdatesEnabled: true,
        interviewAlertsEnabled: true,
        careerTipsEnabled: true,
        consentAt: new Date(),
        consentSource: 'LINKING_CODE_VERIFICATION',
        status: 'ACTIVE',
      },
      { upsert: true, new: true }
    );

    // Update User model student profile preferences
    const user = await User.findById(targetUserId);
    if (user) {
      if (!user.studentProfile) {
        user.studentProfile = {};
      }
      user.studentProfile.whatsappNumber = cleanPhone;
      user.studentProfile.whatsappVerified = true;
      user.studentProfile.whatsappLinkedAt = new Date().toISOString();
      user.studentProfile.whatsappNotificationsEnabled = true;
      user.studentProfile.whatsappJobAlertsEnabled = true;
      user.studentProfile.whatsappApplicationUpdatesEnabled = true;
      user.studentProfile.whatsappInterviewAlertsEnabled = true;
      user.studentProfile.whatsappCareerTipsEnabled = true;
      user.studentProfile.whatsappConsentAt = new Date().toISOString();
      user.studentProfile.whatsappConsentSource = 'LINKING_CODE_VERIFICATION';
      await user.save();
    }

    // Send WhatsApp confirmation greeting
    WhatsAppService.getInstance().sendTextMessage(
      cleanPhone,
      `🎉 *CareerBridge Account Linked!*\n\nHello ${user?.fullName || 'Student'}, your WhatsApp account is now verified and connected to your CareerBridge student portal.\n\nType *MENU* anytime to view active jobs, check application status, or chat with your AI Career Guide.`
    );

    return {
      success: true,
      message: 'WhatsApp account linked and verified successfully.',
      accountId: waAccount._id.toString(),
    };
  }

  /**
   * Unlinks WhatsApp account from student profile.
   */
  static async unlinkAccount(userId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return false;

    const account = await WhatsAppAccount.findOne({ userId });
    if (account) {
      account.status = 'UNLINKED';
      account.notificationsEnabled = false;
      await account.save();
    }

    const user = await User.findById(userId);
    if (user && user.studentProfile) {
      user.studentProfile.whatsappVerified = false;
      user.studentProfile.whatsappNotificationsEnabled = false;
      await user.save();
    }

    return true;
  }

  /**
   * Retrieves current WhatsApp link state and preferences for student.
   */
  static async getAccountStatus(userId: string): Promise<WhatsAppStatusData> {
    const waService = WhatsAppService.getInstance();
    const isConfigured = waService.isConfigured();
    const officialNumber = waService.getOfficialPhoneNumber();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { linked: false, integrationConfigured: isConfigured, officialNumber };
    }

    const account = await WhatsAppAccount.findOne({ userId, status: 'ACTIVE' });
    if (!account) {
      return {
        linked: false,
        integrationConfigured: isConfigured,
        officialNumber,
      };
    }

    const prefs: WhatsAppPreferences = {
      notificationsEnabled: account.notificationsEnabled,
      jobAlertsEnabled: account.jobAlertsEnabled,
      applicationUpdatesEnabled: account.applicationUpdatesEnabled,
      interviewAlertsEnabled: account.interviewAlertsEnabled,
      careerTipsEnabled: account.careerTipsEnabled,
    };

    return {
      linked: true,
      phoneNumber: account.phoneNumber,
      verified: account.verified,
      linkedAt: account.linkedAt ? account.linkedAt.toISOString() : undefined,
      preferences: prefs,
      status: account.status,
      integrationConfigured: isConfigured,
      officialNumber,
    };
  }

  /**
   * Updates student WhatsApp notification category toggles.
   */
  static async updatePreferences(
    userId: string,
    prefs: WhatsAppPreferences
  ): Promise<WhatsAppPreferences | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;

    const account = await WhatsAppAccount.findOne({ userId, status: 'ACTIVE' });
    if (!account) return null;

    if (prefs.notificationsEnabled !== undefined) account.notificationsEnabled = prefs.notificationsEnabled;
    if (prefs.jobAlertsEnabled !== undefined) account.jobAlertsEnabled = prefs.jobAlertsEnabled;
    if (prefs.applicationUpdatesEnabled !== undefined) account.applicationUpdatesEnabled = prefs.applicationUpdatesEnabled;
    if (prefs.interviewAlertsEnabled !== undefined) account.interviewAlertsEnabled = prefs.interviewAlertsEnabled;
    if (prefs.careerTipsEnabled !== undefined) account.careerTipsEnabled = prefs.careerTipsEnabled;

    await account.save();

    // Mirror to User student profile
    const user = await User.findById(userId);
    if (user && user.studentProfile) {
      user.studentProfile.whatsappNotificationsEnabled = account.notificationsEnabled;
      user.studentProfile.whatsappJobAlertsEnabled = account.jobAlertsEnabled;
      user.studentProfile.whatsappApplicationUpdatesEnabled = account.applicationUpdatesEnabled;
      user.studentProfile.whatsappInterviewAlertsEnabled = account.interviewAlertsEnabled;
      user.studentProfile.whatsappCareerTipsEnabled = account.careerTipsEnabled;
      await user.save();
    }

    return {
      notificationsEnabled: account.notificationsEnabled,
      jobAlertsEnabled: account.jobAlertsEnabled,
      applicationUpdatesEnabled: account.applicationUpdatesEnabled,
      interviewAlertsEnabled: account.interviewAlertsEnabled,
      careerTipsEnabled: account.careerTipsEnabled,
    };
  }
}
