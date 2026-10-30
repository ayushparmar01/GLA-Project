import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Interview } from '../models/interview.model.js';
import { PlacementApplication } from '../models/placementApplication.model.js';
import { PlacementDrive } from '../models/placementDrive.model.js';
import { User } from '../models/user.model.js';
import { getDbStatus } from '../config/db.js';
import { InterviewType } from '../types/index.js';
import { NotificationService } from '../services/notification/notification.service.js';

const URL_REGEX = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

export const scheduleInterview = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only employers can schedule interviews.' },
    });
    return;
  }

  const applicationId = (req.params.applicationId || req.body.applicationId) as string;
  if (!applicationId) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'applicationId is required.' },
    });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid application ID format.' },
    });
    return;
  }

  const {
    interviewRound,
    interviewType,
    scheduledAt,
    durationMinutes = 30,
    meetingLink,
    location,
    instructions,
  } = req.body;

  if (!interviewRound || typeof interviewRound !== 'string' || interviewRound.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Interview round title is required.' },
    });
    return;
  }

  if (!interviewType || !['ONLINE', 'OFFLINE'].includes(interviewType as InterviewType)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Interview type must be ONLINE or OFFLINE.' },
    });
    return;
  }

  if (!scheduledAt) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Scheduled date and time is required.' },
    });
    return;
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Scheduled time must be a valid date format.' },
    });
    return;
  }

  if (scheduledDate <= new Date()) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'scheduledAt must be in the future (future date and time).' },
    });
    return;
  }

  if (interviewType === 'ONLINE') {
    if (!meetingLink || typeof meetingLink !== 'string' || !meetingLink.trim()) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'meetingLink is required for online interviews.' },
      });
      return;
    }
    if (!URL_REGEX.test(meetingLink.trim())) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Meeting link must be a valid URL starting with http:// or https://.' },
      });
      return;
    }
  }

  if (interviewType === 'OFFLINE') {
    if (!location || typeof location !== 'string' || !location.trim()) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'location is required for offline interviews.' },
      });
      return;
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
    const application = await PlacementApplication.findById(applicationId);
    if (!application) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Application not found.' },
      });
      return;
    }

    const drive = await PlacementDrive.findById(application.driveId);
    if (!drive) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Associated opportunity not found.' },
      });
      return;
    }

    const isOwner =
      (drive.employerId && drive.employerId.toString() === req.user.sub) ||
      drive.createdBy.toString() === req.user.sub;

    if (!isOwner) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only schedule interviews for your own company\'s applicants.' },
      });
      return;
    }

    if (application.status === 'WITHDRAWN') {
      res.status(400).json({
        success: false,
        error: { code: 'APPLICATION_WITHDRAWN', message: 'Cannot schedule interviews for a withdrawn application.' },
      });
      return;
    }

    if (application.status === 'REJECTED') {
      res.status(400).json({
        success: false,
        error: { code: 'APPLICATION_REJECTED', message: 'Cannot schedule interviews for a rejected candidate.' },
      });
      return;
    }

    const employerObjectId = new mongoose.Types.ObjectId(req.user.sub);

    const interview = new Interview({
      applicationId: application._id,
      driveId: drive._id,
      employerId: employerObjectId,
      studentId: application.studentId,
      interviewRound: interviewRound.trim(),
      interviewType,
      scheduledAt: scheduledDate,
      durationMinutes: typeof durationMinutes === 'number' ? Math.max(15, Math.min(240, durationMinutes)) : 30,
      meetingLink: meetingLink ? meetingLink.trim() : undefined,
      location: location ? location.trim() : undefined,
      instructions: instructions ? instructions.trim() : undefined,
      status: 'SCHEDULED',
      createdBy: employerObjectId,
    });

    await interview.save();

    // Trigger in-app notification for the candidate
    const notifService = NotificationService.getInstance();
    await notifService.createNotification({
      recipientId: interview.studentId.toString(),
      type: 'INTERVIEW_SCHEDULED',
      title: `Interview Scheduled: ${interview.interviewRound}`,
      message: `You have an interview scheduled for ${interview.interviewRound} on ${new Date(interview.scheduledAt).toLocaleString()}.`,
      relatedEntityType: 'INTERVIEW',
      relatedEntityId: interview._id.toString(),
    });

    // Automatically advance application status to INTERVIEW_SCHEDULED if not already there
    if (application.status !== 'INTERVIEW_SCHEDULED') {
      const prevStatus = application.status;
      application.status = 'INTERVIEW_SCHEDULED';
      application.statusHistory.push({
        fromStatus: prevStatus,
        toStatus: 'INTERVIEW_SCHEDULED',
        changedBy: employerObjectId,
        changedAt: new Date(),
        note: `Interview scheduled: ${interviewRound.trim()}`,
      });
      await application.save();
    }

    res.status(201).json({
      success: true,
      data: interview.toSafeObject({
        driveTitle: drive.title,
        companyName: drive.organizationName,
      }),
    });
  } catch (error) {
    console.error('[Interview Error] Failed to schedule interview:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to schedule interview.' },
    });
  }
};

