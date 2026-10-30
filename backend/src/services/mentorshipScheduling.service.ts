import { MentorshipSession } from '../models/mentorshipSession.model.js';
import { MentorProfile } from '../models/mentorProfile.model.js';
import crypto from 'crypto';

export interface ScheduleValidationResult {
  valid: boolean;
  conflictReason?: string;
}

export class MentorshipSchedulingService {
  /**
   * Generates a unique, privacy-safe meeting room link.
   */
  public static generateMeetingLink(relationshipId: string): string {
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    return `https://meet.careerbridge.in/session-${relationshipId.slice(-6)}-${randomSuffix}`;
  }

  /**
   * Validates whether a requested session creates a concurrency conflict / double-booking
   * for either the mentor or the student.
   *
   * Overlap condition:
   * (sessionStart < existingEnd && sessionEnd > existingStart)
   */
  public static async validateSessionSchedule(
    mentorId: string,
    studentId: string,
    scheduledStart: Date,
    scheduledEnd: Date,
    excludeSessionId?: string
  ): Promise<ScheduleValidationResult> {
    // Basic chronological validation
    if (scheduledStart >= scheduledEnd) {
      return {
        valid: false,
        conflictReason: 'Session scheduled end time must be after start time.',
      };
    }

    if (scheduledStart.getTime() < Date.now() - 5 * 60 * 1000) {
      return {
        valid: false,
        conflictReason: 'Cannot schedule a session in the past.',
      };
    }

    const durationMinutes = (scheduledEnd.getTime() - scheduledStart.getTime()) / (1000 * 60);
    if (durationMinutes < 15 || durationMinutes > 180) {
      return {
        valid: false,
        conflictReason: 'Session duration must be between 15 minutes and 3 hours.',
      };
    }

    // Check mentor conflicting sessions
    const mentorConflictQuery: any = {
      mentorId,
      status: { $in: ['REQUESTED', 'CONFIRMED'] },
      scheduledStart: { $lt: scheduledEnd },
      scheduledEnd: { $gt: scheduledStart },
    };

    if (excludeSessionId) {
      mentorConflictQuery._id = { $ne: excludeSessionId };
    }

    const mentorConflict = await MentorshipSession.findOne(mentorConflictQuery);
    if (mentorConflict) {
      return {
        valid: false,
        conflictReason: 'Mentor already has a confirmed session scheduled during this time window.',
      };
    }

    // Check student conflicting sessions
    const studentConflictQuery: any = {
      studentId,
      status: { $in: ['REQUESTED', 'CONFIRMED'] },
      scheduledStart: { $lt: scheduledEnd },
      scheduledEnd: { $gt: scheduledStart },
    };

    if (excludeSessionId) {
      studentConflictQuery._id = { $ne: excludeSessionId };
    }

    const studentConflict = await MentorshipSession.findOne(studentConflictQuery);
    if (studentConflict) {
      return {
        valid: false,
        conflictReason: 'Student already has another session scheduled during this time window.',
      };
    }

    return { valid: true };
  }
}
