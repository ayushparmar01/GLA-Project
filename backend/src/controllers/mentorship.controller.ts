import { Request, Response } from 'express';
import { MentorshipService } from '../services/mentorship.service.js';
import { MentorshipAiAssistantService } from '../services/mentorshipAiAssistant.service.js';

export class MentorshipController {
  // ==========================================
  // 1. DISCOVERY & RECOMMENDATIONS
  // ==========================================

  public static async listMentors(req: Request, res: Response): Promise<void> {
    try {
      const { industry, topic, language, isAlumni, search, page, limit } = req.query;
      const result = await MentorshipService.listVerifiedMentors({
        industry: typeof industry === 'string' ? industry : undefined,
        topic: typeof topic === 'string' ? topic : undefined,
        language: typeof language === 'string' ? language : undefined,
        isAlumni: isAlumni === 'true' ? true : isAlumni === 'false' ? false : undefined,
        search: typeof search === 'string' ? search : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 12,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to list mentors.' });
    }
  }

  public static async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      if (!studentId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const recommendations = await MentorshipService.getMentorRecommendations(studentId);
      res.status(200).json({ success: true, data: recommendations });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to calculate mentor recommendations.',
      });
    }
  }

  public static async getMentorById(req: Request, res: Response): Promise<void> {
    try {
      const { mentorProfileId } = req.params;
      const mentor = await MentorshipService.getMentorProfileById(mentorProfileId);
      res.status(200).json({ success: true, data: mentor });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message || 'Mentor not found.' });
    }
  }

  // ==========================================
  // 2. MENTOR PROFILE MANAGEMENT
  // ==========================================

  public static async getMyMentorProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const profile = await MentorshipService.getMentorProfileByUserId(userId);
      res.status(200).json({ success: true, data: profile });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async upsertMentorProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const profile = await MentorshipService.upsertMentorProfile(userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Mentor profile saved successfully.',
        data: profile,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to save mentor profile.' });
    }
  }

  // ==========================================
  // 3. STUDENT MENTORSHIP PROFILE
  // ==========================================

  public static async getStudentMentorshipProfile(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      if (!studentId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const profile = await MentorshipService.getStudentMentorshipProfile(studentId);
      res.status(200).json({ success: true, data: profile });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async updateStudentMentorshipProfile(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      if (!studentId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const profile = await MentorshipService.updateStudentMentorshipProfile(studentId, req.body);
      res.status(200).json({ success: true, message: 'Mentorship preferences updated.', data: profile });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ==========================================
  // 4. REQUESTS & LIFECYCLE
  // ==========================================

  public static async createRequest(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      if (!studentId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { mentorProfileId, topic, objective, introduction, preferredFormat } = req.body;
      if (!mentorProfileId || !topic || !objective || !introduction) {
        res.status(400).json({
          success: false,
          message: 'mentorProfileId, topic, objective, and introduction are required.',
        });
        return;
      }

      const request = await MentorshipService.createMentorshipRequest(studentId, {
        mentorProfileId,
        topic,
        objective,
        introduction,
        preferredFormat,
      });

      res.status(201).json({
        success: true,
        message: 'Mentorship request submitted successfully.',
        data: request,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to submit request.' });
    }
  }

  public static async listIncomingRequests(req: Request, res: Response): Promise<void> {
    try {
      const mentorUserId = req.user?.sub;
      if (!mentorUserId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const requests = await MentorshipService.listIncomingRequests(mentorUserId);
      res.status(200).json({ success: true, data: requests });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async listOutgoingRequests(req: Request, res: Response): Promise<void> {
    try {
      const studentUserId = req.user?.sub;
      if (!studentUserId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const requests = await MentorshipService.listOutgoingRequests(studentUserId);
      res.status(200).json({ success: true, data: requests });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async respondToRequest(req: Request, res: Response): Promise<void> {
    try {
      const mentorUserId = req.user?.sub;
      if (!mentorUserId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { requestId } = req.params;
      const { status, responseMessage } = req.body;

      if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
        res.status(400).json({ success: false, message: 'Status must be ACCEPTED or REJECTED.' });
        return;
      }

      const result = await MentorshipService.respondToMentorshipRequest(mentorUserId, requestId, {
        status,
        responseMessage,
      });

      res.status(200).json({
        success: true,
        message: `Mentorship request ${status.toLowerCase()} successfully.`,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ==========================================
  // 5. RELATIONSHIPS & GOALS
  // ==========================================

  public static async listRelationships(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const relationships = await MentorshipService.listUserRelationships(userId);
      res.status(200).json({ success: true, data: relationships });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async getRelationshipById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { relationshipId } = req.params;
      const relationship = await MentorshipService.getRelationshipById(userId, relationshipId);
      res.status(200).json({ success: true, data: relationship });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  public static async updateRelationshipStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { relationshipId } = req.params;
      const { status } = req.body;

      if (!status || !['ACTIVE', 'PAUSED', 'COMPLETED', 'TERMINATED'].includes(status)) {
        res.status(400).json({ success: false, message: 'Invalid relationship status.' });
        return;
      }

      const relationship = await MentorshipService.updateRelationshipStatus(userId, relationshipId, status);
      res.status(200).json({ success: true, data: relationship });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async createGoal(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { relationshipId } = req.params;
      const { title, description, priority, targetDate } = req.body;

      if (!title || !title.trim()) {
        res.status(400).json({ success: false, message: 'Goal title is required.' });
        return;
      }

      const goal = await MentorshipService.createGoal(userId, relationshipId, {
        title,
        description,
        priority,
        targetDate,
      });

      res.status(201).json({ success: true, data: goal });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async listGoals(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { relationshipId } = req.params;
      const goals = await MentorshipService.listGoals(userId, relationshipId);
      res.status(200).json({ success: true, data: goals });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async updateGoal(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { relationshipId, goalId } = req.params;
      const goal = await MentorshipService.updateGoal(userId, relationshipId, goalId, req.body);
      res.status(200).json({ success: true, data: goal });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async deleteGoal(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { relationshipId, goalId } = req.params;
      await MentorshipService.deleteGoal(userId, relationshipId, goalId);
      res.status(200).json({ success: true, message: 'Goal deleted successfully.' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ==========================================
  // 6. SESSIONS
  // ==========================================

  public static async scheduleSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { relationshipId } = req.params;
      const { title, sessionTopic, scheduledStart, scheduledEnd, durationMinutes, sessionType, meetingLink, agenda } = req.body;

      if (!title || !sessionTopic || !scheduledStart || !scheduledEnd) {
        res.status(400).json({
          success: false,
          message: 'title, sessionTopic, scheduledStart, and scheduledEnd are required.',
        });
        return;
      }

      const session = await MentorshipService.scheduleSession(userId, relationshipId, {
        title,
        sessionTopic,
        scheduledStart,
        scheduledEnd,
        durationMinutes,
        sessionType,
        meetingLink,
        agenda,
      });

      res.status(201).json({ success: true, data: session });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async listSessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { relationshipId } = req.params;
      const sessions = await MentorshipService.listSessions(userId, relationshipId);
      res.status(200).json({ success: true, data: sessions });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async updateSessionStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { relationshipId, sessionId } = req.params;
      const { status, cancellationReason } = req.body;

      const session = await MentorshipService.updateSessionStatus(
        userId,
        relationshipId,
        sessionId,
        status,
        cancellationReason
      );

      res.status(200).json({ success: true, data: session });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ==========================================
  // 7. MESSAGING & NOTES
  // ==========================================

  public static async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { relationshipId } = req.params;
      const messages = await MentorshipService.getMessages(userId, relationshipId);
      res.status(200).json({ success: true, data: messages });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const senderId = req.user?.sub;
      if (!senderId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { relationshipId } = req.params;
      const { content } = req.body;

      if (!content || !content.trim()) {
        res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
        return;
      }

      const message = await MentorshipService.sendMessage(senderId, relationshipId, content);
      res.status(201).json({ success: true, data: message });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async getNotes(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { relationshipId } = req.params;
      const notes = await MentorshipService.getNotes(userId, relationshipId);
      res.status(200).json({ success: true, data: notes });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async createNote(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.sub;
      if (!authorId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { relationshipId } = req.params;
      const { content, visibility, sessionId } = req.body;

      if (!content || !content.trim()) {
        res.status(400).json({ success: false, message: 'Note content cannot be empty.' });
        return;
      }

      const note = await MentorshipService.createNote(authorId, relationshipId, {
        content,
        visibility,
        sessionId,
      });

      res.status(201).json({ success: true, data: note });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async deleteNote(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { relationshipId, noteId } = req.params;
      await MentorshipService.deleteNote(userId, relationshipId, noteId);
      res.status(200).json({ success: true, message: 'Note deleted.' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ==========================================
  // 8. FEEDBACK
  // ==========================================

  public static async submitFeedback(req: Request, res: Response): Promise<void> {
    try {
      const submittedBy = req.user?.sub;
      if (!submittedBy) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { relationshipId } = req.params;
      const { rating, writtenFeedback, strengthsHighlight, areasToImprove, sessionId } = req.body;

      if (!rating || !writtenFeedback) {
        res.status(400).json({ success: false, message: 'rating and writtenFeedback are required.' });
        return;
      }

      const feedback = await MentorshipService.submitFeedback(submittedBy, relationshipId, {
        rating: Number(rating),
        writtenFeedback,
        strengthsHighlight,
        areasToImprove,
        sessionId,
      });

      res.status(201).json({ success: true, data: feedback });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async getMentorFeedback(req: Request, res: Response): Promise<void> {
    try {
      const { mentorProfileId } = req.params;
      const feedbacks = await MentorshipService.getMentorPublicFeedback(mentorProfileId);
      res.status(200).json({ success: true, data: feedbacks });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ==========================================
  // 9. GROUP MENTORSHIP
  // ==========================================

  public static async listGroupSessions(req: Request, res: Response): Promise<void> {
    try {
      const groups = await MentorshipService.listGroupSessions();
      res.status(200).json({ success: true, data: groups });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async createGroupSession(req: Request, res: Response): Promise<void> {
    try {
      const mentorId = req.user?.sub;
      if (!mentorId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { title, description, topic, maximumParticipants, scheduledStart, scheduledEnd, meetingLink } = req.body;
      if (!title || !description || !topic || !scheduledStart || !scheduledEnd) {
        res.status(400).json({
          success: false,
          message: 'title, description, topic, scheduledStart, and scheduledEnd are required.',
        });
        return;
      }

      const group = await MentorshipService.createGroupSession(mentorId, {
        title,
        description,
        topic,
        maximumParticipants,
        scheduledStart,
        scheduledEnd,
        meetingLink,
      });

      res.status(201).json({ success: true, data: group });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async joinGroupSession(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      if (!studentId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { groupId } = req.params;
      const group = await MentorshipService.joinGroupSession(studentId, groupId);
      res.status(200).json({ success: true, message: 'Successfully joined group session.', data: group });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async leaveGroupSession(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      if (!studentId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { groupId } = req.params;
      const group = await MentorshipService.leaveGroupSession(studentId, groupId);
      res.status(200).json({ success: true, message: 'Left group session.', data: group });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ==========================================
  // 10. AI ASSISTANT
  // ==========================================

  public static async prepareAgenda(req: Request, res: Response): Promise<void> {
    try {
      const { topic, objective, studentBackground, mentorDesignation } = req.body;
      if (!topic || !objective) {
        res.status(400).json({ success: false, message: 'topic and objective are required.' });
        return;
      }

      const agenda = await MentorshipAiAssistantService.prepareSessionAgenda(
        topic,
        objective,
        studentBackground,
        mentorDesignation
      );

      res.status(200).json({ success: true, data: agenda });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async suggestQuestions(req: Request, res: Response): Promise<void> {
    try {
      const { topic, objective, mentorIndustry } = req.body;
      if (!topic || !objective) {
        res.status(400).json({ success: false, message: 'topic and objective are required.' });
        return;
      }

      const questions = await MentorshipAiAssistantService.suggestDiscussionQuestions(
        topic,
        objective,
        mentorIndustry
      );

      res.status(200).json({ success: true, data: questions });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async summarizeNotes(req: Request, res: Response): Promise<void> {
    try {
      const { rawNotes, topic } = req.body;
      if (!rawNotes || !topic) {
        res.status(400).json({ success: false, message: 'rawNotes and topic are required.' });
        return;
      }

      const summary = await MentorshipAiAssistantService.summarizeNotesAndActionItems(rawNotes, topic);
      res.status(200).json({ success: true, data: summary });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ==========================================
  // 11. COLLEGE & ADMIN
  // ==========================================

  public static async getCollegeAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const collegeId = req.user?.sub;
      if (!collegeId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const report = await MentorshipService.getCollegeMentorshipAnalytics(collegeId);
      res.status(200).json({ success: true, data: report });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async getAdminVerificationQueue(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.query;
      const queue = await MentorshipService.getAdminVerificationQueue(
        typeof status === 'string' ? status : undefined
      );
      res.status(200).json({ success: true, data: queue });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async reviewMentorVerification(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user?.sub;
      if (!adminId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { mentorProfileId } = req.params;
      const { status, rejectionReason } = req.body;

      if (!status || !['VERIFIED', 'REJECTED', 'SUSPENDED'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Status must be VERIFIED, REJECTED, or SUSPENDED.',
        });
        return;
      }

      const reviewed = await MentorshipService.reviewMentorVerification(
        adminId,
        mentorProfileId,
        status,
        rejectionReason
      );

      res.status(200).json({
        success: true,
        message: `Mentor verification updated to ${status}.`,
        data: reviewed,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async getAdminAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const report = await MentorshipService.getAdminMentorshipAnalytics();
      res.status(200).json({ success: true, data: report });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
