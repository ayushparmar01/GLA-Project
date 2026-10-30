import { Request, Response } from 'express';
import { User, IUser } from '../models/user.model.js';
import { PlacementDrive } from '../models/placementDrive.model.js';
import { CareerReadinessService } from '../services/careerReadiness.service.js';
import { SkillGapService } from '../services/skillGap.service.js';
import { OpportunityMatchingService } from '../services/opportunityMatching.service.js';
import { getDbStatus } from '../config/db.js';
import {
  ApiResponse,
  CareerReadinessReport,
  SkillGapReport,
  SmartMatchingReport,
} from '../types/index.js';

export class CareerReadinessController {
  /**
   * Helper to retrieve or construct the current student user object.
   */
  private static async getStudentUser(req: Request): Promise<IUser | null> {
    const studentId = req.user?.sub;
    if (!studentId) return null;

    const dbStatus = getDbStatus();
    if (dbStatus.status === 'connected') {
      return User.findById(studentId);
    }

    // Offline / Mock fallback
    return {
      _id: studentId,
      fullName: 'Student User',
      email: req.user?.email || 'student@example.com',
      role: 'STUDENT',
      studentProfile: {
        headline: 'Aspiring Full-Stack Software Engineer',
        careerObjective: 'Motivated computer science student seeking software engineering opportunities.',
        course: 'Computer Science and Engineering',
        graduationYear: 2025,
        cgpa: 8.5,
        collegeName: 'Bharat Institute of Technology',
        technicalSkills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'SQL & Relational Design'],
        softSkills: ['Problem Solving', 'Communication'],
        projects: [
          {
            id: 'proj-1',
            title: 'Campus Placement Portal',
            description: 'Full stack portal built with React and Node.js for campus recruitment drives.',
            technologies: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
            githubUrl: 'https://github.com/example/placement-portal',
            visibility: 'PUBLIC',
          },
          {
            id: 'proj-2',
            title: 'Algorithmic Visualizer',
            description: 'Interactive visualization tool for pathfinding and sorting algorithms.',
            technologies: ['JavaScript', 'HTML5 & CSS3', 'React'],
            liveDemoUrl: 'https://algo-visualizer.example.com',
            visibility: 'PUBLIC',
          },
        ],
        certifications: [
          {
            id: 'cert-1',
            title: 'AWS Certified Cloud Practitioner',
            issuer: 'Amazon Web Services',
          },
        ],
      },
    } as unknown as IUser;
  }

  /**
   * GET /api/students/me/career-readiness
   * Returns explainable 6-pillar career readiness report.
   */
  public static async getCareerReadiness(req: Request, res: Response): Promise<void> {
    try {
      const user = await CareerReadinessController.getStudentUser(req);
      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'Student user not found' },
        });
        return;
      }

      const report = await CareerReadinessService.calculateReadiness(user);

      // Low-Bandwidth (50 kbps) Compact Response Optimization (< 1.5 KB payload)
      if (req.query.compact === 'true') {
        const compactReport = {
          overallScore: report.overallScore,
          statusBand: report.statusBand,
          factors: (report.factors || []).map((f) => ({
            name: f.name,
            category: f.category,
            weight: f.weight,
            score: f.score,
            maxScore: f.maxScore,
            status: f.status,
            details: f.details.slice(0, 100),
          })),
          missingFactors: (report.missingFactors || []).slice(0, 3),
          improvementSuggestions: (report.improvementSuggestions || []).slice(0, 3),
          assessmentVerifiedSkillsCount: report.assessmentVerifiedSkillsCount || 0,
          disclaimer: report.disclaimer,
          calculatedAt: report.calculatedAt,
          isCompact: true,
        };
        res.status(200).json({
          success: true,
          data: compactReport as unknown as CareerReadinessReport,
        });
        return;
      }

      const response: ApiResponse<CareerReadinessReport> = {
        success: true,
        data: report,
      };
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'CALCULATE_READINESS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to calculate career readiness',
        },
      });
    }
  }

  /**
   * GET /api/students/me/skill-gaps
   * Analyzes skill gaps against all requirements or against a specific placement drive.
   */
  public static async getSkillGaps(req: Request, res: Response): Promise<void> {
    try {
      const user = await CareerReadinessController.getStudentUser(req);
      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'Student user not found' },
        });
        return;
      }

      const driveId = req.query.driveId as string | undefined;
      let driveDoc = null;

      if (driveId) {
        const dbStatus = getDbStatus();
        if (dbStatus.status === 'connected') {
          driveDoc = await PlacementDrive.findById(driveId);
        }
      }

      const report = await SkillGapService.analyzeSkillGap(user, driveDoc || undefined);
      const response: ApiResponse<SkillGapReport> = {
        success: true,
        data: report,
      };
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SKILL_GAP_ANALYSIS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to perform skill gap analysis',
        },
      });
    }
  }

  /**
   * GET /api/students/me/recommended-opportunities
   * Returns smart matching report ranking drives into eligible, potential, and ineligible.
   */
  public static async getRecommendedOpportunities(req: Request, res: Response): Promise<void> {
    try {
      const user = await CareerReadinessController.getStudentUser(req);
      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'Student user not found' },
        });
        return;
      }

      const report = await OpportunityMatchingService.matchOpportunities(user);
      const response: ApiResponse<SmartMatchingReport> = {
        success: true,
        data: report,
      };
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'MATCHING_FAILED',
          message: error instanceof Error ? error.message : 'Failed to compute recommended opportunities',
        },
      });
    }
  }
}
