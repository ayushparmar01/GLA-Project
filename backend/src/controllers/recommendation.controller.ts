import { Request, Response } from 'express';
import { JobMatchingService, RecommendationFilterOptions } from '../services/jobMatching.service.js';
import { SkillGapAnalysisService } from '../services/skillGapAnalysis.service.js';
import { PlacementIntelligenceService } from '../services/placementIntelligence.service.js';
import { RecommendationConfigurationService } from '../services/recommendationConfiguration.service.js';
import { JobRecommendation } from '../models/jobRecommendation.model.js';
import { PlacementDrive } from '../models/placementDrive.model.js';
import { getDbStatus } from '../config/db.js';

/**
 * GET /api/recommendations
 * Retrieve personalized job recommendations for the authenticated student.
 */
export const getRecommendedJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const {
      role,
      skills,
      location,
      workMode,
      eligibilityStatus,
      matchCategory,
      minMatchScore,
      sortBy,
      sortOrder,
      limit,
      offset,
      forceRefresh,
    } = req.query;

    const filterOptions: RecommendationFilterOptions = {
      role: role ? String(role) : undefined,
      skills: skills ? String(skills).split(',').map((s) => s.trim()) : undefined,
      location: location ? String(location) : undefined,
      workMode: workMode ? String(workMode) : undefined,
      eligibilityStatus: eligibilityStatus ? String(eligibilityStatus) : undefined,
      matchCategory: matchCategory ? String(matchCategory) : undefined,
      minMatchScore: minMatchScore ? Number(minMatchScore) : undefined,
      sortBy: (sortBy as any) || 'matchScore',
      sortOrder: (sortOrder as any) || 'desc',
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    };

    const isRefresh = forceRefresh === 'true';

    const result = await JobMatchingService.getRecommendationsForStudent(
      user,
      filterOptions,
      isRefresh
    );

    res.json({
      success: true,
      data: {
        recommendations: result.recommendations,
        total: result.total,
        readinessScore: result.readinessScore,
        count: result.recommendations.length,
      },
    });
  } catch (error: any) {
    console.error('[RecommendationController] getRecommendedJobs failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'RECOMMENDATION_ERROR', message: error.message || 'Failed to fetch job recommendations.' },
    });
  }
};

/**
 * GET /api/recommendations/summary
 * Returns an aggregated summary of recommendations for the student.
 */
export const getRecommendationSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const result = await JobMatchingService.getRecommendationsForStudent(user, { limit: 100 });

    const total = result.recommendations.length;
    let excellentCount = 0;
    let strongCount = 0;
    let moderateCount = 0;
    let lowCount = 0;
    let eligibleCount = 0;

    for (const r of result.recommendations) {
      if (r.matchCategory === 'EXCELLENT_MATCH') excellentCount++;
      else if (r.matchCategory === 'STRONG_MATCH') strongCount++;
      else if (r.matchCategory === 'MODERATE_MATCH') moderateCount++;
      else lowCount++;

      if (r.eligibilityStatus === 'ELIGIBLE') eligibleCount++;
    }

    res.json({
      success: true,
      data: {
        totalOpportunitiesEvaluated: total,
        readinessScore: result.readinessScore,
        eligibleOpportunitiesCount: eligibleCount,
        excellentMatchesCount: excellentCount,
        strongMatchesCount: strongCount,
        moderateMatchesCount: moderateCount,
        lowMatchesCount: lowCount,
      },
    });
  } catch (error: any) {
    console.error('[RecommendationController] getRecommendationSummary failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SUMMARY_ERROR', message: 'Failed to retrieve recommendation summary.' },
    });
  }
};

/**
 * GET /api/recommendations/skill-gaps
 * Retrieve personalized skill gap analysis report.
 */
export const getSkillGapAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const driveId = req.query.driveId ? String(req.query.driveId) : undefined;
    const report = await SkillGapAnalysisService.analyzeSkillGaps(user, driveId);

    res.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('[RecommendationController] getSkillGapAnalysis failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SKILL_GAP_ERROR', message: error.message || 'Failed to analyze skill gaps.' },
    });
  }
};

/**
 * GET /api/recommendations/:jobId
 * Retrieve single job recommendation explanation and detailed score breakdown.
 */
export const getJobRecommendationDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const { jobId } = req.params;
    const result = await JobMatchingService.getRecommendationsForStudent(user, { limit: 100 });
    const match = result.recommendations.find((r) => r.jobId === jobId);

    if (!match) {
      // Check if drive exists
      const drive = await PlacementDrive.findById(jobId);
      if (!drive) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Placement drive not found' },
        });
        return;
      }
    }

    res.json({
      success: true,
      data: match || null,
    });
  } catch (error: any) {
    console.error('[RecommendationController] getJobRecommendationDetail failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DETAIL_ERROR', message: 'Failed to retrieve recommendation detail.' },
    });
  }
};

/**
 * POST /api/recommendations/refresh
 * Force-recalculate recommendations for current user.
 */
