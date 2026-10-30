import { EligibilityResult, StudentProfileData, EligibilityStatus } from '../types/index.js';

export interface EvaluateEligibilityInput {
  driveStatus: string;
  applicationDeadline: Date | string;
  driveCohortIds?: string[];
  eligibleCourses?: string[];
  eligibleBranches?: string[];
  eligibleGraduationYears?: number[];
  requiredSkills?: string[];
  minimumCGPA?: number;
  maxBacklogsAllowed?: number;
  minExperienceYears?: number;
  studentProfile?: StudentProfileData;
  studentEnrolledCohortIds?: string[];
}

export const evaluateEligibility = (input: EvaluateEligibilityInput): EligibilityResult => {
  const reasons: string[] = [];
  const missingRequirements: string[] = [];

  let academicEligible = true;
  let skillsEligible = true;
  let cgpaEligible = true;
  let batchEligible = true;
  let backlogEligible = true;
  let isIncompleteProfile = false;

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

  // Check if profile is substantially incomplete
  const hasAcademicProfile = Boolean(sp.course || sp.specialization);
  const hasSkills = Boolean((sp.skills && sp.skills.length > 0) || (sp.technicalSkills && sp.technicalSkills.length > 0));

  // 3. Cohort Scoping Check
  if (input.driveCohortIds && input.driveCohortIds.length > 0) {
    const studentCohorts = input.studentEnrolledCohortIds || [];
    const hasMatchingCohort = input.driveCohortIds.some((cId) => studentCohorts.includes(cId.toString()));
    if (!hasMatchingCohort) {
      reasons.push('This drive is restricted to specific college cohorts to which you do not currently belong.');
      missingRequirements.push('Restricted Cohort Membership');
    }
  }

  // 4. Eligible Courses & Branches Check
  if (input.eligibleCourses && input.eligibleCourses.length > 0) {
    const studentCourse = sp.course?.trim();
    if (!studentCourse) {
      reasons.push('Academic course/degree is missing from your profile.');
      missingRequirements.push('Missing Course Profile');
      academicEligible = false;
      isIncompleteProfile = true;
    } else {
      const normalizedStudentCourse = studentCourse.toLowerCase();
      const courseMatch = input.eligibleCourses.some((c) => {
        const norm = c.toLowerCase().trim();
        return normalizedStudentCourse.includes(norm) || norm.includes(normalizedStudentCourse);
      });
      if (!courseMatch) {
        reasons.push(`Your course (${studentCourse}) is not in the eligible courses for this drive: ${input.eligibleCourses.join(', ')}.`);
        missingRequirements.push(`Course Mismatch (Requires: ${input.eligibleCourses.join(', ')})`);
        academicEligible = false;
      }
    }
  }

  if (input.eligibleBranches && input.eligibleBranches.length > 0) {
    const studentBranch = sp.specialization?.trim() || sp.course?.trim();
    if (!studentBranch) {
      reasons.push('Branch / Specialization is missing from your profile.');
      missingRequirements.push('Missing Branch Profile');
      academicEligible = false;
      isIncompleteProfile = true;
    } else {
      const normalizedStudentBranch = studentBranch.toLowerCase();
      const branchMatch = input.eligibleBranches.some((b) => {
        const norm = b.toLowerCase().trim();
        return normalizedStudentBranch.includes(norm) || norm.includes(normalizedStudentBranch);
      });
      if (!branchMatch) {
        reasons.push(`Your specialization (${studentBranch}) is not in the eligible branches: ${input.eligibleBranches.join(', ')}.`);
        missingRequirements.push(`Branch Mismatch (Requires: ${input.eligibleBranches.join(', ')})`);
        academicEligible = false;
      }
    }
  }

  // 5. Eligible Graduation Years Check
  if (input.eligibleGraduationYears && input.eligibleGraduationYears.length > 0) {
    const studentYear = sp.graduationYear;
    if (!studentYear) {
      reasons.push('Graduation year is missing from your profile.');
      missingRequirements.push('Missing Graduation Year');
      batchEligible = false;
      isIncompleteProfile = true;
    } else if (!input.eligibleGraduationYears.includes(studentYear)) {
      reasons.push(`Your graduation year (${studentYear}) is not eligible (eligible: ${input.eligibleGraduationYears.join(', ')}).`);
      missingRequirements.push(`Graduation Year Mismatch (Requires: ${input.eligibleGraduationYears.join(', ')})`);
      batchEligible = false;
    }
  }

  // 6. Required Skills Check
  if (input.requiredSkills && input.requiredSkills.length > 0) {
    const rawSkills = [
      ...(sp.skills || []),
      ...(sp.technicalSkills || []),
    ];
    const studentSkills = Array.from(new Set(rawSkills.map((s) => s.toLowerCase().trim())));
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
      skillsEligible = false;
      if (!hasSkills) {
        isIncompleteProfile = true;
      }
    }
  }

  // 7. Minimum CGPA Check
  if (input.minimumCGPA && input.minimumCGPA > 0) {
    if (sp.cgpa === undefined || sp.cgpa === null) {
      reasons.push('CGPA is missing from your profile.');
      missingRequirements.push('Missing CGPA');
      cgpaEligible = false;
      isIncompleteProfile = true;
    } else if (sp.cgpa < input.minimumCGPA) {
      reasons.push(`Your CGPA (${sp.cgpa}) is below the required minimum of ${input.minimumCGPA}.`);
      missingRequirements.push(`CGPA Below Requirement (Requires: ${input.minimumCGPA})`);
      cgpaEligible = false;
    }
  }

  // 8. Backlogs Check
  if (input.maxBacklogsAllowed !== undefined && input.maxBacklogsAllowed !== null) {
    const studentBacklogs = sp.backlogs !== undefined ? sp.backlogs : 0;
    if (studentBacklogs > input.maxBacklogsAllowed) {
      reasons.push(`Your active backlogs (${studentBacklogs}) exceed maximum allowed (${input.maxBacklogsAllowed}).`);
      missingRequirements.push(`Backlogs Exceed Limit (Max: ${input.maxBacklogsAllowed}, Current: ${studentBacklogs})`);
      backlogEligible = false;
    }
  }

  // 9. Minimum Experience Check
  if (input.minExperienceYears && input.minExperienceYears > 0) {
    const workExpYears = (sp.workExperience || []).length * 1 + (sp.internships || []).length * 0.5;
    if (workExpYears < input.minExperienceYears) {
      reasons.push(`This role requires at least ${input.minExperienceYears} years of experience (your estimated experience: ${workExpYears} years).`);
      missingRequirements.push(`Experience Below Requirement (Requires: ${input.minExperienceYears} yrs)`);
    }
  }

  const eligible = reasons.length === 0 && missingRequirements.length === 0;

  // Determine structured status
  let status: EligibilityStatus = 'ELIGIBLE';
  if (!eligible) {
    if (isIncompleteProfile && (!hasAcademicProfile || !hasSkills || sp.cgpa === undefined)) {
      status = 'INCOMPLETE_PROFILE';
    } else {
      status = 'NOT_ELIGIBLE';
    }
  }

  return {
    eligible,
    status,
    reasons: reasons.length > 0 ? reasons : ['You satisfy all academic, skill, and cohort requirements for this drive.'],
    missingRequirements,
    academicEligible,
    skillsEligible,
    cgpaEligible,
    batchEligible,
    backlogEligible,
    checkedAt: new Date().toISOString(),
  };
};

export const evaluateJobEligibility = evaluateEligibility;
