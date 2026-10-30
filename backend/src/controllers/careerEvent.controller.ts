import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { CareerEvent, ICareerEvent } from '../models/careerEvent.model.js';
import { EventRegistration } from '../models/eventRegistration.model.js';
import { User } from '../models/user.model.js';
import { getDbStatus } from '../config/db.js';
import { NotificationService } from '../services/notification/notification.service.js';
import { CareerEventData } from '../types/index.js';

export async function createEvent(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (userRole !== 'COLLEGE' && userRole !== 'EMPLOYER' && userRole !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Only Colleges, Employers, and Administrators can create career events',
      });
      return;
    }

    const {
      title,
      description,
      eventType,
      startAt,
      endAt,
      location,
      meetingUrl,
      registrationDeadline,
      capacity = 0,
      eligibility,
      status = 'DRAFT',
      tags = [],
    } = req.body;

    if (!title || !description || !eventType || !startAt || !endAt || !location || !registrationDeadline) {
      res.status(400).json({
        success: false,
        message: 'Missing required event fields (title, description, eventType, startAt, endAt, location, registrationDeadline)',
      });
      return;
    }

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    const deadlineDate = new Date(registrationDeadline);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(deadlineDate.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid date format' });
      return;
    }

    if (endDate.getTime() <= startDate.getTime()) {
      res.status(400).json({ success: false, message: 'Event end time must be after start time' });
      return;
    }

    // Fetch organizer user name
    const organizerUser = await User.findById(userId).lean();
    const organizerName =
      userRole === 'EMPLOYER'
        ? organizerUser?.employerProfile?.organizationName || organizerUser?.fullName
        : userRole === 'COLLEGE'
        ? organizerUser?.collegeProfile?.institutionName || organizerUser?.fullName
        : organizerUser?.fullName || 'Event Host';

    const event = new CareerEvent({
      title: title.trim(),
      description: description.trim(),
      eventType,
      organizerId: new mongoose.Types.ObjectId(userId),
      organizerRole: userRole,
      organizerName,
      collegeId: userRole === 'COLLEGE' ? new mongoose.Types.ObjectId(userId) : undefined,
      startAt: startDate,
      endAt: endDate,
      location: location.trim(),
      meetingUrl: meetingUrl ? meetingUrl.trim() : undefined,
      registrationDeadline: deadlineDate,
      capacity: Number(capacity) || 0,
      registeredCount: 0,
      eligibility,
      status,
      tags: Array.isArray(tags) ? tags : [],
    });

    await event.save();

    res.status(201).json({
      success: true,
      message: 'Career event created successfully',
      data: event.toSafeObject(userId),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create career event',
      error: error.message,
    });
  }
}

export async function listEvents(req: Request, res: Response): Promise<void> {
  try {
    const { eventType, status, collegeId, search, upcomingOnly } = req.query;
    const userId = req.user?.sub;
    const userRole = req.user?.role;

    const query: any = {};

    // By default, show PUBLISHED events unless the organizer requests their own drafts
    if (status && typeof status === 'string') {
      query.status = status;
    } else {
      if (userRole === 'COLLEGE' || userRole === 'EMPLOYER') {
        query.$or = [{ status: 'PUBLISHED' }, { organizerId: userId }];
      } else {
        query.status = 'PUBLISHED';
      }
    }

    if (eventType && typeof eventType === 'string') {
      query.eventType = eventType;
    }

    if (collegeId && typeof collegeId === 'string' && mongoose.Types.ObjectId.isValid(collegeId)) {
      query.collegeId = new mongoose.Types.ObjectId(collegeId);
    }

    if (upcomingOnly === 'true') {
      query.startAt = { $gte: new Date() };
    }

    if (search && typeof search === 'string') {
      const sRegex = new RegExp(search, 'i');
      query.$or = [{ title: sRegex }, { description: sRegex }, { location: sRegex }, { tags: sRegex }];
    }

    const events = await CareerEvent.find(query).sort({ startAt: 1 }).limit(100);

    // If student is logged in, find which events they registered for
    const registeredEventIds = new Set<string>();
    if (userId && userRole === 'STUDENT') {
      const registrations = await EventRegistration.find({
        userId,
        registrationStatus: 'REGISTERED',
      }).lean();
      for (const reg of registrations) {
        registeredEventIds.add(reg.eventId.toString());
      }
    }

    const eventDataList: CareerEventData[] = events.map((ev) => {
      const safe = ev.toSafeObject(userId);
      safe.isRegistered = registeredEventIds.has(ev._id.toString());
      return safe;
    });

    res.status(200).json({
      success: true,
      count: eventDataList.length,
      data: eventDataList,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve career events',
      error: error.message,
    });
  }
}

export async function getEventById(req: Request, res: Response): Promise<void> {
  try {
    const { eventId } = req.params;
    const userId = req.user?.sub;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid event ID' });
      return;
    }

    const event = await CareerEvent.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Career event not found' });
      return;
    }

    const safeData = event.toSafeObject(userId);

    if (userId) {
      const registration = await EventRegistration.findOne({
        eventId: event._id,
        userId,
        registrationStatus: 'REGISTERED',
      }).lean();
      safeData.isRegistered = Boolean(registration);
    }

    res.status(200).json({
      success: true,
      data: safeData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve career event',
      error: error.message,
    });
  }
}

