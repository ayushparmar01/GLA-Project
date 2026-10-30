import {
  RecommendationExplanation,
  RecommendationScoreBreakdown,
  EligibilityResult,
} from '../types/index.js';
import { IUser } from '../models/user.model.js';
import { IPlacementDrive } from '../models/placementDrive.model.js';
import { AiService } from './ai/ai.service.js';

export class RecommendationExplanationService {
  /**
   * Generates a fully explainable, transparent recommendation breakdown using actual database data.
   */
  public static generateExplanation(params: {
    user: IUser;
    drive: IPlacementDrive;
    breakdown: RecommendationScoreBreakdown;
    eligibility: EligibilityResult;
    matchingSkills: string[];
    missingSkills: string[];
    readinessScore: number;
  }): RecommendationExplanation {
    const { user, drive, breakdown, eligibility, matchingSkills, missingSkills, readinessScore } = params;
    const sp = user.studentProfile || {};

    // 1. Academic Compatibility Explanation
    let academicCompatibility: string;
    if (eligibility.academicEligible && eligibility.cgpaEligible && eligibility.batchEligible) {
      academicCompatibility = `Academic profile is fully aligned (${sp.course || 'Degree'}, ${sp.graduationYear || 'Batch'} with ${sp.cgpa ? `${sp.cgpa} CGPA` : 'eligible standing'}).`;
    } else {
      const issues: string[] = [];
      if (!eligibility.academicEligible) issues.push('Course / Branch misalignment');
      if (!eligibility.cgpaEligible) issues.push(`CGPA requirement (${drive.minimumCGPA || 'N/A'}) not met`);
      if (!eligibility.batchEligible) issues.push(`Graduation year not in eligible batches`);
      if (!eligibility.backlogEligible) issues.push(`Backlogs exceed limit of ${drive.maxBacklogsAllowed || 0}`);
      academicCompatibility = `Academic discrepancies noted: ${issues.join(', ')}.`;
    }

    // 2. Assessment Compatibility Explanation
    let assessmentCompatibility: string;
    if (readinessScore >= 75) {
      assessmentCompatibility = `High verified readiness score of ${readinessScore}/100 demonstrates strong assessment performance.`;
    } else if (readinessScore >= 50) {
      assessmentCompatibility = `Moderate verified readiness score of ${readinessScore}/100 indicates practical readiness with room to complete more assessments.`;
    } else {
      assessmentCompatibility = `Readiness score of ${readinessScore}/100 indicates you should attempt more skill assessments to verify your proficiency to employers.`;
    }

    // 3. Preference Compatibility Explanation
    let preferenceCompatibility: string;
    const driveLocation = drive.location || 'Pan-India';
    const driveWorkMode = drive.workMode || 'ONSITE';
    const prefLocations = sp.preferredWorkLocations || sp.preferredWorkLocation || [];
    const locationMatched =
      driveWorkMode === 'REMOTE' ||
      prefLocations.length === 0 ||
      prefLocations.some((loc) =>
        loc.toLowerCase().includes(driveLocation.toLowerCase()) ||
        driveLocation.toLowerCase().includes(loc.toLowerCase())
      );

    if (locationMatched) {
      preferenceCompatibility = `Opportunity matches your work mode (${driveWorkMode}) and location preferences (${driveLocation}).`;
    } else {
      preferenceCompatibility = `Drive is based in ${driveLocation} (${driveWorkMode}), which differs from your preferred locations (${prefLocations.join(', ')}).`;
    }

    // 4. Actionable Recommended Steps
    const recommendedActions: string[] = [];

    if (missingSkills.length > 0) {
      const topMissing = missingSkills.slice(0, 3).join(', ');
      recommendedActions.push(`Upskill in key required skills: ${topMissing}.`);
    }

    if (readinessScore < 70) {
      recommendedActions.push('Attempt topic assessments in your core skills to boost verified readiness.');
    }

    if (!sp.projects || sp.projects.length === 0) {
      recommendedActions.push('Add project portfolio links to increase your experience score.');
    }

    if (eligibility.eligible) {
      recommendedActions.push(`Submit your application before the deadline (${new Date(drive.applicationDeadline).toLocaleDateString()}).`);
    } else {
      recommendedActions.push('Review eligibility prerequisites or contact your college placement coordinator.');
    }

    return {
      matchingSkills,
      missingSkills,
      academicCompatibility,
      assessmentCompatibility,
      preferenceCompatibility,
      recommendedActions,
    };
  }

  /**
   * Optionally synthesizes natural-language executive summary via AI service with deterministic fallback.
   */
  public static async synthesizeSummaryWithAi(
    explanation: RecommendationExplanation,
    driveTitle: string,
    matchScore: number
  ): Promise<string> {
    const fallbackSummary = `Score: ${matchScore}/100 for ${driveTitle}. ${explanation.matchingSkills.length} matching skills, ${explanation.missingSkills.length} skill gaps identified.`;

    try {
      const aiService = AiService.getInstance();
      const prompt = `Provide a concise 2-sentence career recommendation summary for a student evaluating the opportunity "${driveTitle}" with a match score of ${matchScore}/100. Matching skills: ${explanation.matchingSkills.join(', ') || 'None'}. Missing skills: ${explanation.missingSkills.join(', ') || 'None'}.`;

      const response = await aiService.generateText({
        prompt,
        purpose: 'CAREER_RECOMMENDATION_SUMMARY',
        maxTokens: 100,
        temperature: 0.3,
      });

      if (response && response.text && response.text.trim().length > 10) {
        return response.text.trim();
      }
    } catch {
      // Deterministic fallback
    }

    return fallbackSummary;
  }
}
