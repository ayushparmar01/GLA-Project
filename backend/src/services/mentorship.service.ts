import mongoose from 'mongoose';
import {
  MentorProfile,
  IMentorProfile,
} from '../models/mentorProfile.model.js';
import {
  StudentMentorshipProfile,
  IStudentMentorshipProfile,
} from '../models/studentMentorshipProfile.model.js';
import {
  MentorshipRequest,
  IMentorshipRequest,
} from '../models/mentorshipRequest.model.js';
import {
  MentorshipRelationship,
  IMentorshipRelationship,
} from '../models/mentorshipRelationship.model.js';
import {
  MentorshipGoal,
  IMentorshipGoal,
} from '../models/mentorshipGoal.model.js';
import {
  MentorshipSession,
  IMentorshipSession,
} from '../models/mentorshipSession.model.js';
import {
  MentorshipMessage,
  IMentorshipMessage,
} from '../models/mentorshipMessage.model.js';
import {
  MentorshipNote,
  IMentorshipNote,
} from '../models/mentorshipNote.model.js';
import {
  MentorshipFeedback,
  IMentorshipFeedback,
} from '../models/mentorshipFeedback.model.js';
import {
  MentorshipGroup,
  IMentorshipGroup,
} from '../models/mentorshipGroup.model.js';
import { User, IUser } from '../models/user.model.js';
import { MentorMatchingService } from './mentorMatching.service.js';
import { MentorshipSchedulingService } from './mentorshipScheduling.service.js';
import {
  MentorProfileData,
  StudentMentorshipProfileData,
  MentorRecommendationData,
  MentorshipRequestData,
  MentorshipRelationshipData,
  MentorshipGoalData,
  MentorshipSessionData,
  MentorshipMessageData,
  MentorshipNoteData,
  MentorshipFeedbackData,
  MentorshipGroupData,
  CollegeMentorshipAnalyticsReport,
  AdminMentorshipAnalyticsReport,
  MentorshipSessionStatus,
  MentorshipRelationshipStatus,
} from '../types/index.js';

export class MentorshipService {
  // ==========================================
  // 1. MENTOR DISCOVERY & RECOMMENDATIONS
  // ==========================================

  public static async listVerifiedMentors(filters: {
    industry?: string;
    topic?: string;
    language?: string;
    isAlumni?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ mentors: MentorProfileData[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(50, filters.limit || 12));
    const skip = (page - 1) * limit;

    const query: any = { verificationStatus: 'VERIFIED' };

    if (filters.industry) {
      query.industry = new RegExp(`^${filters.industry}$`, 'i');
    }
    if (filters.topic) {
      query.mentorshipTopics = new RegExp(filters.topic, 'i');
    }
    if (filters.language) {
      query.languages = new RegExp(filters.language, 'i');
    }
    if (filters.isAlumni !== undefined) {
      query.isAlumni = filters.isAlumni;
    }
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { organization: searchRegex },
        { designation: searchRegex },
        { industry: searchRegex },
        { expertise: searchRegex },
        { mentorshipTopics: searchRegex },
        { almaMaterCollegeName: searchRegex },
      ];
    }

    const [profiles, total] = await Promise.all([
      MentorProfile.find(query).skip(skip).limit(limit).sort({ ratingAverage: -1, totalReviews: -1 }),
      MentorProfile.countDocuments(query),
    ]);

    // Attach user names
    const userIds = profiles.map((p) => p.userId);
    const users = await User.find({ _id: { $in: userIds } }).select('fullName email');
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const mentors = profiles.map((p) => {
      const u = userMap.get(p.userId.toString());
      return p.toSafeObject({ fullName: u?.fullName, email: u?.email });
    });

    return {
      mentors,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public static async getMentorRecommendations(
    studentUserId: string
  ): Promise<MentorRecommendationData[]> {
    const studentUser = await User.findById(studentUserId);
    if (!studentUser) {
      throw new Error('Student user not found');
    }

    const studentMentorshipProfile = await StudentMentorshipProfile.findOne({
      studentId: studentUserId,
    });

    // Find verified mentors
    const verifiedMentors = await MentorProfile.find({
      verificationStatus: 'VERIFIED',
      userId: { $ne: studentUserId },
    }).limit(20);

    const userIds = verifiedMentors.map((p) => p.userId);
    const users = await User.find({ _id: { $in: userIds } }).select('fullName email');
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const recommendations: MentorRecommendationData[] = verifiedMentors.map((p) => {
      const u = userMap.get(p.userId.toString());
      const safeMentor = p.toSafeObject({ fullName: u?.fullName, email: u?.email });
      return MentorMatchingService.calculateMatch(
        safeMentor,
        studentMentorshipProfile ? studentMentorshipProfile.toSafeObject() : null,
        studentUser.studentProfile || null
      );
    });

    // Sort by compatibility score descending
    recommendations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    return recommendations;
  }

  public static async getMentorProfileById(mentorProfileId: string): Promise<MentorProfileData> {
    const profile = await MentorProfile.findById(mentorProfileId);
    if (!profile) {
      throw new Error('Mentor profile not found');
    }
    const user = await User.findById(profile.userId).select('fullName email');
    return profile.toSafeObject({ fullName: user?.fullName, email: user?.email });
  }

  public static async getMentorProfileByUserId(userId: string): Promise<MentorProfileData | null> {
    const profile = await MentorProfile.findOne({ userId });
    if (!profile) return null;
    const user = await User.findById(profile.userId).select('fullName email');
    return profile.toSafeObject({ fullName: user?.fullName, email: user?.email });
  }

  public static async upsertMentorProfile(
    userId: string,
    data: Partial<MentorProfileData>
  ): Promise<MentorProfileData> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User account not found');
    }

