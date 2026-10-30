import { IUser } from '../models/user.model.js';
import { Resume } from '../models/resume.model.js';
import { AssessmentAttempt, IAssessmentAttempt } from '../models/assessmentAttempt.model.js';
import { calculateProfileCompletion } from './profileCompletion.service.js';
import { getDbStatus } from '../config/db.js';
import {
  CareerReadinessFactor,
  CareerReadinessReport,
} from '../types/index.js';

export class CareerReadinessService {
  /**
   * Computes the explainable 6-pillar Career Readiness Score for a student.
   */
  public static async calculateReadiness(
    user: IUser,
    passedAttemptsOverride?: IAssessmentAttempt[],
    hasResumeOverride?: boolean
  ): Promise<CareerReadinessReport> {
    const sp = user.studentProfile || {};
    const dbStatus = getDbStatus();

    // 1. Fetch passed assessment attempts
    let passedAttempts: IAssessmentAttempt[] = [];
    if (passedAttemptsOverride) {
      passedAttempts = passedAttemptsOverride;
    } else if (dbStatus.status === 'connected') {
      try {
        passedAttempts = await AssessmentAttempt.find({
          studentId: user._id,
          status: 'SUBMITTED',
          passed: true,
        }).lean() as unknown as IAssessmentAttempt[];
      } catch {
        passedAttempts = [];
      }
    }

    // 2. Fetch Resume existence
    let hasResume = false;
    if (typeof hasResumeOverride === 'boolean') {
      hasResume = hasResumeOverride;
    } else if (dbStatus.status === 'connected') {
      try {
        const count = await Resume.countDocuments({ studentId: user._id });
        hasResume = count > 0;
      } catch {
        hasResume = false;
      }
    }

    // Extract verified skills from passed attempts
    const verifiedSkillsSet = new Set<string>();
    for (const attempt of passedAttempts) {
      if (attempt.skillWiseResults) {
        for (const sr of attempt.skillWiseResults) {
          if (sr.percentage >= 60) {
            verifiedSkillsSet.add(sr.skill);
          }
        }
      }
    }

    // 3. Compute Profile Completeness using Phase 5 engine
    const profileReport = await calculateProfileCompletion(user, hasResume);
    const profileScore = profileReport.score; // 0 - 100

    const factors: CareerReadinessFactor[] = [];
    const missingFactors: string[] = [];
    const improvementSuggestions: string[] = [];

    // --- Pillar 1: Profile Completeness (Weight: 20%) ---
    const pillar1Score = Math.round((profileScore / 100) * 20);
    factors.push({
      name: 'Profile Completeness',
      category: 'Profile',
      weight: 20,
      score: pillar1Score,
      maxScore: 20,
      status:
        pillar1Score >= 16 ? 'EXCELLENT' : pillar1Score >= 10 ? 'GOOD' : pillar1Score >= 5 ? 'NEEDS_WORK' : 'MISSING',
      details: `Your career profile completeness is ${profileScore}%. Complete all 8 sections to maximize this pillar.`,
    });
    if (pillar1Score < 14) {
      missingFactors.push('Incomplete Profile: Update missing profile sections such as headline, skills, or portfolio.');
      improvementSuggestions.push('Complete your student profile to reach 100% completion in the Career Profile tab.');
    }

    // --- Pillar 2: Verified Skills Assessment Performance (Weight: 30%) ---
    let pillar2Score = 0;
    const passedCount = passedAttempts.length;
    if (passedCount >= 3) {
      pillar2Score = 30;
    } else if (passedCount === 2) {
      pillar2Score = 24;
    } else if (passedCount === 1) {
      pillar2Score = 15;
    } else {
      pillar2Score = 0;
    }

    factors.push({
      name: 'Verified Skills Assessment',
      category: 'Assessments',
      weight: 30,
      score: pillar2Score,
      maxScore: 30,
      status:
        pillar2Score >= 24 ? 'EXCELLENT' : pillar2Score >= 15 ? 'GOOD' : pillar2Score > 0 ? 'NEEDS_WORK' : 'MISSING',
      details: `${passedCount} assessment${passedCount === 1 ? '' : 's'} passed. ${verifiedSkillsSet.size} skills verified via objective testing.`,
    });
    if (pillar2Score < 24) {
      missingFactors.push('Unverified Skills: Pass 2 or more skill assessments to earn verified credentials.');
      improvementSuggestions.push('Take assessments in Web Development, DSA, or Cloud Computing to verify your skills for recruiters.');
    }

    // --- Pillar 3: Project Portfolio (Weight: 20%) ---
    const projects = sp.projects || [];
    let pillar3Score = 0;
    if (projects.length >= 2) {
      const hasLinks = projects.some((p) => p.githubUrl || p.liveDemoUrl);
      pillar3Score = hasLinks ? 20 : 16;
    } else if (projects.length === 1) {
      pillar3Score = 10;
    } else {
      pillar3Score = 0;
    }

    factors.push({
      name: 'Project Portfolio',
      category: 'Portfolio',
      weight: 20,
      score: pillar3Score,
      maxScore: 20,
      status:
        pillar3Score >= 16 ? 'EXCELLENT' : pillar3Score >= 10 ? 'GOOD' : pillar3Score > 0 ? 'NEEDS_WORK' : 'MISSING',
      details: `${projects.length} project${projects.length === 1 ? '' : 's'} documented in your portfolio.`,
    });
    if (pillar3Score < 16) {
      missingFactors.push('Insufficient Portfolio: Add at least 2 real-world projects with GitHub or live deployment links.');
      improvementSuggestions.push('Showcase full-stack or open-source projects with working repository links to demonstrate practical capability.');
    }

    // --- Pillar 4: Academic & Education Records (Weight: 15%) ---
    let pillar4Score = 0;
    const hasEduDetails = Boolean(
      (sp.collegeName && sp.course && sp.graduationYear) ||
      (sp.educationHistory && sp.educationHistory.length > 0)
    );
    const hasCgpa = Boolean(
      (sp.cgpa && sp.cgpa > 0) ||
      (sp.educationHistory && sp.educationHistory.some((e) => e.cgpa && e.cgpa > 0))
    );

    if (hasEduDetails && hasCgpa) {
      pillar4Score = 15;
    } else if (hasEduDetails) {
      pillar4Score = 10;
    } else {
      pillar4Score = 0;
    }

    factors.push({
      name: 'Academic & Education Records',
      category: 'Education',
      weight: 15,
      score: pillar4Score,
      maxScore: 15,
      status: pillar4Score === 15 ? 'EXCELLENT' : pillar4Score >= 10 ? 'GOOD' : 'MISSING',
      details: hasEduDetails
        ? `Academic records recorded${hasCgpa ? ' including CGPA' : ''}.`
        : 'Missing formal education details.',
    });
    if (pillar4Score < 15) {
      missingFactors.push('Incomplete Education: Record your course, graduation year, and CGPA.');
      improvementSuggestions.push('Add your college name, course, and CGPA to fulfill employer eligibility criteria.');
    }

    // --- Pillar 5: ATS Resume Availability (Weight: 10%) ---
    const pillar5Score = hasResume ? 10 : 0;
    factors.push({
      name: 'ATS Resume Availability',
      category: 'Resume',
      weight: 10,
      score: pillar5Score,
      maxScore: 10,
      status: pillar5Score === 10 ? 'EXCELLENT' : 'MISSING',
      details: hasResume
        ? 'Active ATS-friendly resume compiled and ready for one-click application.'
        : 'No ATS resume generated yet.',
    });
    if (pillar5Score === 0) {
      missingFactors.push('Missing Resume: Build and export an ATS resume using the built-in Resume Builder.');
      improvementSuggestions.push('Generate an ATS-compliant PDF resume from your profile in the Resume tab.');
    }

    // --- Pillar 6: Certifications & Credentials (Weight: 5%) ---
    const certs = sp.certifications || [];
    const pillar6Score = certs.length >= 1 ? 5 : 0;
    factors.push({
      name: 'Certifications & Credentials',
      category: 'Certifications',
      weight: 5,
      score: pillar6Score,
      maxScore: 5,
      status: pillar6Score === 5 ? 'EXCELLENT' : 'MISSING',
      details: `${certs.length} professional certification${certs.length === 1 ? '' : 's'} recorded.`,
    });
    if (pillar6Score === 0) {
      missingFactors.push('Certifications: Add any industry certifications or bootcamps.');
      improvementSuggestions.push('Upload proof or links for any technical certifications (AWS, HackerRank, freeCodeCamp, etc.).');
    }

    // Overall Score Calculation (Clamped 0 - 100)
    const overallScore = Math.min(
      100,
      Math.max(
        0,
        pillar1Score +
          pillar2Score +
          pillar3Score +
          pillar4Score +
          pillar5Score +
          pillar6Score
      )
    );

    let statusBand: CareerReadinessReport['statusBand'];
    if (overallScore >= 80) {
      statusBand = 'HIGHLY_JOB_READY';
    } else if (overallScore >= 60) {
      statusBand = 'JOB_READY';
    } else if (overallScore >= 40) {
      statusBand = 'DEVELOPING';
    } else {
      statusBand = 'EARLY_STAGE';
    }

    return {
      overallScore,
      statusBand,
      factors,
      missingFactors,
      improvementSuggestions,
      assessmentVerifiedSkillsCount: verifiedSkillsSet.size,
      disclaimer:
        'Career Readiness Score is an automated heuristic metric reflecting profile completeness, portfolio evidence, and verified assessment scores. It does not guarantee employment or placement outcomes.',
      calculatedAt: new Date().toISOString(),
    };
  }
}
