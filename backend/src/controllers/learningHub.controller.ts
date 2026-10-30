import { Request, Response } from 'express';
import { LearningHubService } from '../services/learningHub.service.js';
import { LearningProgressService } from '../services/learningProgress.service.js';
import { LearningQuizService } from '../services/learningQuiz.service.js';
import { LearningRecommendationService } from '../services/learningRecommendation.service.js';
import { User } from '../models/user.model.js';
import { getDbStatus } from '../config/db.js';

export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.sub;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    let profile: any = undefined;
    if (getDbStatus().status === 'connected') {
      try {
        const user = await User.findById(studentId);
        if (user) profile = user.studentProfile;
      } catch {
        // Ignore
      }
    }

    const data = await LearningHubService.getInstance().getDashboardData(studentId, profile);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function listResources(req: Request, res: Response): Promise<void> {
  try {
    const { category, resourceType, difficulty, skill, search, verificationStatus } = req.query;
    const studentId = req.user?.sub;
    const isAdmin = req.user?.role === 'ADMIN';

    const result = await LearningHubService.getInstance().listResources({
      category: category as string,
      resourceType: resourceType as string,
      difficulty: difficulty as string,
      skill: skill as string,
      search: search as string,
      studentId,
      isAdmin,
      verificationStatus: verificationStatus as string,
    });

    res.status(200).json({
      success: true,
      total: result.total,
      data: result.resources,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getResourceDetail(req: Request, res: Response): Promise<void> {
  try {
    const { resourceId } = req.params;
    const studentId = req.user?.sub;

    const resource = await LearningHubService.getInstance().getResourceById(
      resourceId,
      studentId
    );
    if (!resource) {
      res.status(404).json({ success: false, message: 'Learning resource not found' });
      return;
    }

    res.status(200).json({ success: true, data: resource });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function toggleBookmark(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.sub;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const { resourceId } = req.params;
    const { personalNote, category } = req.body;

    const result = await LearningHubService.getInstance().toggleBookmark(
      studentId,
      resourceId,
      personalNote,
      category
    );

    res.status(200).json({
      success: true,
      isBookmarked: result.isBookmarked,
      data: result.bookmark,
      message: result.isBookmarked ? 'Resource bookmarked' : 'Bookmark removed',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function listBookmarks(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.sub;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const bookmarks = await LearningHubService.getInstance().getStudentBookmarks(studentId);
    res.status(200).json({ success: true, count: bookmarks.length, data: bookmarks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function reportResource(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.sub;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const { resourceId } = req.params;
    const { reason, details } = req.body;

    if (!reason || !details) {
      res.status(400).json({ success: false, message: 'Reason and details are required' });
      return;
    }

    const report = await LearningHubService.getInstance().reportResource(
      studentId,
      resourceId,
      reason,
      details
    );

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Thank you for maintaining resource quality.',
      data: report,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function listLearningPaths(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.sub;
    const paths = await LearningHubService.getInstance().listLearningPaths(studentId);
    res.status(200).json({ success: true, count: paths.length, data: paths });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getPathDetail(req: Request, res: Response): Promise<void> {
  try {
    const { pathId } = req.params;
    const studentId = req.user?.sub;

    const path = await LearningHubService.getInstance().getLearningPathById(
      pathId,
      studentId
    );
    if (!path) {
      res.status(404).json({ success: false, message: 'Learning path not found' });
      return;
    }

    res.status(200).json({ success: true, data: path });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function enrollPath(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.sub;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const { pathId } = req.params;

    const result = await LearningProgressService.getInstance().enrollStudent(
      studentId,
      pathId
    );

    res.status(200).json({
      success: true,
      isNew: result.isNew,
      message: result.isNew
        ? 'Successfully enrolled in learning path'
        : 'Already enrolled in this learning path',
      data: result.enrollment,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateModuleProgress(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.sub;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const { pathId, moduleId } = req.params;
    const { status, completionMethod, notes } = req.body;

    if (!status || !['IN_PROGRESS', 'COMPLETED'].includes(status)) {
      res.status(400).json({
        success: false,
        message: "Status must be 'IN_PROGRESS' or 'COMPLETED'",
      });
      return;
    }

    const result = await LearningProgressService.getInstance().updateModuleProgress(
      studentId,
      pathId,
      moduleId,
      status,
      completionMethod || 'STUDENT_CONFIRMED',
      undefined,
      notes
    );

    res.status(200).json({
      success: true,
      message: 'Module progress updated successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getQuiz(req: Request, res: Response): Promise<void> {
  try {
    const { quizId } = req.params;
    const quiz = await LearningQuizService.getInstance().getQuizById(quizId);
    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }
    res.status(200).json({ success: true, data: quiz });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function submitQuiz(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.sub;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const { quizId } = req.params;
    const { answers, learningPathId } = req.body;

    if (!answers || typeof answers !== 'object') {
      res.status(400).json({ success: false, message: 'Answers object is required' });
      return;
    }

    const attempt = await LearningQuizService.getInstance().evaluateQuiz(
      studentId,
      quizId,
      answers,
      learningPathId
    );

    res.status(200).json({
      success: true,
      passed: attempt.passed,
      score: attempt.score,
      data: attempt,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.sub;
    let profile: any = undefined;

    if (studentId && getDbStatus().status === 'connected') {
      try {
        const user = await User.findById(studentId);
        if (user) profile = user.studentProfile;
      } catch {
        // Ignore
      }
    }

    const { resources } = await LearningHubService.getInstance().listResources({
      studentId,
    });
    const recommendations = LearningRecommendationService.getInstance().calculateRecommendations(
      resources,
      profile,
      [],
      8
    );

    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getSkillGapMapping(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.sub;
    let studentSkills: string[] = [];

    if (studentId && getDbStatus().status === 'connected') {
      try {
        const user = await User.findById(studentId);
        if (user?.studentProfile) {
          studentSkills = [
            ...(user.studentProfile.skills || []),
            ...(user.studentProfile.technicalSkills || []),
          ];
        }
      } catch {
        // Ignore
      }
    }

    // Default missing skills if profile has few skills
    const baselineSkills = ['JavaScript', 'React', 'Node.js', 'SQL', 'DSA', 'Docker', 'Git'];
    const missing = baselineSkills.filter(
      (b) => !studentSkills.some((s) => s.toLowerCase() === b.toLowerCase())
    );

    const gaps = missing.map((skill) => ({
      skill,
      status: 'MISSING',
      source: 'ASSESSMENT' as const,
    }));

    const paths = await LearningHubService.getInstance().listLearningPaths(studentId);
    const { resources } = await LearningHubService.getInstance().listResources({ studentId });

    const mapping = LearningRecommendationService.getInstance().mapSkillGapsToLearning(
      gaps,
      paths,
      resources
    );

    res.status(200).json({ success: true, count: mapping.length, data: mapping });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getCollegeAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const collegeId = req.user?.sub || 'college-default';
    const report = await LearningHubService.getInstance().getCollegeAnalytics(collegeId);
    res.status(200).json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function adminListReports(req: Request, res: Response): Promise<void> {
  try {
    const reports = await LearningHubService.getInstance().listReports();
    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function adminResolveReport(req: Request, res: Response): Promise<void> {
  try {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;

    if (!status || !['REVIEWED', 'RESOLVED', 'DISMISSED'].includes(status)) {
      res.status(400).json({
        success: false,
        message: "Status must be 'REVIEWED', 'RESOLVED', or 'DISMISSED'",
      });
      return;
    }

    const report = await LearningHubService.getInstance().resolveReport(
      reportId,
      status,
      adminNotes
    );
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Report resolved', data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function adminVerifyResource(req: Request, res: Response): Promise<void> {
  try {
    const { resourceId } = req.params;
    const { verificationStatus, isPublished } = req.body;

    if (
      !verificationStatus ||
      !['DRAFT', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'ARCHIVED'].includes(
        verificationStatus
      )
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid verification status',
      });
      return;
    }

    const updated = await LearningHubService.getInstance().updateResourceVerification(
      resourceId,
      verificationStatus,
      isPublished
    );
    if (!updated) {
      res.status(404).json({ success: false, message: 'Resource not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Resource verification updated to ${verificationStatus}`,
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function adminUpsertResource(req: Request, res: Response): Promise<void> {
  try {
    const adminId = req.user?.sub || 'ADMIN';
    const resource = await LearningHubService.getInstance().upsertResource(
      req.body,
      adminId
    );

    res.status(201).json({
      success: true,
      message: 'Resource saved successfully',
      data: resource,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function adminSeedInitialData(req: Request, res: Response): Promise<void> {
  try {
    const result = await LearningHubService.getInstance().seedInitialData();
    res.status(200).json({
      success: true,
      message: 'Learning hub initialized successfully with curated seed content',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
