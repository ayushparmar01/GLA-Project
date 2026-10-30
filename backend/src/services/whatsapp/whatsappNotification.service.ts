import mongoose from 'mongoose';
import { WhatsAppAccount } from '../../models/whatsAppAccount.model.js';
import { WhatsAppService } from './whatsapp.service.js';
import { config } from '../../config/env.js';

export class WhatsAppNotificationService {
  /**
   * Dispatches WhatsApp notification when an interview round is scheduled or updated.
   */
  static async sendInterviewAlert(params: {
    studentId: string | mongoose.Types.ObjectId;
    companyName: string;
    jobTitle: string;
    interviewType: string;
    scheduledAt: Date;
    meetingUrl?: string;
  }): Promise<boolean> {
    const { studentId, companyName, jobTitle, interviewType, scheduledAt, meetingUrl } = params;

    const account = await WhatsAppAccount.findOne({
      userId: new mongoose.Types.ObjectId(studentId),
      status: 'ACTIVE',
      notificationsEnabled: true,
      interviewAlertsEnabled: true,
    });

    if (!account || !account.phoneNumber) return false;

    const formattedTime = new Date(scheduledAt).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    let body = `📅 *Interview Scheduled: ${companyName}*\n\n`;
    body += `Role: *${jobTitle}*\n`;
    body += `Format: ${interviewType}\n`;
    body += `Date & Time: *${formattedTime}*\n`;
    if (meetingUrl) {
      body += `Meeting Link: ${meetingUrl}\n`;
    }
    body += `\n_View interview guidelines and mock preparation on CareerBridge: ${config.clientUrl}_\n`;
    body += `Reply STOP to pause notifications.`;

    const res = await WhatsAppService.getInstance().sendTextMessage(account.phoneNumber, body);
    return res.success;
  }

  /**
   * Dispatches WhatsApp notification when an application status changes.
   */
  static async sendApplicationStatusAlert(params: {
    studentId: string | mongoose.Types.ObjectId;
    companyName: string;
    jobTitle: string;
    newStatus: string;
  }): Promise<boolean> {
    const { studentId, companyName, jobTitle, newStatus } = params;

    const account = await WhatsAppAccount.findOne({
      userId: new mongoose.Types.ObjectId(studentId),
      status: 'ACTIVE',
      notificationsEnabled: true,
      applicationUpdatesEnabled: true,
    });

    if (!account || !account.phoneNumber) return false;

    const statusBadge =
      newStatus === 'SELECTED'
        ? '🎉 Congratulations! You have been SELECTED'
        : newStatus === 'SHORTLISTED'
        ? '⭐ You have been SHORTLISTED'
        : `Application update: ${newStatus}`;

    let body = `${statusBadge}\n\n`;
    body += `Company: *${companyName}*\n`;
    body += `Position: *${jobTitle}*\n\n`;
    body += `_Review instructions and next steps in your CareerBridge portal: ${config.clientUrl}_\n`;
    body += `Reply STOP to pause notifications.`;

    const res = await WhatsAppService.getInstance().sendTextMessage(account.phoneNumber, body);
    return res.success;
  }

  /**
   * Dispatches WhatsApp notification when a new matching campus drive is published.
   */
  static async sendNewDriveAlert(params: {
    studentId: string | mongoose.Types.ObjectId;
    companyName: string;
    jobTitle: string;
    location?: string;
    deadline: Date;
  }): Promise<boolean> {
    const { studentId, companyName, jobTitle, location, deadline } = params;

    const account = await WhatsAppAccount.findOne({
      userId: new mongoose.Types.ObjectId(studentId),
      status: 'ACTIVE',
      notificationsEnabled: true,
      jobAlertsEnabled: true,
    });

    if (!account || !account.phoneNumber) return false;

    const deadlineStr = new Date(deadline).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    let body = `🚀 *New Campus Placement Drive Published!*\n\n`;
    body += `Role: *${jobTitle}*\n`;
    body += `Company: *${companyName}*\n`;
    if (location) body += `Location: ${location}\n`;
    body += `Deadline: *${deadlineStr}*\n\n`;
    body += `_Check your eligibility and apply at: ${config.clientUrl}_\n`;
    body += `Reply STOP to pause notifications.`;

    const res = await WhatsAppService.getInstance().sendTextMessage(account.phoneNumber, body);
    return res.success;
  }
}