export const listEmployerInterviews = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only employers can view their interview schedules.' },
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
    const interviews = await Interview.find({ employerId: employerObjectId }).sort({ scheduledAt: 1 });

    const studentIds = interviews.map((i) => i.studentId);
    const driveIds = interviews.map((i) => i.driveId);

    const [students, drives] = await Promise.all([
      User.find({ _id: { $in: studentIds } }).select('fullName email'),
      PlacementDrive.find({ _id: { $in: driveIds } }).select('title organizationName'),
    ]);

    const studentMap = new Map<string, { fullName: string; email: string }>();
    students.forEach((s) => studentMap.set(s._id.toString(), { fullName: s.fullName, email: s.email }));

    const driveMap = new Map<string, { title: string; organizationName: string }>();
    drives.forEach((d) => driveMap.set(d._id.toString(), { title: d.title, organizationName: d.organizationName }));

    res.status(200).json({
      success: true,
      data: interviews.map((item) => {
        const s = studentMap.get(item.studentId.toString());
        const d = driveMap.get(item.driveId.toString());
        return item.toSafeObject({
          driveTitle: d?.title,
          companyName: d?.organizationName,
          studentName: s?.fullName,
          studentEmail: s?.email,
        });
      }),
    });
  } catch (error) {
    console.error('[Interview Error] Failed to list interviews:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve interviews.' },
    });
  }
};

export const updateInterview = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only employers can update interview schedules.' },
    });
    return;
  }

  const interviewId = req.params.interviewId as string;
  if (!mongoose.Types.ObjectId.isValid(interviewId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid interview ID format.' },
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
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Interview not found.' },
      });
      return;
    }

    if (interview.employerId.toString() !== req.user.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only modify interviews scheduled by your company.' },
      });
      return;
    }

    const { scheduledAt, durationMinutes, meetingLink, location, instructions, status } = req.body;

    if (scheduledAt !== undefined) {
      const newDate = new Date(scheduledAt);
      if (isNaN(newDate.getTime()) || newDate <= new Date()) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Rescheduled time must be a valid future date.' },
        });
        return;
      }
      interview.scheduledAt = newDate;
      interview.status = 'RESCHEDULED';
    }

    if (durationMinutes !== undefined) {
      interview.durationMinutes = Math.max(15, Math.min(240, Number(durationMinutes)));
    }

    if (meetingLink !== undefined) {
      if (meetingLink && !URL_REGEX.test(String(meetingLink).trim())) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Meeting link must be a valid URL.' },
        });
        return;
      }
      interview.meetingLink = meetingLink ? String(meetingLink).trim() : undefined;
    }

    if (location !== undefined) interview.location = location ? String(location).trim() : undefined;
    if (instructions !== undefined) interview.instructions = instructions ? String(instructions).trim() : undefined;
    if (status && ['SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      interview.status = status;
    }

    await interview.save();

    // Trigger in-app notification for the candidate
    const notifService = NotificationService.getInstance();
    await notifService.createNotification({
      recipientId: interview.studentId.toString(),
      type: 'INTERVIEW_RESCHEDULED',
      title: `Interview Updated: ${interview.interviewRound}`,
      message: `Your interview for ${interview.interviewRound} has been updated. Scheduled time: ${new Date(interview.scheduledAt).toLocaleString()}.`,
      relatedEntityType: 'INTERVIEW',
      relatedEntityId: interview._id.toString(),
    });

    res.status(200).json({
      success: true,
      data: interview.toSafeObject(),
    });
  } catch (error) {
    console.error('[Interview Error] Failed to update interview:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to update interview.' },
    });
  }
};

export const cancelInterview = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only employers can cancel interviews.' },
    });
    return;
  }

  const interviewId = req.params.interviewId as string;
  if (!mongoose.Types.ObjectId.isValid(interviewId)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid interview ID format.' },
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
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Interview not found.' },
      });
      return;
    }

    if (interview.employerId.toString() !== req.user.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only cancel interviews scheduled by your company.' },
      });
      return;
    }

    interview.status = 'CANCELLED';
    await interview.save();

    // Trigger in-app notification for the candidate
    const notifService = NotificationService.getInstance();
    await notifService.createNotification({
      recipientId: interview.studentId.toString(),
      type: 'INTERVIEW_CANCELLED',
      title: `Interview Cancelled: ${interview.interviewRound}`,
      message: `Your interview for ${interview.interviewRound} has been cancelled by the recruiter.`,
      relatedEntityType: 'INTERVIEW',
      relatedEntityId: interview._id.toString(),
    });

    res.status(200).json({
      success: true,
      data: interview.toSafeObject(),
    });
  } catch (error) {
    console.error('[Interview Error] Failed to cancel interview:', error);
    res.status(503).json({
      success: false,
      error: { code: 'PERSISTENCE_ERROR', message: 'Failed to cancel interview.' },
    });
  }
};

export const listStudentInterviews = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only students can view their interview invitations.' },
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
    const studentObjectId = new mongoose.Types.ObjectId(req.user.sub);
    const interviews = await Interview.find({ studentId: studentObjectId }).sort({ scheduledAt: 1 });

    const driveIds = interviews.map((i) => i.driveId);
    const drives = await PlacementDrive.find({ _id: { $in: driveIds } }).select('title organizationName');

    const driveMap = new Map<string, { title: string; organizationName: string }>();
    drives.forEach((d) => driveMap.set(d._id.toString(), { title: d.title, organizationName: d.organizationName }));

    res.status(200).json({
      success: true,
      data: interviews.map((item) => {
        const d = driveMap.get(item.driveId.toString());
        return item.toSafeObject({
          driveTitle: d?.title,
          companyName: d?.organizationName,
        });
      }),
    });
  } catch (error) {
    console.error('[Interview Error] Failed to list student interviews:', error);
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve your scheduled interviews.' },
    });
  }
};
