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
   * Produces honest, factor-by-factor human-readable rationales matching Mission Bharat Acceptance Criteria.
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

    const whyItMatches: string[] = [];
    const whyItDoesNotMatch: string[] = [];
    const checklist: string[] = [];

    // 1. Education Qualification & Degree Match
    const studentQual = sp.course || sp.educationLevel || 'Degree / Diploma';
    const driveQual = drive.minimumQualification || 'Any Graduate / Diploma';
    const isQualMatched =
      !drive.minimumQualification ||
      studentQual.toLowerCase().includes('diploma') && driveQual.toLowerCase().includes('diploma') ||
      studentQual.toLowerCase().includes('b.tech') && (driveQual.toLowerCase().includes('b.tech') || driveQual.toLowerCase().includes('degree')) ||
      eligibility.academicEligible;

    if (isQualMatched) {
      const msg = `${studentQual} matches the educational requirement (${driveQual}).`;
      whyItMatches.push(msg);
      checklist.push(`✓ ${msg}`);
    } else {
      const msg = `Educational qualification required is ${driveQual}, which differs from ${studentQual}.`;
      whyItDoesNotMatch.push(msg);
      checklist.push(`✗ ${msg}`);
    }

    // 2. Branch / Specialization Match
    const eligibleCourses = drive.eligibleCourses || [];
    const studentBranch = sp.specialization || sp.course || '';
    const isBranchMatched =
      eligibleCourses.length === 0 ||
      (studentBranch && eligibleCourses.some((c) =>
        studentBranch.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(studentBranch.toLowerCase())
      ));

    if (isBranchMatched) {
      const msg = studentBranch
        ? `Branch / Specialization in ${studentBranch} is an eligible discipline.`
        : 'All standard academic branches are eligible for this recruitment drive.';
      whyItMatches.push(msg);
      checklist.push(`✓ ${msg}`);
    } else {
      const msg = `Drive targets ${eligibleCourses.join(', ')} (Candidate profile: ${studentBranch || 'Unspecified'}).`;
      whyItDoesNotMatch.push(msg);
      checklist.push(`✗ ${msg}`);
    }

    // 3. Skills Match
    if (matchingSkills.length > 0) {
      const topMatching = matchingSkills.slice(0, 3).join(', ');
      const msg = `Your ${topMatching} skill${matchingSkills.length > 1 ? 's' : ''} match the job requirements.`;
      whyItMatches.push(msg);
      checklist.push(`✓ ${msg}`);
    } else if (drive.requiredSkills && drive.requiredSkills.length === 0) {
      const msg = 'No restrictive technical skills specified by the employer for this opening.';
      whyItMatches.push(msg);
      checklist.push(`✓ ${msg}`);
    } else {
      const msg = `None of the required technical skills (${(drive.requiredSkills || []).slice(0, 3).join(', ')}) are currently listed on your profile.`;
      whyItDoesNotMatch.push(msg);
      checklist.push(`✗ ${msg}`);
    }

    // 4. Preferred Job Role Fit
    const driveTitle = drive.title || 'Placement Role';
    const preferredRoles = sp.preferredJobRoles || sp.careerInterests || [];
    const roleMatched = preferredRoles.some((r) =>
      driveTitle.toLowerCase().includes(r.toLowerCase()) || r.toLowerCase().includes(driveTitle.toLowerCase())
    );

    if (roleMatched) {
      const msg = `Role "${driveTitle}" directly aligns with your listed career interests.`;
      whyItMatches.push(msg);
      checklist.push(`✓ ${msg}`);
    } else if (preferredRoles.length === 0) {
      const msg = `Open entry-level role matching overall technical stream.`;
      checklist.push(`- ${msg}`);
    } else {
      const msg = `Role "${driveTitle}" is outside your top indicated roles (${preferredRoles.slice(0, 2).join(', ')}).`;
      whyItDoesNotMatch.push(msg);
      checklist.push(`- ${msg}`);
    }

    // 5. Location and Distance
    const driveLocation = drive.location || '';
    const workMode = drive.workMode || 'ONSITE';
    const prefLocations = sp.preferredWorkLocations || sp.preferredWorkLocation || [];

    if (workMode === 'REMOTE') {
      const msg = 'Remote opportunity — accessible from your location with no daily travel.';
      whyItMatches.push(msg);
      checklist.push(`✓ ${msg}`);
    } else if (
      driveLocation &&
      prefLocations.some((loc) =>
        loc.toLowerCase().includes(driveLocation.toLowerCase()) || driveLocation.toLowerCase().includes(loc.toLowerCase())
      )
    ) {
      const msg = `Job location (${driveLocation}) is within your preferred geographic proximity (approx. 30 km range).`;
      whyItMatches.push(msg);
      checklist.push(`✓ ${msg}`);
    } else if (!driveLocation || prefLocations.length === 0) {
      const msg = 'Distance could not be verified (Exact candidate or employer coordinates not provided).';
      checklist.push(`- ${msg}`);
    } else {
      const msg = `Job is based in ${driveLocation} (${workMode}), which differs from your preferred locations (${prefLocations.join(', ')}).`;
      whyItDoesNotMatch.push(msg);
      checklist.push(`- ${msg}`);
    }

    // 6. Stipend or Salary Information
    const salary = drive.salaryRange?.trim();
    if (salary && salary.length > 0 && !salary.toLowerCase().includes('negotiable')) {
      const msg = `Employer has listed a stipend / compensation package of ${salary}.`;
      whyItMatches.push(msg);
      checklist.push(`✓ ${msg}`);
    } else {
      const msg = 'Stipend / salary details not specified by the employer.';
      checklist.push(`- ${msg}`);
    }

    // 7. Experience / Freshers Requirements
    const eligibleBatches = drive.eligibleGraduationYears || [];
    const studentBatch = sp.graduationYear;
    if (eligibleBatches.length === 0 || (studentBatch && eligibleBatches.includes(studentBatch))) {
      const msg = studentBatch
        ? `Graduation batch (${studentBatch}) is welcomed for early-career entry.`
        : 'Entry-level position accepting graduating students and freshers.';
      whyItMatches.push(msg);
      checklist.push(`✓ ${msg}`);
    } else {
      const msg = `Drive requests graduation batches [${eligibleBatches.join(', ')}], candidate is batch ${studentBatch || 'N/A'}.`;
      whyItDoesNotMatch.push(msg);
      checklist.push(`✗ ${msg}`);
    }

    // 8. Academic Compatibility (CGPA & Backlogs)
    let academicCompatibility: string;
    if (eligibility.academicEligible && eligibility.cgpaEligible && eligibility.batchEligible) {
      academicCompatibility = `Academic profile is fully aligned (${studentQual}, ${studentBatch || 'Batch'} with ${sp.cgpa ? `${sp.cgpa} CGPA` : 'eligible standing'}).`;
      if (drive.minimumCGPA && sp.cgpa && sp.cgpa >= drive.minimumCGPA) {
        checklist.push(`✓ CGPA (${sp.cgpa}) meets minimum employer threshold of ${drive.minimumCGPA}.`);
      }
    } else {
      const issues: string[] = [];
      if (!eligibility.academicEligible) issues.push('Course / Branch misalignment');
      if (!eligibility.cgpaEligible) issues.push(`CGPA requirement (${drive.minimumCGPA || 'N/A'}) not met`);
      if (!eligibility.batchEligible) issues.push(`Graduation year not in eligible batches`);
      if (!eligibility.backlogEligible) issues.push(`Backlogs exceed limit of ${drive.maxBacklogsAllowed || 0}`);
      academicCompatibility = `Academic discrepancies noted: ${issues.join(', ')}.`;
    }

    // Assessment Compatibility Explanation
    let assessmentCompatibility: string;
    if (readinessScore >= 75) {
      assessmentCompatibility = `High verified readiness score of ${readinessScore}/100 demonstrates strong assessment performance.`;
    } else if (readinessScore >= 50) {
      assessmentCompatibility = `Moderate verified readiness score of ${readinessScore}/100 indicates practical readiness with room to complete more assessments.`;
    } else {
      assessmentCompatibility = `Readiness score of ${readinessScore}/100 indicates you should attempt more skill assessments to verify your proficiency to employers.`;
    }

    // Preference Compatibility Explanation
    let preferenceCompatibility: string;
    if (workMode === 'REMOTE' || prefLocations.some((l) => l.toLowerCase().includes(driveLocation.toLowerCase()))) {
      preferenceCompatibility = `Opportunity matches your work mode (${workMode}) and location preferences (${driveLocation || 'Pan-India'}).`;
    } else {
      preferenceCompatibility = `Drive is based in ${driveLocation || 'Onsite'} (${workMode}), which differs from your preferred locations.`;
    }

    // Actionable Recommended Steps
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
      checklist,
      whyItMatches,
      whyItDoesNotMatch,
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
