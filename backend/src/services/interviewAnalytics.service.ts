import mongoose from 'mongoose';
import {
  StudentInterviewAnalytics,
  PersonalizedInterviewRoadmap,
  CollegeInterviewAnalyticsReport,
} from '../types/index.js';
import { MockInterviewSession } from '../models/mockInterviewSession.model.js';
import { User, IUser } from '../models/user.model.js';
import { SkillGapAnalysisService } from './skillGapAnalysis.service.js';
import { getDbStatus } from '../config/db.js';

export class InterviewAnalyticsService {
  /**
   * Calculates comprehensive personal interview performance analytics for a student.
   */
  public static async getStudentAnalytics(studentId: string): Promise<StudentInterviewAnalytics> {
    const dbStatus = getDbStatus();
    if (dbStatus.status !== 'connected') {
      return this.getEmptyStudentAnalytics();
    }

    const sessions = await MockInterviewSession.find({
      studentId: new mongoose.Types.ObjectId(studentId),
    }).sort({ createdAt: 1 });

    if (sessions.length === 0) {
      return this.getEmptyStudentAnalytics();
    }

    const totalSessions = sessions.length;
    const completedSessionsList = sessions.filter((s) => s.status === 'COMPLETED');
    const completedSessions = completedSessionsList.length;
    const abandonedSessions = sessions.filter((s) => s.status === 'IN_PROGRESS' || s.status === 'CREATED').length;

    let scoreSum = 0;
    let totalQuestionsAnswered = 0;
    const categoryStats: Record<string, { totalScore: number; count: number }> = {};
    const topicStats: Record<string, { totalScore: number; count: number }> = {};
    const difficultyStats: Record<string, { totalScore: number; count: number }> = {};
    const recentTrend: Array<{ date: string; score: number; role: string }> = [];

    for (const session of completedSessionsList) {
      const evalData = session.evaluation;
      if (!evalData) continue;

      scoreSum += evalData.overallScore || 0;
      totalQuestionsAnswered += session.answers?.length || 0;

      // Category breakdown
      const cat = session.interviewType;
      if (!categoryStats[cat]) categoryStats[cat] = { totalScore: 0, count: 0 };
      categoryStats[cat].totalScore += evalData.overallScore || 0;
      categoryStats[cat].count++;

      // Difficulty breakdown
      const diff = session.difficulty;
      if (!difficultyStats[diff]) difficultyStats[diff] = { totalScore: 0, count: 0 };
      difficultyStats[diff].totalScore += evalData.overallScore || 0;
      difficultyStats[diff].count++;

      // Question-level topic breakdown
      for (const qf of evalData.questionFeedbacks || []) {
        const qObj = session.questions?.find((q) => q.id === qf.questionId);
        const topic = qObj?.topic || 'General';
        if (!topicStats[topic]) topicStats[topic] = { totalScore: 0, count: 0 };
        topicStats[topic].totalScore += qf.score;
        topicStats[topic].count++;
      }

      recentTrend.push({
        date: session.completedAt ? session.completedAt.toISOString().slice(0, 10) : session.createdAt.toISOString().slice(0, 10),
        score: evalData.overallScore || 0,
        role: session.targetRole,
      });
    }

    const averageScore = completedSessions > 0 ? Math.round(scoreSum / completedSessions) : 0;

    const categoryBreakdown = Object.entries(categoryStats).map(([category, data]) => ({
      category,
      sessionCount: data.count,
      averageScore: Math.round(data.totalScore / data.count),
    }));

    // Strongest vs Weakest category
    let strongestCategory = 'None yet';
    let weakestCategory = 'None yet';
    if (categoryBreakdown.length > 0) {
      const sorted = [...categoryBreakdown].sort((a, b) => b.averageScore - a.averageScore);
      strongestCategory = sorted[0].category;
      weakestCategory = sorted[sorted.length - 1].category;
    }

    const topicBreakdown = Object.entries(topicStats).map(([topic, data]) => {
      const avg = Math.round(data.totalScore / data.count);
      return {
        topic,
        questionsCount: data.count,
        averageScore: avg,
        status: (avg >= 70 ? 'STRONG' : 'NEEDS_PRACTICE') as 'STRONG' | 'NEEDS_PRACTICE',
      };
    });

    const difficultyBreakdown = Object.entries(difficultyStats).map(([difficulty, data]) => ({
      difficulty,
      averageScore: Math.round(data.totalScore / data.count),
    }));

    return {
      totalSessions,
      completedSessions,
      abandonedSessions,
      averageScore,
      totalQuestionsAnswered,
      strongestCategory,
      weakestCategory,
      categoryBreakdown,
      topicBreakdown,
      difficultyBreakdown,
      recentTrend: recentTrend.slice(-10),
    };
  }

