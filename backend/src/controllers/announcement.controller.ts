import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Announcement } from '../models/announcement.model.js';
import { User } from '../models/user.model.js';
import { Cohort } from '../models/cohort.model.js';
import { NotificationService } from '../services/notification/notification.service.js';

export async function createAnnouncement(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (userRole !== 'COLLEGE' && userRole !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Only Colleges and Administrators can broadcast announcements',
      });
      return;
    }

    const {
      title,
      content,
      targetAudience = 'COLLEGE_STUDENTS',
      cohortId,
      priority = 'NORMAL',
      expiresAt,
    } = req.body;

    if (!title || !content) {
      res.status(400).json({
        success: false,
        message: 'Title and content are required for announcements',
      });
      return;
    }

    const authorUser = await User.findById(userId).lean();
    const authorName =
      userRole === 'COLLEGE'
        ? authorUser?.collegeProfile?.institutionName || authorUser?.fullName || 'College Desk'
        : 'System Administrator';

    const announcement = new Announcement({
      title: title.trim(),
      content: content.trim(),
      authorId: new mongoose.Types.ObjectId(userId),
      authorRole: userRole,
      authorName,
      targetAudience: userRole === 'ADMIN' ? targetAudience : 'COLLEGE_STUDENTS',
      collegeId: userRole === 'COLLEGE' ? new mongoose.Types.ObjectId(userId) : undefined,
      cohortId: cohortId && mongoose.Types.ObjectId.isValid(cohortId) ? new mongoose.Types.ObjectId(cohortId) : undefined,
      priority,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    await announcement.save();

    // Trigger in-app notifications for relevant students
    const notifService = NotificationService.getInstance();

    if (userRole === 'COLLEGE') {
      // Find students belonging to this college
      let recipientStudentIds: string[] = [];

      if (cohortId && mongoose.Types.ObjectId.isValid(cohortId)) {
        const cohort = await Cohort.findById(cohortId).lean();
        if (cohort && cohort.students) {
          recipientStudentIds = cohort.students.map((s) => s.studentId.toString());
        }
      } else {
        const students = await User.find({
          role: 'STUDENT',
          'studentProfile.collegeName': authorUser?.collegeProfile?.institutionName,
        })
          .limit(100)
          .lean();
        recipientStudentIds = students.map((s) => s._id.toString());
      }

      for (const studentId of recipientStudentIds) {
        await notifService.createNotification({
          recipientId: studentId,
          type: 'EVENT_ANNOUNCEMENT',
          title: `Announcement: ${announcement.title}`,
          message: `${authorName}: ${announcement.content.substring(0, 150)}...`,
          relatedEntityType: 'ANNOUNCEMENT',
          relatedEntityId: announcement._id.toString(),
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Announcement broadcasted successfully',
      data: announcement.toSafeObject(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create announcement',
      error: error.message,
    });
  }
}

export async function listAnnouncements(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    const userRole = req.user?.role;

    const query: any = {};

    if (userRole === 'STUDENT' && userId) {
      const student = await User.findById(userId).lean();
      const collegeName = student?.studentProfile?.collegeName;

      // Find college user if any
      let collegeUser;
      if (collegeName) {
        collegeUser = await User.findOne({
          role: 'COLLEGE',
          'collegeProfile.institutionName': collegeName,
        }).lean();
      }

      query.$or = [
        { targetAudience: 'ALL' },
        ...(collegeUser ? [{ collegeId: collegeUser._id }] : []),
      ];
    } else if (userRole === 'COLLEGE' && userId) {
      query.$or = [{ authorId: userId }, { targetAudience: 'ALL' }];
    }

    const announcements = await Announcement.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements.map((a) => a.toSafeObject()),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve announcements',
      error: error.message,
    });
  }
}

export async function getAnnouncementById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);

    if (!announcement) {
      res.status(404).json({ success: false, message: 'Announcement not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: announcement.toSafeObject(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve announcement',
      error: error.message,
    });
  }
}