export async function updateEvent(req: Request, res: Response): Promise<void> {
  try {
    const { eventId } = req.params;
    const userId = req.user?.sub;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const event = await CareerEvent.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Career event not found' });
      return;
    }

    // Only organizer or Admin can update
    if (event.organizerId.toString() !== userId && userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'You are not authorized to edit this event' });
      return;
    }

    const updatableFields = [
      'title',
      'description',
      'eventType',
      'startAt',
      'endAt',
      'location',
      'meetingUrl',
      'registrationDeadline',
      'capacity',
      'status',
      'tags',
      'eligibility',
    ];

    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        (event as any)[field] = req.body[field];
      }
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Career event updated successfully',
      data: event.toSafeObject(userId),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update career event',
      error: error.message,
    });
  }
}

export async function registerForEvent(req: Request, res: Response): Promise<void> {
  try {
    const { eventId } = req.params;
    const userId = req.user?.sub;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (userRole !== 'STUDENT') {
      res.status(403).json({ success: false, message: 'Only students can register for career events' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid event ID' });
      return;
    }

    const event = await CareerEvent.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Career event not found' });
      return;
    }

    if (event.status !== 'PUBLISHED') {
      res.status(400).json({
        success: false,
        message: `Cannot register for event with status '${event.status}'`,
      });
      return;
    }

    // Validate registration deadline
    if (new Date(event.registrationDeadline).getTime() < Date.now()) {
      res.status(400).json({
        success: false,
        message: 'Registration deadline for this event has passed',
      });
      return;
    }

    // Validate capacity
    if (event.capacity > 0 && event.registeredCount >= event.capacity) {
      res.status(400).json({
        success: false,
        message: 'This event has reached full capacity',
      });
      return;
    }

    // Check duplicate registration
    const existingRegistration = await EventRegistration.findOne({
      eventId: event._id,
      userId,
    });

    if (existingRegistration && existingRegistration.registrationStatus === 'REGISTERED') {
      res.status(409).json({
        success: false,
        message: 'You are already registered for this event',
      });
      return;
    }

    // Fetch student profile for attendee snapshot
    const studentUser = await User.findById(userId).lean();
    const sp = studentUser?.studentProfile || {};

    let registration;
    if (existingRegistration) {
      // Re-register if previously cancelled
      existingRegistration.registrationStatus = 'REGISTERED';
      existingRegistration.registeredAt = new Date();
      existingRegistration.attendanceStatus = 'NOT_RECORDED';
      await existingRegistration.save();
      registration = existingRegistration;
    } else {
      registration = new EventRegistration({
        eventId: event._id,
        userId,
        registrationStatus: 'REGISTERED',
        registeredAt: new Date(),
        attendanceStatus: 'NOT_RECORDED',
        studentSnapshot: {
          fullName: studentUser?.fullName || 'Student',
          email: studentUser?.email || '',
          course: sp.course,
          collegeName: sp.collegeName,
          graduationYear: sp.graduationYear,
        },
      });
      await registration.save();
    }

    // Increment registered count
    event.registeredCount = (event.registeredCount || 0) + 1;
    await event.save();

    // Trigger confirmation notification for student
    const notifService = NotificationService.getInstance();
    await notifService.createNotification({
      recipientId: userId,
      type: 'EVENT_REGISTRATION_CONFIRMED',
      title: `Event Registration Confirmed: ${event.title}`,
      message: `Your registration for "${event.title}" on ${new Date(event.startAt).toLocaleDateString()} has been confirmed. Meeting Location: ${event.location}`,
      relatedEntityType: 'CAREER_EVENT',
      relatedEntityId: event._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: 'Successfully registered for event',
      data: registration.toSafeObject(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to register for event',
      error: error.message,
    });
  }
}

export async function cancelRegistration(req: Request, res: Response): Promise<void> {
  try {
    const { eventId } = req.params;
    const userId = req.user?.sub;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const registration = await EventRegistration.findOne({
      eventId,
      userId,
      registrationStatus: 'REGISTERED',
    });

    if (!registration) {
      res.status(404).json({
        success: false,
        message: 'Active registration not found for this event',
      });
      return;
    }

    registration.registrationStatus = 'CANCELLED';
    await registration.save();

    // Decrement registered count
    const event = await CareerEvent.findById(eventId);
    if (event && event.registeredCount > 0) {
      event.registeredCount -= 1;
      await event.save();
    }

    res.status(200).json({
      success: true,
      message: 'Event registration cancelled successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel registration',
      error: error.message,
    });
  }
}

export async function getEventRegistrations(req: Request, res: Response): Promise<void> {
  try {
    const { eventId } = req.params;
    const userId = req.user?.sub;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const event = await CareerEvent.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Career event not found' });
      return;
    }

    // Only organizer or Admin can view attendee list
    if (event.organizerId.toString() !== userId && userRole !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Only the event organizer can view the registration list',
      });
      return;
    }

    const registrations = await EventRegistration.find({ eventId })
      .sort({ registeredAt: -1 })
      .limit(500);

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations.map((r) => r.toSafeObject()),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve event registrations',
      error: error.message,
    });
  }
}
