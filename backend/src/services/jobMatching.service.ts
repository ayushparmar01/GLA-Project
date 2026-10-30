import { IUser } from '../models/user.model.js';
import { PlacementDrive, IPlacementDrive } from '../models/placementDrive.model.js';
import { AssessmentAttempt } from '../models/assessmentAttempt.model.js';
import { JobRecommendation } from '../models/jobRecommendation.model.js';
import { evaluateEligibility } from './eligibility.service.js';
import { CareerReadinessService } from './careerReadiness.service.js';
import { RecommendationConfigurationService } from './recommendationConfiguration.service.js';
import { RecommendationExplanationService } from './recommendationExplanation.service.js';
import { getDbStatus } from '../config/db.js';
import {
  JobRecommendationData,
  MatchCategory,
  RecommendationScoreBreakdown,
  MatchingWeightsConfig,
} from '../types/index.js';

export interface RecommendationFilterOptions {
  role?: string;
  skills?: string[];
  location?: string;
  workMode?: string;
  eligibilityStatus?: string;
  matchCategory?: string;
  minMatchScore?: number;
  sortBy?: 'matchScore' | 'deadline' | 'latest';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export class JobMatchingService {
  /**
   * Generates or retrieves personalized job recommendations for a student.
   */
  public static async getRecommendationsForStudent(
    user: IUser,
    options: RecommendationFilterOptions = {},
    forceRefresh: boolean = false
  ): Promise<{
    recommendations: JobRecommendationData[];
    total: number;
    readinessScore: number;
  }> {
    const sp = user.studentProfile || {};
    const dbStatus = getDbStatus();

    // 1. Career Readiness Score (Independent, 0-100)
    const readinessReport = await CareerReadinessService.calculateReadiness(user);
    const readinessScore = readinessReport.overallScore;

    // 2. Fetch Active Scoring Weights Configuration
    const configData = await RecommendationConfigurationService.getConfiguration();
    const weights: MatchingWeightsConfig = configData.scoringWeights;

    // 3. Fetch Verified Skills from passed assessments
    const verifiedSkillsSet = new Set<string>();
    if (dbStatus.status === 'connected') {
      try {
        const passedAttempts = await AssessmentAttempt.find({
          studentId: user._id,
          status: 'SUBMITTED',
          passed: true,
        }).lean();

        for (const att of passedAttempts) {
          if (att.skillWiseResults) {
            for (const sr of att.skillWiseResults) {
              if (sr.percentage >= 60) {
                verifiedSkillsSet.add(sr.skill.trim().toLowerCase());
              }
            }
          }
        }
      } catch {
        // Continue with empty verified skills
      }
    }

    // 4. Fetch Published Placement Drives
    let drives: IPlacementDrive[] = [];
    if (dbStatus.status === 'connected') {
      try {
        drives = await PlacementDrive.find({ status: 'PUBLISHED' }).sort({ createdAt: -1 });
      } catch {
        drives = [];
      }
    }

    const selfDeclaredSkills = [
      ...(sp.technicalSkills || []),
      ...(sp.skills || []),
    ].map((s) => s.trim().toLowerCase());

    const recommendations: JobRecommendationData[] = [];

    for (const drive of drives) {
      // Step A: Deterministic Eligibility Check (Independent)
      const eligibility = evaluateEligibility({
        driveStatus: drive.status,
        applicationDeadline: drive.applicationDeadline,
        driveCohortIds: drive.cohortIds?.map((c) => c.toString()),
        eligibleCourses: drive.eligibleCourses,
        eligibleBranches: drive.eligibleBranches,
        eligibleGraduationYears: drive.eligibleGraduationYears,
        requiredSkills: drive.requiredSkills,
        minimumCGPA: drive.minimumCGPA,
        maxBacklogsAllowed: drive.maxBacklogsAllowed,
        minExperienceYears: drive.minExperienceYears,
        studentProfile: sp,
        studentEnrolledCohortIds: sp.cohortId ? [sp.cohortId.toString()] : [],
      });

      // Step B: Calculate 6-Pillar Compatibility Breakdown
      const breakdown = this.calculateCompatibilityBreakdown({
        user,
        drive,
        weights,
        readinessScore,
        selfDeclaredSkills,
        verifiedSkillsSet,
      });

      // Total Match Score = Sum of all 6 components
      const rawMatchScore =
        breakdown.skillsScore +
        breakdown.educationScore +
        breakdown.assessmentScore +
        breakdown.experienceScore +
        breakdown.locationScore +
        breakdown.rolePreferenceScore;

      const matchScore = Math.min(100, Math.max(0, Math.round(rawMatchScore)));

      // Step C: Determine Match Category
      let matchCategory: MatchCategory = 'LOW_MATCH';
      if (matchScore >= 85) matchCategory = 'EXCELLENT_MATCH';
      else if (matchScore >= 70) matchCategory = 'STRONG_MATCH';
      else if (matchScore >= 50) matchCategory = 'MODERATE_MATCH';

      // Step D: Calculate Score Coverage
      const scoreCoverage = this.calculateScoreCoverage(sp, readinessScore);

      // Step E: Identify Matching and Missing Skills
      const { matchingSkills, missingSkills } = this.extractMatchingAndMissingSkills(
        drive,
        selfDeclaredSkills,
        verifiedSkillsSet
      );

      // Step F: Build Explainable Rationale
      const explanation = RecommendationExplanationService.generateExplanation({
        user,
        drive,
        breakdown,
        eligibility,
        matchingSkills,
        missingSkills,
        readinessScore,
      });

      const recData: JobRecommendationData = {
        jobId: (drive._id as any).toString(),
        drive: drive.toSafeObject(),
        matchScore,
        scoreCoverage,
        matchCategory,
        eligibilityStatus: eligibility.status,
        eligibility,
        readinessScore,
        scoreBreakdown: breakdown,
        explanation,
        recommendedActions: explanation.recommendedActions,
        generatedAt: new Date().toISOString(),
      };

      recommendations.push(recData);

      // Cache recommendation asynchronously in database
      if (dbStatus.status === 'connected' && user._id && drive._id) {
        JobRecommendation.findOneAndUpdate(
          { studentId: user._id, jobId: drive._id },
          {
            matchScore,
            scoreCoverage,
            matchCategory,
            eligibilityStatus: eligibility.status,
            readinessScore,
            scoreBreakdown: breakdown,
            explanation,
            recommendedActions: explanation.recommendedActions,
            scoringVersion: configData.scoringVersion || 'v13.0',
            generatedAt: new Date(),
          },
          { upsert: true, new: true }
        ).catch(() => {});
      }
    }

    // Step G: Filter & Sort Results
    let filtered = [...recommendations];

    if (options.role) {
      const q = options.role.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.drive?.title.toLowerCase().includes(q) ||
          r.drive?.description.toLowerCase().includes(q)
      );
    }

    if (options.skills && options.skills.length > 0) {
      const qSkills = options.skills.map((s) => s.toLowerCase());
      filtered = filtered.filter((r) =>
        r.drive?.requiredSkills?.some((req) => qSkills.includes(req.toLowerCase()))
      );
    }

    if (options.location) {
      const qLoc = options.location.toLowerCase();
      filtered = filtered.filter(
        (r) => r.drive?.location && r.drive.location.toLowerCase().includes(qLoc)
      );
    }

    if (options.workMode) {
      filtered = filtered.filter((r) => r.drive?.workMode === options.workMode);
    }

    if (options.eligibilityStatus) {
      filtered = filtered.filter((r) => r.eligibilityStatus === options.eligibilityStatus);
    }

    if (options.matchCategory) {
      filtered = filtered.filter((r) => r.matchCategory === options.matchCategory);
    }

    if (options.minMatchScore !== undefined) {
      filtered = filtered.filter((r) => r.matchScore >= options.minMatchScore!);
    }

    // Sorting
    const sortField = options.sortBy || 'matchScore';
    const sortOrder = options.sortOrder || 'desc';

    filtered.sort((a, b) => {
      let comp = 0;
      if (sortField === 'matchScore') {
        comp = b.matchScore - a.matchScore;
      } else if (sortField === 'deadline') {
        const da = a.drive?.applicationDeadline ? new Date(a.drive.applicationDeadline).getTime() : 0;
        const db = b.drive?.applicationDeadline ? new Date(b.drive.applicationDeadline).getTime() : 0;
        comp = da - db;
      } else if (sortField === 'latest') {
        const ca = a.drive?.createdAt ? new Date(a.drive.createdAt).getTime() : 0;
        const cb = b.drive?.createdAt ? new Date(b.drive.createdAt).getTime() : 0;
        comp = cb - ca;
      }
      return sortOrder === 'asc' ? -comp : comp;
    });

    const total = filtered.length;
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      recommendations: paginated,
      total,
      readinessScore,
    };
  }

  /**
   * Calculates individual weighted scores for the 6 pillars.
   */
  public static calculateCompatibilityBreakdown(params: {
    user: IUser;
    drive: IPlacementDrive;
    weights: MatchingWeightsConfig;
    readinessScore: number;
    selfDeclaredSkills: string[];
    verifiedSkillsSet: Set<string>;
  }): RecommendationScoreBreakdown {
    const { user, drive, weights, readinessScore, selfDeclaredSkills, verifiedSkillsSet } = params;
    const sp = user.studentProfile || {};

    // 1. SKILLS PILLAR (Weight: weights.skills, default 35%)
    let skillsScore = 0;
    const reqSkills = drive.requiredSkills || [];
    const prefSkills = drive.preferredSkills || [];
    const allDriveSkills = [...reqSkills, ...prefSkills];

    if (allDriveSkills.length === 0) {
      skillsScore = weights.skills;
    } else {
      let earnedPoints = 0;
      let maxPoints = 0;

      // Required skills weigh 2.0x, preferred weigh 1.0x
      for (const skill of reqSkills) {
        maxPoints += 2.0;
        const lower = skill.toLowerCase().trim();
        const isVerified = Array.from(verifiedSkillsSet).some(
          (vs) => vs === lower || vs.includes(lower) || lower.includes(vs)
        );
        const isDeclared = selfDeclaredSkills.some(
          (sd) => sd === lower || sd.includes(lower) || lower.includes(sd)
        );

        if (isVerified) {
          earnedPoints += 2.0;
        } else if (isDeclared) {
          earnedPoints += 1.3;
        }
      }

      for (const skill of prefSkills) {
        maxPoints += 1.0;
        const lower = skill.toLowerCase().trim();
        const isVerified = Array.from(verifiedSkillsSet).some(
          (vs) => vs === lower || vs.includes(lower) || lower.includes(vs)
        );
        const isDeclared = selfDeclaredSkills.some(
          (sd) => sd === lower || sd.includes(lower) || lower.includes(sd)
        );

        if (isVerified) {
          earnedPoints += 1.0;
        } else if (isDeclared) {
          earnedPoints += 0.7;
        }
      }

      const skillRatio = maxPoints > 0 ? earnedPoints / maxPoints : 1.0;
      skillsScore = Math.round(skillRatio * weights.skills);
    }

    // 2. EDUCATION / BRANCH PILLAR (Weight: weights.education, default 20%)
    let eduRatio = 0;
    let eduCriteriaCount = 0;

    // Course match
    if (drive.eligibleCourses && drive.eligibleCourses.length > 0) {
      eduCriteriaCount++;
      const studentCourse = (sp.course || '').toLowerCase().trim();
      if (studentCourse && drive.eligibleCourses.some((c) => c.toLowerCase().includes(studentCourse) || studentCourse.includes(c.toLowerCase()))) {
        eduRatio += 1.0;
      }
    } else {
      eduCriteriaCount++;
      eduRatio += 1.0; // Open to all courses
    }

    // Branch match
    if (drive.eligibleBranches && drive.eligibleBranches.length > 0) {
      eduCriteriaCount++;
      const studentBranch = (sp.specialization || sp.course || '').toLowerCase().trim();
      if (studentBranch && drive.eligibleBranches.some((b) => b.toLowerCase().includes(studentBranch) || studentBranch.includes(b.toLowerCase()))) {
        eduRatio += 1.0;
      }
    } else {
      eduCriteriaCount++;
      eduRatio += 1.0; // Open to all branches
    }

    // Graduation year match
    if (drive.eligibleGraduationYears && drive.eligibleGraduationYears.length > 0) {
      eduCriteriaCount++;
      if (sp.graduationYear && drive.eligibleGraduationYears.includes(sp.graduationYear)) {
        eduRatio += 1.0;
      }
    } else {
      eduCriteriaCount++;
      eduRatio += 1.0;
    }

    const educationScore = Math.round((eduRatio / eduCriteriaCount) * weights.education);

    // 3. ASSESSMENT READINESS PILLAR (Weight: weights.assessment, default 15%)
    const assessmentScore = Math.round((readinessScore / 100) * weights.assessment);

    // 4. EXPERIENCE / PROJECTS PILLAR (Weight: weights.experience, default 10%)
    let expRatio = 0;
    const projectCount = (sp.projects || []).length;
    const certCount = (sp.certifications || []).length;
    const internCount = (sp.internships || []).length;
    const workCount = (sp.workExperience || []).length;

    // Projects: up to 2 projects = 40%
    if (projectCount >= 2) expRatio += 0.4;
    else if (projectCount === 1) expRatio += 0.2;

    // Certifications: up to 1 cert = 20%
    if (certCount >= 1) expRatio += 0.2;

    // Practical experience vs drive requirements
    const totalExpYears = workCount * 1.0 + internCount * 0.5;
    const minExp = drive.minExperienceYears || 0;
    if (minExp === 0) {
      if (totalExpYears > 0) expRatio += 0.4;
      else expRatio += 0.25;
    } else {
      if (totalExpYears >= minExp) expRatio += 0.4;
      else if (totalExpYears > 0) expRatio += 0.2;
    }

    const experienceScore = Math.round(Math.min(1.0, expRatio) * weights.experience);

    // 5. LOCATION PREFERENCES PILLAR (Weight: weights.location, default 10%)
    let locRatio = 0.5;
    const driveLocation = (drive.location || 'Pan-India').toLowerCase();
    const driveMode = drive.workMode || 'ONSITE';
    const prefLocations = (sp.preferredWorkLocations || sp.preferredWorkLocation || []).map((l) => l.toLowerCase());

    if (driveMode === 'REMOTE') {
      locRatio = 1.0;
    } else if (prefLocations.length === 0) {
      locRatio = 0.8; // Flexible student
    } else {
      const match = prefLocations.some((loc) => loc.includes(driveLocation) || driveLocation.includes(loc));
      locRatio = match ? 1.0 : 0.3;
    }

    const locationScore = Math.round(locRatio * weights.location);

    // 6. ROLE PREFERENCES PILLAR (Weight: weights.rolePreference, default 10%)
    let roleRatio = 0.5;
    const driveTitle = (drive.title || '').toLowerCase();
    const prefRoles = (sp.preferredJobRoles || sp.careerInterests || []).map((r) => r.toLowerCase());

    if (prefRoles.length === 0) {
      roleRatio = 0.6; // No strict role preferences
    } else {
      const match = prefRoles.some((r) => driveTitle.includes(r) || r.includes(driveTitle));
      roleRatio = match ? 1.0 : 0.4;
    }

    const rolePreferenceScore = Math.round(roleRatio * weights.rolePreference);

    return {
      skillsScore,
      educationScore,
      assessmentScore,
      experienceScore,
      locationScore,
      rolePreferenceScore,
    };
  }

  /**
   * Calculates profile data availability coverage (0 - 100%).
   */
  private static calculateScoreCoverage(sp: any, readinessScore: number): number {
    let populatedCount = 0;
    const totalPillars = 6;

    // Skills populated
    if ((sp.skills && sp.skills.length > 0) || (sp.technicalSkills && sp.technicalSkills.length > 0)) {
      populatedCount++;
    }
    // Education populated
    if (sp.course && sp.graduationYear) {
      populatedCount++;
    }
    // Readiness populated
    if (readinessScore > 0) {
      populatedCount++;
    }
    // Experience/projects populated
    if ((sp.projects && sp.projects.length > 0) || (sp.workExperience && sp.workExperience.length > 0) || (sp.internships && sp.internships.length > 0)) {
      populatedCount++;
    }
    // Location preference populated
    if ((sp.preferredWorkLocations && sp.preferredWorkLocations.length > 0) || (sp.preferredWorkLocation && sp.preferredWorkLocation.length > 0)) {
      populatedCount++;
    }
    // Role preference populated
    if ((sp.preferredJobRoles && sp.preferredJobRoles.length > 0) || (sp.careerInterests && sp.careerInterests.length > 0)) {
      populatedCount++;
    }

    return Math.round((populatedCount / totalPillars) * 100);
  }

  /**
   * Extracts matching and missing skills between student and drive.
   */
  public static extractMatchingAndMissingSkills(
    drive: IPlacementDrive,
    selfDeclaredSkills: string[],
    verifiedSkillsSet: Set<string>
  ): { matchingSkills: string[]; missingSkills: string[] } {
    const reqSkills = drive.requiredSkills || [];
    const prefSkills = drive.preferredSkills || [];
    const allDriveSkills = Array.from(new Set([...reqSkills, ...prefSkills]));

    const studentAllSkills = new Set([...selfDeclaredSkills, ...Array.from(verifiedSkillsSet)]);

    const matchingSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const skill of allDriveSkills) {
      const lower = skill.toLowerCase().trim();
      const hasSkill = Array.from(studentAllSkills).some(
        (s) => s === lower || s.includes(lower) || lower.includes(s)
      );

      if (hasSkill) {
        matchingSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    }

    return { matchingSkills, missingSkills };
  }
}
