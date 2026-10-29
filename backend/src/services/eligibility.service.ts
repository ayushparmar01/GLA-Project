import { EligibilityResult, StudentProfileData } from '../types/index.js';

export interface EvaluateEligibilityInput {
  driveStatus: string;
  applicationDeadline: Date | string;
  driveCohortIds?: string[];
  eligibleCourses?: string[];
  eligibleGraduationYears?: number[];
  requiredSkills?: string[];
  studentProfile?: StudentProfileData;
  studentEnrolledCohortIds?: string[];
}

export const evaluateEligibility = (input: EvaluateEligibilityInput): EligibilityResult => {
  const reasons: string[] = [];
  const missingRequirements: string[] = [];

  // 1. Drive Publication Status
  if (input.driveStatus !== 'PUBLISHED') {
    reasons.push(`Placement drive is currently in ${input.driveStatus} status and not open for applications.`);
  }

  // 2. Application Deadline
  const deadlineDate = new Date(input.applicationDeadline);
  const now = new Date();
  if (isNaN(deadlineDate.getTime())) {
    reasons.push('Invalid application deadline configured on drive.');
  } else if (now > deadlineDate) {
    reasons.push(`The application deadline (${deadlineDate.toLocaleDateString()}) has expired.`);
    missingRequirements.push('Deadline Passed');
  }

  const sp = input.studentProfile || {};

  // 3. Cohort Scoping Check
  if (input.driveCohortIds && input.driveCohortIds.length > 0) {
    const studentCohorts = input.studentEnrolledCohortIds || [];
    const hasMatchingCohort = input.driveCohortIds.some((cId) => studentCohorts.includes(cId.toString()));
    if (!hasMatchingCohort) {
      reasons.push('This drive is restricted to specific college cohorts to which you do not currently belong.');
      missingRequirements.push('Restricted Cohort Membership');
    }
  }

  // 4. Eligible Courses Check
  if (input.eligibleCourses && input.eligibleCourses.length > 0) {
    const studentCourse = sp.course?.trim();
    if (!studentCourse) {
      reasons.push('Academic course/degree is missing from your profile.');
      missingRequirements.push('Missing Course Profile');
    } else {
      const normalizedStudentCourse = studentCourse.toLowerCase();
      const courseMatch = input.eligibleCourses.some((c) => {
        const norm = c.toLowerCase().trim();
        return normalizedStudentCourse.includes(norm) || norm.includes(normalizedStudentCourse);
      });
      if (!courseMatch) {
        reasons.push(`Your course (${studentCourse}) is not in the eligible courses for this drive: ${input.eligibleCourses.join(', ')}.`);
        missingRequirements.push(`Course Mismatch (Requires: ${input.eligibleCourses.join(', ')})`);
      }
    }
  }

  // 5. Eligible Graduation Years Check
  if (input.eligibleGraduationYears && input.eligibleGraduationYears.length > 0) {
    const studentYear = sp.graduationYear;
    if (!studentYear) {
      reasons.push('Graduation year is missing from your profile.');
      missingRequirements.push('Missing Graduation Year');
    } else if (!input.eligibleGraduationYears.includes(studentYear)) {
      reasons.push(`Your graduation year (${studentYear}) is not eligible (eligible: ${input.eligibleGraduationYears.join(', ')}).`);
      missingRequirements.push(`Graduation Year Mismatch (Requires: ${input.eligibleGraduationYears.join(', ')})`);
    }
  }

  // 6. Required Skills Check
  if (input.requiredSkills && input.requiredSkills.length > 0) {
    const studentSkills = (sp.skills || []).map((s) => s.toLowerCase().trim());
    const missingSkills: string[] = [];

    for (const reqSkill of input.requiredSkills) {
      const normReq = reqSkill.toLowerCase().trim();
      const hasSkill = studentSkills.some((s) => s === normReq || s.includes(normReq) || normReq.includes(s));
      if (!hasSkill) {
        missingSkills.push(reqSkill);
      }
    }

    if (missingSkills.length > 0) {
      reasons.push(`You are missing required technical skills: ${missingSkills.join(', ')}.`);
      missingRequirements.push(...missingSkills.map((s) => `Missing Skill: ${s}`));
    }
  }

  const eligible = reasons.length === 0 && missingRequirements.length === 0;

  return {
    eligible,
    reasons: reasons.length > 0 ? reasons : ['You satisfy all academic, skill, and cohort requirements for this drive.'],
    missingRequirements,
    checkedAt: new Date().toISOString(),
  };
};
