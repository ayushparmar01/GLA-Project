import { IUser } from '../models/user.model.js';
import { PlacementDrive, IPlacementDrive } from '../models/placementDrive.model.js';
import { AssessmentAttempt } from '../models/assessmentAttempt.model.js';
import { evaluateEligibility } from './eligibility.service.js';
import { CareerReadinessService } from './careerReadiness.service.js';
import { getDbStatus } from '../config/db.js';
import {
  MatchedOpportunity,
  SmartMatchingReport,
  PlacementDriveData,
} from '../types/index.js';

export class OpportunityMatchingService {
  /**
   * Generates an explainable smart matching report for the student across all published opportunities.
   * Integrates cleanly with Phase 3 evaluateEligibility without altering or bypassing any rules.
   */
  public static async matchOpportunities(
    user: IUser,
    drivesOverride?: IPlacementDrive[]
  ): Promise<SmartMatchingReport> {
    const sp = user.studentProfile || {};
    const dbStatus = getDbStatus();

    // 1. Fetch Drives
    let drives: IPlacementDrive[] = [];
    if (drivesOverride) {
      drives = drivesOverride;
    } else if (dbStatus.status === 'connected') {
      try {
        drives = await PlacementDrive.find({ status: 'PUBLISHED' }).sort({ createdAt: -1 });
      } catch {
        drives = [];
      }
    }

    // 2. Fetch Career Readiness Report
    const readinessReport = await CareerReadinessService.calculateReadiness(user);

    // 3. Fetch Verified Skills from passed assessment attempts
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
        // Fallback gracefully
      }
    }

    const selfDeclaredSkills = [
      ...(sp.technicalSkills || []),
      ...(sp.skills || []),
    ].map((s) => s.trim().toLowerCase());

    const eligibleOpportunities: MatchedOpportunity[] = [];
    const potentialMatches: MatchedOpportunity[] = [];
    const ineligibleOpportunities: MatchedOpportunity[] = [];

    for (const drive of drives) {
      // Step A: Phase 3 Eligibility Check (Strictly preserved)
      const eligibility = evaluateEligibility({
        driveStatus: drive.status,
        applicationDeadline: drive.applicationDeadline,
        driveCohortIds: drive.cohortIds?.map((c) => c.toString()),
        eligibleCourses: drive.eligibleCourses,
        eligibleGraduationYears: drive.eligibleGraduationYears,
        requiredSkills: drive.requiredSkills,
        minimumCGPA: drive.minimumCGPA,
        studentProfile: sp,
        studentEnrolledCohortIds: sp.cohortId ? [sp.cohortId.toString()] : [],
      });

      // Step B: Calculate Explainable Match Score (0 - 100)
      const matchingFactors: string[] = [];
      const gaps: string[] = [];
      const recommendedActions: string[] = [];

      // 1. Skill Match Component (Up to 40 points)
      const reqSkills = drive.requiredSkills || [];
      let skillPoints = 0;
      if (reqSkills.length === 0) {
        skillPoints = 40;
        matchingFactors.push('No restrictive required skills specified on drive (+40pts)');
      } else {
        let verifiedMatches = 0;
        let selfDeclaredMatches = 0;

        for (const req of reqSkills) {
          const lower = req.trim().toLowerCase();
          const isVerified = Array.from(verifiedSkillsSet).some(
            (vs) => vs === lower || vs.includes(lower) || lower.includes(vs)
          );
          const isDeclared = selfDeclaredSkills.some(
            (sd) => sd === lower || sd.includes(lower) || lower.includes(sd)
          );

          if (isVerified) {
            verifiedMatches++;
          } else if (isDeclared) {
            selfDeclaredMatches++;
          } else {
            gaps.push(`Missing skill: ${req}`);
            recommendedActions.push(`Take assessment or study resources for ${req}.`);
          }
        }

        // Verified skills earn 1.5x value of self-declared skills
        const totalMatchesValue = (verifiedMatches * 1.5) + selfDeclaredMatches;
        const maxPossibleValue = reqSkills.length * 1.5;
        skillPoints = Math.round((totalMatchesValue / maxPossibleValue) * 40);

        if (verifiedMatches > 0) {
          matchingFactors.push(`${verifiedMatches} required skill(s) verified via standardized assessments (+bonus)`);
        }
        if (selfDeclaredMatches > 0) {
          matchingFactors.push(`${selfDeclaredMatches} skill(s) self-declared in your career profile`);
        }
      }

      // 2. Career Readiness Component (Up to 30 points)
      const readinessPoints = Math.round((readinessReport.overallScore / 100) * 30);
      matchingFactors.push(`Career Readiness score (${readinessReport.overallScore}%) contributes +${readinessPoints}pts`);

      // 3. Course and Graduation Year Fit (Up to 20 points)
      let academicPoints = 0;
      const courseMatch =
        !drive.eligibleCourses ||
        drive.eligibleCourses.length === 0 ||
        (sp.course &&
          drive.eligibleCourses.some((c) =>
            sp.course!.toLowerCase().includes(c.toLowerCase()) ||
            c.toLowerCase().includes(sp.course!.toLowerCase())
          ));
      const gradYearMatch =
        !drive.eligibleGraduationYears ||
        drive.eligibleGraduationYears.length === 0 ||
        (sp.graduationYear && drive.eligibleGraduationYears.includes(sp.graduationYear));

      if (courseMatch && gradYearMatch) {
        academicPoints = 20;
        matchingFactors.push('Course and Graduation Year perfectly aligned (+20pts)');
      } else if (courseMatch || gradYearMatch) {
        academicPoints = 10;
        if (!courseMatch) gaps.push('Course mismatch with drive target disciplines');
        if (!gradYearMatch) gaps.push('Graduation year outside requested batch');
      }

      // 4. CGPA Margin Component (Up to 10 points)
      let cgpaPoints = 0;
      if (!drive.minimumCGPA) {
        cgpaPoints = 10;
      } else if (sp.cgpa && sp.cgpa >= drive.minimumCGPA) {
        cgpaPoints = 10;
        matchingFactors.push(`CGPA (${sp.cgpa}) meets minimum requirement of ${drive.minimumCGPA} (+10pts)`);
      } else if (sp.cgpa && sp.cgpa >= drive.minimumCGPA - 0.5) {
        cgpaPoints = 5;
        gaps.push(`CGPA (${sp.cgpa}) is close to requirement (${drive.minimumCGPA})`);
      } else {
        cgpaPoints = 0;
        gaps.push(`CGPA requirement not met (Requires: ${drive.minimumCGPA})`);
      }

      const matchScore = Math.min(100, Math.max(0, skillPoints + readinessPoints + academicPoints + cgpaPoints));

      // Determine Category
      const isEligible = eligibility.eligible;
      // Potential match: not strictly eligible, but close (e.g. deadline not passed, course/grad year ok, only missing 1-2 skills or slight CGPA gap)
      const hasHardBlocker = eligibility.reasons.some(
        (r) => r.includes('deadline') || r.includes('expired') || r.includes('status and not open')
      );
      const isPotentialMatch = !isEligible && !hasHardBlocker && matchScore >= 40;

      const driveSafe: PlacementDriveData = typeof drive.toSafeObject === 'function'
        ? drive.toSafeObject()
        : {
            id: (drive._id as unknown as { toString(): string }).toString(),
            title: drive.title,
            description: drive.description,
            organizationName: drive.organizationName,
            opportunityType: drive.opportunityType,
            workMode: drive.workMode,
            location: drive.location,
            requiredSkills: drive.requiredSkills || [],
            preferredSkills: drive.preferredSkills || [],
            eligibleCourses: drive.eligibleCourses || [],
            eligibleGraduationYears: drive.eligibleGraduationYears || [],
            applicationDeadline: drive.applicationDeadline
              ? new Date(drive.applicationDeadline).toISOString()
              : new Date().toISOString(),
            status: drive.status,
            createdBy: drive.createdBy ? drive.createdBy.toString() : '',
            createdAt: drive.createdAt ? new Date(drive.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: drive.updatedAt ? new Date(drive.updatedAt).toISOString() : new Date().toISOString(),
          };

      const matchedOpp: MatchedOpportunity = {
        drive: driveSafe,
        matchScore,
        eligibility,
        matchingFactors,
        gaps,
        recommendedActions,
        isEligible,
        isPotentialMatch,
      };

      if (isEligible) {
        eligibleOpportunities.push(matchedOpp);
      } else if (isPotentialMatch) {
        potentialMatches.push(matchedOpp);
      } else {
        ineligibleOpportunities.push(matchedOpp);
      }
    }

    // Sort eligible and potential matches descending by matchScore
    eligibleOpportunities.sort((a, b) => b.matchScore - a.matchScore);
    potentialMatches.sort((a, b) => b.matchScore - a.matchScore);
    ineligibleOpportunities.sort((a, b) => b.matchScore - a.matchScore);

    return {
      eligibleOpportunities,
      potentialMatches,
      ineligibleOpportunities,
      totalDrivesEvaluated: drives.length,
      studentReadinessScore: readinessReport.overallScore,
      studentVerifiedSkills: Array.from(verifiedSkillsSet),
    };
  }
}