  /**
   * Generates a tailored preparation roadmap integrating previous interview results and Phase 13 skill gaps.
   */
  public static async getPersonalizedRoadmap(studentId: string): Promise<PersonalizedInterviewRoadmap> {
    const student = await User.findById(studentId);
    if (!student) {
      throw new Error('Student not found.');
    }

    const analytics = await this.getStudentAnalytics(studentId);
    let targetRole = student.studentProfile?.preferredJobRoles?.[0] || 'Software Engineer';

    const recommendedTopics: Array<{
      topic: string;
      category: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      reason: string;
      practiceQuestionCount: number;
      learningResourceUrl?: string;
    }> = [];

    // 1. Topics where student scored low in previous sessions
    for (const topicData of analytics.topicBreakdown) {
      if (topicData.status === 'NEEDS_PRACTICE') {
        recommendedTopics.push({
          topic: topicData.topic,
          category: 'TECHNICAL',
          priority: 'HIGH',
          reason: `Scored ${topicData.averageScore}% in recent mock sessions across ${topicData.questionsCount} questions.`,
          practiceQuestionCount: 5,
          learningResourceUrl: `https://www.google.com/search?q=learn+${encodeURIComponent(topicData.topic)}`,
        });
      }
    }

    // 2. Cross-pollinate with Phase 13 Skill Gaps if available
    try {
      const skillGaps = await SkillGapAnalysisService.analyzeSkillGaps(student);
      for (const gap of skillGaps.gaps.slice(0, 3)) {
        if (gap.gapCategory === 'MISSING_MANDATORY' && !recommendedTopics.some((r) => r.topic.toLowerCase() === gap.skill.toLowerCase())) {
          recommendedTopics.push({
            topic: gap.skill,
            category: 'ROLE_SPECIFIC',
            priority: 'HIGH',
            reason: `Mandatory hiring requirement identified across placement opportunities for ${targetRole}.`,
            practiceQuestionCount: 3,
            learningResourceUrl: gap.recommendedLearningResource?.url,
          });
        }
      }
    } catch {
      // Continue gracefully
    }

    // 3. Ensure fundamental Behavioral / STAR practice is in roadmap
    if (!recommendedTopics.some((r) => r.category === 'BEHAVIORAL')) {
      recommendedTopics.push({
        topic: 'STAR Method & Team Conflict Resolution',
        category: 'BEHAVIORAL',
        priority: 'MEDIUM',
        reason: 'Essential for HR and cultural fit screening across all campus hiring drives.',
        practiceQuestionCount: 4,
        learningResourceUrl: 'https://en.wikipedia.org/wiki/Situation,_task,_action_and_result',
      });
    }

    // Default general fresher recommendations if empty
    if (recommendedTopics.length === 0) {
      recommendedTopics.push(
        {
          topic: 'Data Structures & Core Algorithms',
          category: 'TECHNICAL',
          priority: 'HIGH',
          reason: 'Primary screening barrier for fresher engineering roles.',
          practiceQuestionCount: 5,
        },
        {
          topic: 'Database Indexing & SQL Queries',
          category: 'TECHNICAL',
          priority: 'HIGH',
          reason: 'Standard technical interview subject for backend and full-stack positions.',
          practiceQuestionCount: 3,
        },
        {
          topic: 'Self Introduction & Project Walkthrough',
          category: 'HR',
          priority: 'MEDIUM',
          reason: 'The crucial opening question establishing confidence and narrative.',
          practiceQuestionCount: 2,
        }
      );
    }

    return {
      studentId,
      targetRole,
      overallReadiness: analytics.averageScore || 50,
      recommendedTopics,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generates aggregate interview preparation insights for college placement administrators.
   */
  public static async getCollegeAnalytics(collegeUser: IUser): Promise<CollegeInterviewAnalyticsReport> {
    const dbStatus = getDbStatus();
    const collegeId = (collegeUser._id as any).toString();

    if (dbStatus.status !== 'connected') {
      return {
        collegeId,
        totalStudentsParticipated: 0,
        totalSessionsCompleted: 0,
        averageCollegeScore: 0,
        popularCategories: [],
        commonStrugglingTopics: [],
        generatedAt: new Date().toISOString(),
      };
    }

    const collegeName = collegeUser.collegeProfile?.collegeName || collegeUser.fullName;
    const students = await User.find({
      role: 'STUDENT',
      $or: [
        { 'studentProfile.collegeName': { $regex: new RegExp(collegeName, 'i') } },
        { collegeProfile: { $exists: false } },
      ],
    }).select('_id').lean();

    const studentIds = students.map((s) => s._id);

    const completedSessions = await MockInterviewSession.find({
      studentId: { $in: studentIds },
      status: 'COMPLETED',
    }).lean();

    const participatingStudents = new Set(completedSessions.map((s) => s.studentId.toString()));
    const totalStudentsParticipated = participatingStudents.size;
    const totalSessionsCompleted = completedSessions.length;

    let scoreSum = 0;
    const catMap = new Map<string, number>();
    const topicScoreMap = new Map<string, { total: number; count: number; studentSet: Set<string> }>();

    for (const session of completedSessions) {
      const evalData = session.evaluation;
      if (!evalData) continue;
      scoreSum += evalData.overallScore || 0;

      // Category counts
      catMap.set(session.interviewType, (catMap.get(session.interviewType) || 0) + 1);

      // Question topics
      for (const qf of evalData.questionFeedbacks || []) {
        const qObj = session.questions?.find((q: any) => q.id === qf.questionId);
        const topic = qObj?.topic || 'General';
        const curr = topicScoreMap.get(topic) || { total: 0, count: 0, studentSet: new Set() };
        curr.total += qf.score;
        curr.count++;
        curr.studentSet.add(session.studentId.toString());
        topicScoreMap.set(topic, curr);
      }
    }

    const averageCollegeScore = totalSessionsCompleted > 0 ? Math.round(scoreSum / totalSessionsCompleted) : 0;

    const popularCategories = Array.from(catMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Topics where students average < 70%
    const commonStrugglingTopics = Array.from(topicScoreMap.entries())
      .map(([topic, data]) => ({
        topic,
        averageScore: Math.round(data.total / data.count),
        studentCount: data.studentSet.size,
      }))
      .filter((t) => t.averageScore < 75)
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 6);

    return {
      collegeId,
      totalStudentsParticipated,
      totalSessionsCompleted,
      averageCollegeScore,
      popularCategories,
      commonStrugglingTopics,
      generatedAt: new Date().toISOString(),
    };
  }

  private static getEmptyStudentAnalytics(): StudentInterviewAnalytics {
    return {
      totalSessions: 0,
      completedSessions: 0,
      abandonedSessions: 0,
      averageScore: 0,
      totalQuestionsAnswered: 0,
      strongestCategory: 'None yet',
      weakestCategory: 'None yet',
      categoryBreakdown: [],
      topicBreakdown: [],
      difficultyBreakdown: [],
      recentTrend: [],
    };
  }
}