    let profile = await MentorProfile.findOne({ userId });
    if (!profile) {
      profile = new MentorProfile({
        userId,
        organization: data.organization || 'Independent Professional',
        designation: data.designation || 'Software Engineer',
        experienceYears: data.experienceYears !== undefined ? data.experienceYears : 1,
        industry: data.industry || 'Software & IT',
        expertise: data.expertise || [],
        mentorshipTopics: data.mentorshipTopics || ['Career Advice'],
        bio: data.bio || '',
        languages: data.languages || ['English'],
        isAlumni: Boolean(data.isAlumni),
        almaMaterCollegeId: data.almaMaterCollegeId,
        almaMaterCollegeName: data.almaMaterCollegeName,
        graduationYear: data.graduationYear,
        branch: data.branch,
        linkedinUrl: data.linkedinUrl,
        maximumMentees: data.maximumMentees || 3,
        verificationStatus: 'PENDING', // Initial registration requires admin review
        verificationEvidence: data.verificationEvidence || {},
        availableDays: data.availableDays || ['Saturday', 'Sunday'],
        timeSlots: data.timeSlots || [],
      });
    } else {
      // Prevent user from self-approving verification status
      if (data.organization) profile.organization = data.organization;
      if (data.designation) profile.designation = data.designation;
      if (data.experienceYears !== undefined) profile.experienceYears = data.experienceYears;
      if (data.industry) profile.industry = data.industry;
      if (data.expertise) profile.expertise = data.expertise;
      if (data.mentorshipTopics) profile.mentorshipTopics = data.mentorshipTopics;
      if (data.bio !== undefined) profile.bio = data.bio;
      if (data.languages) profile.languages = data.languages;
      if (data.isAlumni !== undefined) profile.isAlumni = data.isAlumni;
      if (data.almaMaterCollegeId) profile.almaMaterCollegeId = new mongoose.Types.ObjectId(data.almaMaterCollegeId);
      if (data.almaMaterCollegeName) profile.almaMaterCollegeName = data.almaMaterCollegeName;
      if (data.graduationYear !== undefined) profile.graduationYear = data.graduationYear;
      if (data.branch) profile.branch = data.branch;
      if (data.linkedinUrl) profile.linkedinUrl = data.linkedinUrl;
      if (data.maximumMentees !== undefined) profile.maximumMentees = data.maximumMentees;
      if (data.availableDays) profile.availableDays = data.availableDays;
      if (data.timeSlots) profile.timeSlots = data.timeSlots;
      if (data.verificationEvidence) {
        profile.verificationEvidence = {
          ...profile.verificationEvidence,
          ...data.verificationEvidence,
        };
      }
    }