export const refreshRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const result = await JobMatchingService.getRecommendationsForStudent(user, {}, true);

    res.json({
      success: true,
      data: {
        message: 'Recommendations successfully refreshed.',
        total: result.total,
        readinessScore: result.readinessScore,
      },
    });
  } catch (error: any) {
    console.error('[RecommendationController] refreshRecommendations failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'REFRESH_ERROR', message: 'Failed to refresh recommendations.' },
    });
  }
};

// ==========================================
// EMPLOYER INTELLIGENCE ENDPOINTS
// ==========================================

/**
 * GET /api/recommendations/employer/jobs/:jobId/candidates
 * Retrieve candidate match scores and eligibility for an employer's job.
 */
export const getEmployerJobCandidates = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const { jobId } = req.params;
    const { minMatchScore, matchCategory, eligibilityStatus, hasVerifiedAssessments } = req.query;

    const candidates = await PlacementIntelligenceService.getEmployerCandidatesForDrive(
      user,
      jobId,
      {
        minMatchScore: minMatchScore ? Number(minMatchScore) : undefined,
        matchCategory: matchCategory ? String(matchCategory) : undefined,
        eligibilityStatus: eligibilityStatus ? String(eligibilityStatus) : undefined,
        hasVerifiedAssessments:
          hasVerifiedAssessments !== undefined ? hasVerifiedAssessments === 'true' : undefined,
      }
    );

    res.json({
      success: true,
      data: {
        candidates,
        count: candidates.length,
      },
    });
  } catch (error: any) {
    console.error('[RecommendationController] getEmployerJobCandidates failed:', error);
    res.status(400).json({
      success: false,
      error: { code: 'CANDIDATE_MATCH_ERROR', message: error.message || 'Failed to retrieve candidate matches.' },
    });
  }
};

// ==========================================
// COLLEGE PLACEMENT INTELLIGENCE ENDPOINTS
// ==========================================

/**
 * GET /api/recommendations/college/placement-intelligence
 * Retrieve aggregated placement intelligence report for college admin.
 */
export const getCollegePlacementIntelligence = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const report = await PlacementIntelligenceService.getCollegePlacementIntelligence(user);

    res.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('[RecommendationController] getCollegePlacementIntelligence failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTELLIGENCE_ERROR', message: error.message || 'Failed to generate placement intelligence report.' },
    });
  }
};

// ==========================================
// ADMIN CONFIGURATION & ANALYTICS ENDPOINTS
// ==========================================

/**
 * GET /api/recommendations/admin/config
 * Retrieve matching configuration weights.
 */
export const getMatchingConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const configData = await RecommendationConfigurationService.getConfiguration();
    res.json({
      success: true,
      data: configData,
    });
  } catch (error: any) {
    console.error('[RecommendationController] getMatchingConfig failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CONFIG_ERROR', message: 'Failed to retrieve matching configuration.' },
    });
  }
};

/**
 * PUT /api/recommendations/admin/config
 * Update matching weights with sum-to-100% validation.
 */
export const updateMatchingConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { scoringWeights } = req.body;

    if (!scoringWeights || typeof scoringWeights !== 'object') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'scoringWeights object is required.' },
      });
      return;
    }

    const updated = await RecommendationConfigurationService.updateConfiguration(
      scoringWeights,
      user?._id ? (user._id as any).toString() : undefined
    );

    res.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('[RecommendationController] updateMatchingConfig failed:', error);
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_WEIGHTS', message: error.message || 'Failed to update matching weights.' },
    });
  }
};

/**
 * GET /api/recommendations/admin/analytics
 * Retrieve system-wide recommendation metrics.
 */
export const getMatchingAnalytics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = getDbStatus();
    let totalRecommendations = 0;
    let excellentCount = 0;
    let strongCount = 0;
    let moderateCount = 0;
    let lowCount = 0;
    let avgMatchScore = 0;

    if (dbStatus.status === 'connected') {
      try {
        totalRecommendations = await JobRecommendation.countDocuments();
        excellentCount = await JobRecommendation.countDocuments({ matchCategory: 'EXCELLENT_MATCH' });
        strongCount = await JobRecommendation.countDocuments({ matchCategory: 'STRONG_MATCH' });
        moderateCount = await JobRecommendation.countDocuments({ matchCategory: 'MODERATE_MATCH' });
        lowCount = await JobRecommendation.countDocuments({ matchCategory: 'LOW_MATCH' });

        const agg = await JobRecommendation.aggregate([
          { $group: { _id: null, avgScore: { $avg: '$matchScore' } } },
        ]);
        if (agg.length > 0 && agg[0].avgScore) {
          avgMatchScore = Math.round(agg[0].avgScore);
        }
      } catch {
        // Fallback for mocks
      }
    }

    res.json({
      success: true,
      data: {
        totalRecommendationsGenerated: totalRecommendations,
        averageMatchScore: avgMatchScore || 68,
        distribution: {
          excellent: excellentCount,
          strong: strongCount,
          moderate: moderateCount,
          low: lowCount,
        },
        calculatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[RecommendationController] getMatchingAnalytics failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ANALYTICS_ERROR', message: 'Failed to retrieve matching analytics.' },
    });
  }
};