    await profile.save();
    return profile.toSafeObject({ fullName: user.fullName, email: user.email });
  }

  // ==========================================
  // 2. STUDENT MENTORSHIP PROFILE
  // ==========================================

  public static async getStudentMentorshipProfile(
    studentId: string
  ): Promise<StudentMentorshipProfileData> {
    let profile = await StudentMentorshipProfile.findOne({ studentId });
    if (!profile) {
      profile = new StudentMentorshipProfile({
        studentId,
        careerGoals: [],
        preferredTopics: [],
        preferredIndustries: [],
        preferredLanguages: ['English'],
        preferredSessionTypes: ['ONE_ON_ONE', 'GROUP'],
      });
      await profile.save();
    }
    return profile.toSafeObject();
  }

  public static async updateStudentMentorshipProfile(
    studentId: string,
    updates: Partial<StudentMentorshipProfileData>
  ): Promise<StudentMentorshipProfileData> {
    let profile = await StudentMentorshipProfile.findOne({ studentId });
    if (!profile) {
      profile = new StudentMentorshipProfile({
        studentId,
        ...updates,
      });
    } else {
      if (updates.careerGoals) profile.careerGoals = updates.careerGoals;
      if (updates.preferredTopics) profile.preferredTopics = updates.preferredTopics;
      if (updates.preferredIndustries) profile.preferredIndustries = updates.preferredIndustries;
      if (updates.preferredLanguages) profile.preferredLanguages = updates.preferredLanguages;
      if (updates.preferredSessionTypes) profile.preferredSessionTypes = updates.preferredSessionTypes;
    }
    await profile.save();
    return profile.toSafeObject();
  }

  // ==========================================
  // 3. MENTORSHIP REQUESTS & WORKFLOW
  // ==========================================

  public static async createMentorshipRequest(
    studentId: string,
    data: {
      mentorProfileId: string;
      topic: string;
      objective: string;
      introduction: string;
      preferredFormat?: 'ONE_ON_ONE' | 'GROUP';
    }
  ): Promise<MentorshipRequestData> {
    const mentorProfile = await MentorProfile.findById(data.mentorProfileId);
    if (!mentorProfile) {
      throw new Error('Mentor profile not found');
    }

    if (mentorProfile.verificationStatus !== 'VERIFIED') {
      throw new Error('Mentorship can only be requested from verified mentors.');
    }

    if (mentorProfile.userId.toString() === studentId) {
      throw new Error('Cannot request mentorship from yourself.');
    }

    // Check capacity
    if (mentorProfile.activeMenteeCount >= mentorProfile.maximumMentees) {
      throw new Error('This mentor has reached their maximum active mentee capacity.');
    }

    // Check duplicate pending request
    const existingPending = await MentorshipRequest.findOne({
      studentId,
      mentorProfileId: data.mentorProfileId,
      status: 'PENDING',
    });
    if (existingPending) {
      throw new Error('You already have a pending mentorship request with this mentor.');
    }

    const studentUser = await User.findById(studentId).select('fullName email');
    const mentorUser = await User.findById(mentorProfile.userId).select('fullName');

    const request = new MentorshipRequest({
      studentId,
      mentorId: mentorProfile.userId,
      mentorProfileId: mentorProfile._id,
      topic: data.topic,
      objective: data.objective,
      introduction: data.introduction,
      preferredFormat: data.preferredFormat || 'ONE_ON_ONE',
      status: 'PENDING',
    });

    await request.save();
    return request.toSafeObject({
      studentName: studentUser?.fullName,
      studentEmail: studentUser?.email,
      mentorName: mentorUser?.fullName,
    });
  }

  public static async respondToMentorshipRequest(
    mentorUserId: string,
    requestId: string,
    response: { status: 'ACCEPTED' | 'REJECTED'; responseMessage?: string }
  ): Promise<{ request: MentorshipRequestData; relationship?: MentorshipRelationshipData }> {
    const request = await MentorshipRequest.findById(requestId);
    if (!request) {
      throw new Error('Mentorship request not found');
    }

    if (request.mentorId.toString() !== mentorUserId) {
      throw new Error('Unauthorized to respond to this mentorship request');
    }

    if (request.status !== 'PENDING') {
      throw new Error(`Request has already been ${request.status.toLowerCase()}`);
    }

    const mentorProfile = await MentorProfile.findById(request.mentorProfileId);
    if (!mentorProfile) {
      throw new Error('Mentor profile not found');
    }

    request.status = response.status;
    request.responseMessage = response.responseMessage || '';
    request.respondedAt = new Date();
    await request.save();

    let relationshipData: MentorshipRelationshipData | undefined;

    if (response.status === 'ACCEPTED') {
      // Create MentorshipRelationship
      const relationship = new MentorshipRelationship({
        studentId: request.studentId,
        mentorId: request.mentorId,
        mentorProfileId: request.mentorProfileId,
        requestId: request._id,
        topic: request.topic,
        primaryObjective: request.objective,
        status: 'ACTIVE',
        startDate: new Date(),
      });
      await relationship.save();

      // Update mentor mentee count
      mentorProfile.activeMenteeCount = (mentorProfile.activeMenteeCount || 0) + 1;
      await mentorProfile.save();

      // Update student active count
      await StudentMentorshipProfile.findOneAndUpdate(
        { studentId: request.studentId },
        { $inc: { currentMentorshipCount: 1 } },
        { upsert: true }
      );

      const [studentUser, mentorUser] = await Promise.all([
        User.findById(request.studentId).select('fullName email'),
        User.findById(request.mentorId).select('fullName'),
      ]);

      relationshipData = relationship.toSafeObject({
        studentName: studentUser?.fullName,
        mentorName: mentorUser?.fullName,
        mentorOrganization: mentorProfile.organization,
        mentorDesignation: mentorProfile.designation,
      });
    }

    const studentUser = await User.findById(request.studentId).select('fullName email');
    const mentorUser = await User.findById(request.mentorId).select('fullName');

    return {
      request: request.toSafeObject({
        studentName: studentUser?.fullName,
        studentEmail: studentUser?.email,
        mentorName: mentorUser?.fullName,
      }),
      relationship: relationshipData,
    };
  }

  public static async listIncomingRequests(mentorUserId: string): Promise<MentorshipRequestData[]> {
    const requests = await MentorshipRequest.find({ mentorId: mentorUserId }).sort({ createdAt: -1 });
    const studentIds = requests.map((r) => r.studentId);
    const students = await User.find({ _id: { $in: studentIds } }).select('fullName email');
    const studentMap = new Map(students.map((s) => [s._id.toString(), s]));

    return requests.map((r) => {
      const s = studentMap.get(r.studentId.toString());
      return r.toSafeObject({ studentName: s?.fullName, studentEmail: s?.email });
    });
  }

  public static async listOutgoingRequests(studentUserId: string): Promise<MentorshipRequestData[]> {
    const requests = await MentorshipRequest.find({ studentId: studentUserId }).sort({ createdAt: -1 });
    const mentorIds = requests.map((r) => r.mentorId);
    const mentors = await User.find({ _id: { $in: mentorIds } }).select('fullName');
    const mentorMap = new Map(mentors.map((m) => [m._id.toString(), m]));

    return requests.map((r) => {
      const m = mentorMap.get(r.mentorId.toString());
      return r.toSafeObject({ mentorName: m?.fullName });
    });
  }

  // ==========================================
  // 4. RELATIONSHIP WORKSPACE & GOALS
  // ==========================================

  public static async listUserRelationships(userId: string): Promise<MentorshipRelationshipData[]> {
    const relationships = await MentorshipRelationship.find({
      $or: [{ studentId: userId }, { mentorId: userId }],
    }).sort({ createdAt: -1 });

    const studentIds = relationships.map((r) => r.studentId);
    const mentorIds = relationships.map((r) => r.mentorId);
    const profileIds = relationships.map((r) => r.mentorProfileId);

    const [students, mentors, profiles] = await Promise.all([
      User.find({ _id: { $in: studentIds } }).select('fullName'),
      User.find({ _id: { $in: mentorIds } }).select('fullName'),
      MentorProfile.find({ _id: { $in: profileIds } }).select('organization designation'),
    ]);

    const studentMap = new Map(students.map((s) => [s._id.toString(), s.fullName]));
    const mentorMap = new Map(mentors.map((m) => [m._id.toString(), m.fullName]));
    const profileMap = new Map(profiles.map((p) => [p._id.toString(), p]));

    return relationships.map((r) => {
      const p = profileMap.get(r.mentorProfileId.toString());
      return r.toSafeObject({
        studentName: studentMap.get(r.studentId.toString()),
        mentorName: mentorMap.get(r.mentorId.toString()),
        mentorOrganization: p?.organization,
        mentorDesignation: p?.designation,
      });
    });
  }

  public static async getRelationshipById(
    userId: string,
    relationshipId: string
  ): Promise<MentorshipRelationshipData> {
    const relationship = await MentorshipRelationship.findById(relationshipId);
    if (!relationship) {
      throw new Error('Mentorship relationship not found');
    }

    if (
      relationship.studentId.toString() !== userId &&
      relationship.mentorId.toString() !== userId
    ) {
      throw new Error('Unauthorized access to this mentorship workspace');
    }

    const [studentUser, mentorUser, mentorProfile] = await Promise.all([
      User.findById(relationship.studentId).select('fullName'),
      User.findById(relationship.mentorId).select('fullName'),
      MentorProfile.findById(relationship.mentorProfileId).select('organization designation'),
    ]);

    return relationship.toSafeObject({
      studentName: studentUser?.fullName,
      mentorName: mentorUser?.fullName,
      mentorOrganization: mentorProfile?.organization,
      mentorDesignation: mentorProfile?.designation,
    });
  }

  public static async updateRelationshipStatus(
    userId: string,
    relationshipId: string,
    status: MentorshipRelationshipStatus
  ): Promise<MentorshipRelationshipData> {
    const relationship = await MentorshipRelationship.findById(relationshipId);
    if (!relationship) {
      throw new Error('Mentorship relationship not found');
    }

    if (
      relationship.studentId.toString() !== userId &&
      relationship.mentorId.toString() !== userId
    ) {
      throw new Error('Unauthorized to update this relationship');
    }

    const previousStatus = relationship.status;
    relationship.status = status;
    if (status === 'COMPLETED' || status === 'TERMINATED') {
      relationship.endDate = new Date();

      // Decrement mentor active mentee count if previously active
      if (previousStatus === 'ACTIVE') {
        await MentorProfile.findByIdAndUpdate(relationship.mentorProfileId, {
          $inc: { activeMenteeCount: -1 },
        });
        await StudentMentorshipProfile.findOneAndUpdate(
          { studentId: relationship.studentId },
          { $inc: { currentMentorshipCount: -1 } }
        );
      }
    }

    await relationship.save();
    return this.getRelationshipById(userId, relationshipId);
  }

  // --- GOALS ---
  public static async createGoal(
    userId: string,
    relationshipId: string,
    goalData: { title: string; description?: string; priority?: 'HIGH' | 'MEDIUM' | 'LOW'; targetDate?: string }
  ): Promise<MentorshipGoalData> {
    const rel = await MentorshipRelationship.findById(relationshipId);
    if (!rel) throw new Error('Relationship not found');
    if (rel.studentId.toString() !== userId && rel.mentorId.toString() !== userId) {
      throw new Error('Unauthorized to add goals to this workspace');
    }

    const goal = new MentorshipGoal({
      relationshipId,
      studentId: rel.studentId,
      mentorId: rel.mentorId,
      title: goalData.title,
      description: goalData.description || '',
      priority: goalData.priority || 'MEDIUM',
      targetDate: goalData.targetDate ? new Date(goalData.targetDate) : undefined,
      progress: 0,
      status: 'NOT_STARTED',
    });
    await goal.save();

    // Update relationship total goals count
    rel.totalGoals = (rel.totalGoals || 0) + 1;
    await rel.save();

    return goal.toSafeObject();
  }

  public static async listGoals(userId: string, relationshipId: string): Promise<MentorshipGoalData[]> {
    const rel = await MentorshipRelationship.findById(relationshipId);
    if (!rel) throw new Error('Relationship not found');
    if (rel.studentId.toString() !== userId && rel.mentorId.toString() !== userId) {
      throw new Error('Unauthorized access');
    }

    const goals = await MentorshipGoal.find({ relationshipId }).sort({ createdAt: -1 });
    return goals.map((g) => g.toSafeObject());
  }

  public static async updateGoal(
    userId: string,
    relationshipId: string,
    goalId: string,
    updates: { progress?: number; status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'; title?: string; description?: string; priority?: 'HIGH' | 'MEDIUM' | 'LOW' }
  ): Promise<MentorshipGoalData> {
    const rel = await MentorshipRelationship.findById(relationshipId);
    if (!rel) throw new Error('Relationship not found');
    if (rel.studentId.toString() !== userId && rel.mentorId.toString() !== userId) {
      throw new Error('Unauthorized');
    }

    const goal = await MentorshipGoal.findOne({ _id: goalId, relationshipId });
    if (!goal) throw new Error('Goal not found');

    if (updates.title) goal.title = updates.title;
    if (updates.description !== undefined) goal.description = updates.description;
    if (updates.priority) goal.priority = updates.priority;
    if (updates.progress !== undefined) {
      goal.progress = Math.min(100, Math.max(0, updates.progress));
      if (goal.progress === 100) goal.status = 'COMPLETED';
      else if (goal.progress > 0) goal.status = 'IN_PROGRESS';
    }
    if (updates.status) {
      goal.status = updates.status;
      if (updates.status === 'COMPLETED') goal.progress = 100;
    }

    await goal.save();

    // Recalculate relationship progress
    const allGoals = await MentorshipGoal.find({ relationshipId });
    if (allGoals.length > 0) {
      const completed = allGoals.filter((g) => g.status === 'COMPLETED').length;
      const totalProgressSum = allGoals.reduce((sum, g) => sum + (g.progress || 0), 0);
      rel.completedGoals = completed;
      rel.totalGoals = allGoals.length;
      rel.overallProgress = Math.round(totalProgressSum / allGoals.length);
      await rel.save();
    }

    return goal.toSafeObject();
  }

  public static async deleteGoal(
    userId: string,
    relationshipId: string,
    goalId: string
  ): Promise<{ success: boolean }> {
    const rel = await MentorshipRelationship.findById(relationshipId);
    if (!rel) throw new Error('Relationship not found');
    if (rel.studentId.toString() !== userId && rel.mentorId.toString() !== userId) {
      throw new Error('Unauthorized');
    }

    await MentorshipGoal.findOneAndDelete({ _id: goalId, relationshipId });
    const allGoals = await MentorshipGoal.find({ relationshipId });
    rel.totalGoals = allGoals.length;
    rel.completedGoals = allGoals.filter((g) => g.status === 'COMPLETED').length;
    rel.overallProgress = allGoals.length > 0
      ? Math.round(allGoals.reduce((s, g) => s + (g.progress || 0), 0) / allGoals.length)
      : 0;
    await rel.save();

    return { success: true };
  }

  // ==========================================
  // 5. SESSION SCHEDULING
  // ==========================================

  public static async scheduleSession(
    userId: string,
    relationshipId: string,
    sessionData: {
      title: string;
      sessionTopic: string;
      scheduledStart: string;
      scheduledEnd: string;
      durationMinutes?: number;
      sessionType?: 'ONE_ON_ONE' | 'GROUP';
      meetingLink?: string;
      agenda?: string[];
    }
  ): Promise<MentorshipSessionData> {
    const rel = await MentorshipRelationship.findById(relationshipId);
    if (!rel) throw new Error('Relationship not found');
    if (rel.studentId.toString() !== userId && rel.mentorId.toString() !== userId) {
      throw new Error('Unauthorized');
    }

    const start = new Date(sessionData.scheduledStart);
    const end = new Date(sessionData.scheduledEnd);

    // Concurrency overlap validation
    const validation = await MentorshipSchedulingService.validateSessionSchedule(
      rel.mentorId.toString(),
      rel.studentId.toString(),
      start,
      end
    );

    if (!validation.valid) {
      throw new Error(validation.conflictReason || 'Session scheduling conflict detected');
    }

    const meetingLink =
      sessionData.meetingLink && sessionData.meetingLink.trim()
        ? sessionData.meetingLink.trim()
        : MentorshipSchedulingService.generateMeetingLink(relationshipId);

    const session = new MentorshipSession({
      relationshipId,
      mentorId: rel.mentorId,
      studentId: rel.studentId,
      title: sessionData.title,
      sessionTopic: sessionData.sessionTopic,
      scheduledStart: start,
      scheduledEnd: end,
      durationMinutes: sessionData.durationMinutes || 45,
      sessionType: sessionData.sessionType || 'ONE_ON_ONE',
      meetingLink,
      status: 'CONFIRMED',
      agenda: sessionData.agenda || [],
    });

    await session.save();
    return session.toSafeObject();
  }

  public static async listSessions(
    userId: string,
    relationshipId: string
  ): Promise<MentorshipSessionData[]> {
    const rel = await MentorshipRelationship.findById(relationshipId);
    if (!rel) throw new Error('Relationship not found');
    if (rel.studentId.toString() !== userId && rel.mentorId.toString() !== userId) {
      throw new Error('Unauthorized');
    }

    const sessions = await MentorshipSession.find({ relationshipId }).sort({ scheduledStart: -1 });
    return sessions.map((s) => s.toSafeObject());
  }

  public static async updateSessionStatus(
    userId: string,
    relationshipId: string,
    sessionId: string,
    status: MentorshipSessionStatus,
    cancellationReason?: string
  ): Promise<MentorshipSessionData> {
    const session = await MentorshipSession.findOne({ _id: sessionId, relationshipId });
    if (!session) throw new Error('Session not found');

    if (session.mentorId.toString() !== userId && session.studentId.toString() !== userId) {
      throw new Error('Unauthorized to update this session');
    }

    const prevStatus = session.status;
    session.status = status;
    if (cancellationReason) session.cancellationReason = cancellationReason;
    await session.save();

    if (status === 'COMPLETED' && prevStatus !== 'COMPLETED') {
      await MentorshipRelationship.findByIdAndUpdate(relationshipId, {
        $inc: { completedSessions: 1 },
      });
      await MentorProfile.findOneAndUpdate(
        { userId: session.mentorId },
        { $inc: { totalSessionsCompleted: 1 } }
      );
    }

    return session.toSafeObject();
  }

  // ==========================================
  // 6. MESSAGING & PRIVATE NOTES
  // ==========================================

  public static async getMessages(
    userId: string,
    relationshipId: string
  ): Promise<MentorshipMessageData[]> {
    const rel = await MentorshipRelationship.findById(relationshipId);
    if (!rel) throw new Error('Relationship not found');
    if (rel.studentId.toString() !== userId && rel.mentorId.toString() !== userId) {
      throw new Error('Unauthorized');
    }

    const messages = await MentorshipMessage.find({ relationshipId }).sort({ createdAt: 1 });
    const userIds = Array.from(new Set(messages.map((m) => m.senderId.toString())));
    const users = await User.find({ _id: { $in: userIds } }).select('fullName');
    const userMap = new Map(users.map((u) => [u._id.toString(), u.fullName]));

    return messages.map((m) =>
      m.toSafeObject({ senderName: userMap.get(m.senderId.toString()) })
    );
  }

  public static async sendMessage(
    senderId: string,
    relationshipId: string,
    content: string
  ): Promise<MentorshipMessageData> {
    const rel = await MentorshipRelationship.findById(relationshipId);
    if (!rel) throw new Error('Relationship not found');
    if (rel.studentId.toString() !== senderId && rel.mentorId.toString() !== senderId) {
      throw new Error('Unauthorized sender');
    }

    const receiverId =
      rel.studentId.toString() === senderId ? rel.mentorId : rel.studentId;

    const message = new MentorshipMessage({
      relationshipId,
      senderId,
      receiverId,
      content,
    });
    await message.save();

    const senderUser = await User.findById(senderId).select('fullName');
    return message.toSafeObject({ senderName: senderUser?.fullName });
  }

  public static async getNotes(
    userId: string,
    relationshipId: string
  ): Promise<MentorshipNoteData[]> {
    const rel = await MentorshipRelationship.findById(relationshipId);
    if (!rel) throw new Error('Relationship not found');
    if (rel.studentId.toString() !== userId && rel.mentorId.toString() !== userId) {
      throw new Error('Unauthorized');
    }

    // Strict privacy: SHARED notes are visible to both; PRIVATE notes ONLY to author!
    const notes = await MentorshipNote.find({
      relationshipId,
      $or: [{ visibility: 'SHARED' }, { authorId: userId }],
    }).sort({ createdAt: -1 });

    const authorIds = Array.from(new Set(notes.map((n) => n.authorId.toString())));
    const authors = await User.find({ _id: { $in: authorIds } }).select('fullName');
    const authorMap = new Map(authors.map((a) => [a._id.toString(), a.fullName]));

    return notes.map((n) =>
      n.toSafeObject({ authorName: authorMap.get(n.authorId.toString()) })
    );
  }

  public static async createNote(
    authorId: string,
    relationshipId: string,
    data: { content: string; visibility?: 'PRIVATE' | 'SHARED'; sessionId?: string }
  ): Promise<MentorshipNoteData> {
    const rel = await MentorshipRelationship.findById(relationshipId);
    if (!rel) throw new Error('Relationship not found');
    if (rel.studentId.toString() !== authorId && rel.mentorId.toString() !== authorId) {
      throw new Error('Unauthorized');
    }

    const note = new MentorshipNote({
      relationshipId,
      sessionId: data.sessionId,
      authorId,
      content: data.content,
      visibility: data.visibility || 'PRIVATE',
    });
    await note.save();

    const author = await User.findById(authorId).select('fullName');
    return note.toSafeObject({ authorName: author?.fullName });
  }

  public static async deleteNote(
    userId: string,
    relationshipId: string,
    noteId: string
  ): Promise<{ success: boolean }> {
    const note = await MentorshipNote.findOne({ _id: noteId, relationshipId });
    if (!note) throw new Error('Note not found');
    if (note.authorId.toString() !== userId) {
      throw new Error('Unauthorized to delete note created by another participant');
    }
    await note.deleteOne();
    return { success: true };
  }

  // ==========================================
  // 7. FEEDBACK & REVIEWS
  // ==========================================

  public static async submitFeedback(
    submittedBy: string,
    relationshipId: string,
    feedbackData: {
      sessionId?: string;
      rating: number;
      writtenFeedback: string;
      strengthsHighlight?: string[];
      areasToImprove?: string[];
    }
  ): Promise<MentorshipFeedbackData> {
    const rel = await MentorshipRelationship.findById(relationshipId);
    if (!rel) throw new Error('Relationship not found');
    if (rel.studentId.toString() !== submittedBy && rel.mentorId.toString() !== submittedBy) {
      throw new Error('Unauthorized to submit feedback for this relationship');
    }

    const isStudent = rel.studentId.toString() === submittedBy;
    const targetUserId = isStudent ? rel.mentorId : rel.studentId;
    const role = isStudent ? 'STUDENT' : 'MENTOR';

    // Prevent duplicate feedback for the same session
    if (feedbackData.sessionId) {
      const existing = await MentorshipFeedback.findOne({
        relationshipId,
        sessionId: feedbackData.sessionId,
        submittedBy,
      });
      if (existing) {
        throw new Error('You have already submitted feedback for this session.');
      }
    }

    const feedback = new MentorshipFeedback({
      relationshipId,
      sessionId: feedbackData.sessionId,
      submittedBy,
      targetUserId,
      role,
      rating: Math.min(5, Math.max(1, feedbackData.rating)),
      writtenFeedback: feedbackData.writtenFeedback,
      strengthsHighlight: feedbackData.strengthsHighlight || [],
      areasToImprove: feedbackData.areasToImprove || [],
      isPublic: true,
    });
    await feedback.save();

    // If student rated mentor, recalculate mentor rating
    if (isStudent) {
      const mentorProfile = await MentorProfile.findById(rel.mentorProfileId);
      if (mentorProfile) {
        const allMentorFeedbacks = await MentorshipFeedback.find({
          targetUserId: rel.mentorId,
          role: 'STUDENT',
        });
        const total = allMentorFeedbacks.length;
        const avg = total > 0
          ? Number((allMentorFeedbacks.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(1))
          : 5.0;
        mentorProfile.ratingAverage = avg;
        mentorProfile.totalReviews = total;
        await mentorProfile.save();
      }
    }

    return feedback.toSafeObject();
  }

  public static async getMentorPublicFeedback(
    mentorProfileId: string
  ): Promise<MentorshipFeedbackData[]> {
    const mentorProfile = await MentorProfile.findById(mentorProfileId);
    if (!mentorProfile) throw new Error('Mentor profile not found');

    const feedbacks = await MentorshipFeedback.find({
      targetUserId: mentorProfile.userId,
      role: 'STUDENT',
      isPublic: true,
    }).sort({ createdAt: -1 });

    return feedbacks.map((f) => f.toSafeObject());
  }

  // ==========================================
  // 8. GROUP MENTORSHIP SESSIONS
  // ==========================================

  public static async listGroupSessions(): Promise<MentorshipGroupData[]> {
    const groups = await MentorshipGroup.find({
      status: { $in: ['SCHEDULED', 'ACTIVE'] },
    }).sort({ scheduledStart: 1 });

    const mentorIds = groups.map((g) => g.mentorId);
    const [mentors, profiles] = await Promise.all([
      User.find({ _id: { $in: mentorIds } }).select('fullName'),
      MentorProfile.find({ userId: { $in: mentorIds } }).select('organization userId'),
    ]);

    const mentorNameMap = new Map(mentors.map((m) => [m._id.toString(), m.fullName]));
    const mentorOrgMap = new Map(profiles.map((p) => [p.userId.toString(), p.organization]));

    return groups.map((g) =>
      g.toSafeObject({
        mentorName: mentorNameMap.get(g.mentorId.toString()),
        mentorOrganization: mentorOrgMap.get(g.mentorId.toString()),
      })
    );
  }

  public static async createGroupSession(
    mentorUserId: string,
    data: {
      title: string;
      description: string;
      topic: string;
      maximumParticipants?: number;
      scheduledStart: string;
      scheduledEnd: string;
      meetingLink?: string;
    }
  ): Promise<MentorshipGroupData> {
    const mentorUser = await User.findById(mentorUserId);
    const mentorProfile = await MentorProfile.findOne({ userId: mentorUserId });
    if (!mentorProfile || mentorProfile.verificationStatus !== 'VERIFIED') {
      throw new Error('Only verified mentors can host group mentorship sessions.');
    }

    const meetingLink =
      data.meetingLink ||
      `https://meet.careerbridge.in/group-${new mongoose.Types.ObjectId().toString().slice(-6)}`;

    const group = new MentorshipGroup({
      mentorId: mentorUserId,
      title: data.title,
      description: data.description,
      topic: data.topic,
      maximumParticipants: data.maximumParticipants || 25,
      currentParticipantCount: 0,
      memberIds: [],
      scheduledStart: new Date(data.scheduledStart),
      scheduledEnd: new Date(data.scheduledEnd),
      meetingLink,
      status: 'SCHEDULED',
    });
    await group.save();

    return group.toSafeObject({
      mentorName: mentorUser?.fullName,
      mentorOrganization: mentorProfile.organization,
    });
  }

  public static async joinGroupSession(
    studentUserId: string,
    groupId: string
  ): Promise<MentorshipGroupData> {
    const group = await MentorshipGroup.findById(groupId);
    if (!group) throw new Error('Group session not found');

    if (group.memberIds.some((id) => id.toString() === studentUserId)) {
      throw new Error('You have already joined this group session.');
    }

    if (group.memberIds.length >= group.maximumParticipants) {
      throw new Error('This group session has reached its participant capacity.');
    }

    group.memberIds.push(new mongoose.Types.ObjectId(studentUserId));
    group.currentParticipantCount = group.memberIds.length;
    await group.save();

    const mentorUser = await User.findById(group.mentorId).select('fullName');
    const mentorProfile = await MentorProfile.findOne({ userId: group.mentorId }).select('organization');

    return group.toSafeObject({
      mentorName: mentorUser?.fullName,
      mentorOrganization: mentorProfile?.organization,
    });
  }

  public static async leaveGroupSession(
    studentUserId: string,
    groupId: string
  ): Promise<MentorshipGroupData> {
    const group = await MentorshipGroup.findById(groupId);
    if (!group) throw new Error('Group session not found');

    group.memberIds = group.memberIds.filter((id) => id.toString() !== studentUserId);
    group.currentParticipantCount = group.memberIds.length;
    await group.save();

    const mentorUser = await User.findById(group.mentorId).select('fullName');
    const mentorProfile = await MentorProfile.findOne({ userId: group.mentorId }).select('organization');

    return group.toSafeObject({
      mentorName: mentorUser?.fullName,
      mentorOrganization: mentorProfile?.organization,
    });
  }

  // ==========================================
  // 9. COLLEGE & ADMIN ANALYTICS
  // ==========================================

  public static async getCollegeMentorshipAnalytics(
    collegeId: string
  ): Promise<CollegeMentorshipAnalyticsReport> {
    const college = await User.findById(collegeId);
    const collegeName = (college as any)?.institutionName || college?.collegeProfile?.institutionName || 'Partner College';

    // Aggregate alumni mentors linked to this college
    const alumniMentors = await MentorProfile.find({
      $or: [{ almaMaterCollegeId: collegeId }, { isAlumni: true }],
    });

    const totalAlumniMentors = alumniMentors.length;
    const verifiedAlumniMentors = alumniMentors.filter((m) => m.verificationStatus === 'VERIFIED').length;

    // Student counts
    const studentsInCollege = await User.find({
      role: 'STUDENT',
      'studentProfile.collegeName': collegeName,
    }).select('_id');
    const studentIds = studentsInCollege.map((s) => s._id);

    const activeRelationships = await MentorshipRelationship.find({
      studentId: { $in: studentIds },
      status: 'ACTIVE',
    });

    const sessions = await MentorshipSession.find({
      studentId: { $in: studentIds },
      status: 'COMPLETED',
    });

    const topTopicsMap = new Map<string, number>();
    for (const rel of activeRelationships) {
      if (rel.topic) {
        topTopicsMap.set(rel.topic, (topTopicsMap.get(rel.topic) || 0) + 1);
      }
    }

    const topIndustriesMap = new Map<string, number>();
    for (const m of alumniMentors) {
      if (m.industry) {
        topIndustriesMap.set(m.industry, (topIndustriesMap.get(m.industry) || 0) + 1);
      }
    }

    const avgRating =
      alumniMentors.length > 0
        ? Number(
            (
              alumniMentors.reduce((sum, m) => sum + (m.ratingAverage || 5.0), 0) /
              alumniMentors.length
            ).toFixed(1)
          )
        : 5.0;

    return {
      collegeId,
      collegeName,
      totalAlumniMentors,
      verifiedAlumniMentors,
      totalMentorshipSessions: sessions.length,
      activeStudentMentees: activeRelationships.length,
      averageSatisfactionRating: avgRating,
      topMentorshipTopics: Array.from(topTopicsMap.entries()).map(([topic, count]) => ({
        topic,
        count,
      })),
      topIndustriesRepresented: Array.from(topIndustriesMap.entries()).map(([industry, count]) => ({
        industry,
        count,
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  public static async getAdminVerificationQueue(
    status?: string
  ): Promise<MentorProfileData[]> {
    const query: any = {};
    if (status) query.verificationStatus = status;
    else query.verificationStatus = { $in: ['PENDING', 'UNDER_REVIEW'] };

    const profiles = await MentorProfile.find(query).sort({ createdAt: -1 });
    const userIds = profiles.map((p) => p.userId);
    const users = await User.find({ _id: { $in: userIds } }).select('fullName email');
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    return profiles.map((p) => {
      const u = userMap.get(p.userId.toString());
      return p.toSafeObject({ fullName: u?.fullName, email: u?.email });
    });
  }

  public static async reviewMentorVerification(
    adminId: string,
    mentorProfileId: string,
    status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED',
    rejectionReason?: string
  ): Promise<MentorProfileData> {
    const profile = await MentorProfile.findById(mentorProfileId);
    if (!profile) throw new Error('Mentor profile not found');

    profile.verificationStatus = status;
    profile.verificationReviewedAt = new Date();
    profile.verificationReviewedBy = new mongoose.Types.ObjectId(adminId);
    if (rejectionReason) profile.verificationRejectionReason = rejectionReason;

    await profile.save();
    const user = await User.findById(profile.userId).select('fullName email');
    return profile.toSafeObject({ fullName: user?.fullName, email: user?.email });
  }

  public static async getAdminMentorshipAnalytics(): Promise<AdminMentorshipAnalyticsReport> {
    const [
      totalMentorsRegistered,
      verifiedMentors,
      pendingVerifications,
      rejectedMentors,
      suspendedMentors,
      totalActiveRelationships,
      totalSessionsConducted,
      allVerified,
    ] = await Promise.all([
      MentorProfile.countDocuments(),
      MentorProfile.countDocuments({ verificationStatus: 'VERIFIED' }),
      MentorProfile.countDocuments({ verificationStatus: { $in: ['PENDING', 'UNDER_REVIEW'] } }),
      MentorProfile.countDocuments({ verificationStatus: 'REJECTED' }),
      MentorProfile.countDocuments({ verificationStatus: 'SUSPENDED' }),
      MentorshipRelationship.countDocuments({ status: 'ACTIVE' }),
      MentorshipSession.countDocuments({ status: 'COMPLETED' }),
      MentorProfile.find({ verificationStatus: 'VERIFIED' }),
    ]);

    const avgRating =
      allVerified.length > 0
        ? Number(
            (
              allVerified.reduce((sum, m) => sum + (m.ratingAverage || 5.0), 0) /
              allVerified.length
            ).toFixed(1)
          )
        : 5.0;

    const topicCounts = new Map<string, number>();
    const industryCounts = new Map<string, number>();

    for (const m of allVerified) {
      if (m.industry) {
        industryCounts.set(m.industry, (industryCounts.get(m.industry) || 0) + 1);
      }
      for (const t of m.mentorshipTopics || []) {
        topicCounts.set(t, (topicCounts.get(t) || 0) + 1);
      }
    }

    return {
      totalMentorsRegistered,
      verifiedMentors,
      pendingVerifications,
      rejectedMentors,
      suspendedMentors,
      totalActiveRelationships,
      totalSessionsConducted,
      averagePlatformRating: avgRating,
      popularMentorshipTopics: Array.from(topicCounts.entries())
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      topIndustries: Array.from(industryCounts.entries())
        .map(([industry, count]) => ({ industry, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      generatedAt: new Date().toISOString(),
    };
  }
}
