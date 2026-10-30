import { User, IUser } from '../models/user.model.js';
import { Resume } from '../models/resume.model.js';
import { getDbStatus } from '../config/db.js';
import { ProfileCompletionReport, ProfileCompletionSection } from '../types/index.js';

export async function calculateProfileCompletion(user: IUser, hasSavedResume?: boolean): Promise<ProfileCompletionReport> {
  const sp = user.studentProfile || {};

  // Check if student has created any resumes
  let hasResume = false;
  if (typeof hasSavedResume === 'boolean') {
    hasResume = hasSavedResume;
  } else {
    const dbStatus = getDbStatus();
    if (dbStatus.status === 'connected') {
      try {
        const resumeCount = await Resume.countDocuments({ studentId: user._id });
        hasResume = resumeCount > 0;
      } catch {
        hasResume = false;
      }
    }
  }

  // Section 1: Basic & Career Identity (15%)
  const hasBasicInfo = Boolean(
    user.fullName &&
    user.email &&
    sp.headline &&
    sp.headline.trim().length >= 3 &&
    sp.careerObjective &&
    sp.careerObjective.trim().length >= 10
  );

  // Section 2: Education (15%)
  const hasEducation = Boolean(
    (sp.collegeName && sp.collegeName.trim().length > 0 && sp.course && sp.graduationYear) ||
    (sp.educationHistory && sp.educationHistory.length > 0)
  );

  // Section 3: Skills (15%)
  const techSkillsCount = sp.technicalSkills?.length || (sp.skills?.length || 0);
  const softSkillsCount = sp.softSkills?.length || 0;
  const hasSkills = techSkillsCount + softSkillsCount >= 3;

  // Section 4: Project Portfolio (15%)
  const hasProjects = Boolean(sp.projects && sp.projects.length >= 1);

  // Section 5: Experience / Internships (15%)
  const hasExperience = Boolean(
    (sp.internships && sp.internships.length > 0) ||
    (sp.workExperience && sp.workExperience.length > 0)
  );

  // Section 6: Certifications & Achievements (10%)
  const hasCredentials = Boolean(
    (sp.certifications && sp.certifications.length > 0) ||
    (sp.achievements && sp.achievements.length > 0)
  );

  // Section 7: Professional Links (5%)
  const hasLinks = Boolean(
    (sp.githubUrl && sp.githubUrl.trim().length > 0) ||
    (sp.linkedinUrl && sp.linkedinUrl.trim().length > 0) ||
    (sp.portfolioUrl && sp.portfolioUrl.trim().length > 0)
  );

  // Section 8: ATS Resume Built (10%)
  const sections: ProfileCompletionSection[] = [
    {
      key: 'basic_identity',
      label: 'Headline & Career Objective',
      weight: 15,
      completed: hasBasicInfo,
      details: hasBasicInfo
        ? 'Headline and career objective are set'
        : 'Add your headline and career objective',
    },
    {
      key: 'education',
      label: 'Academic Background',
      weight: 15,
      completed: hasEducation,
      details: hasEducation
        ? 'College and course details verified'
        : 'Specify college name, degree, and graduation year',
    },
    {
      key: 'skills',
      label: 'Technical & Soft Skills',
      weight: 15,
      completed: hasSkills,
      details: hasSkills
        ? `${techSkillsCount} technical and ${softSkillsCount} soft skills added`
        : 'Add at least 3 relevant skills to your profile',
    },
    {
      key: 'projects',
      label: 'Project Portfolio',
      weight: 15,
      completed: hasProjects,
      details: hasProjects
        ? `${sp.projects?.length} portfolio project(s) showcased`
        : 'Add at least one real-world project with GitHub or demo link',
    },
    {
      key: 'experience',
      label: 'Internships & Experience',
      weight: 15,
      completed: hasExperience,
      details: hasExperience
        ? 'Internship or practical experience documented'
        : 'Add internships, training programs, or job experience',
    },
    {
      key: 'certifications',
      label: 'Certifications & Honors',
      weight: 10,
      completed: hasCredentials,
      details: hasCredentials
        ? 'Verified certifications or awards recorded'
        : 'Upload certifications or academic achievements',
    },
    {
      key: 'links',
      label: 'Professional Online Presence',
      weight: 5,
      completed: hasLinks,
      details: hasLinks
        ? 'GitHub, LinkedIn, or personal portfolio linked'
        : 'Add your GitHub, LinkedIn, or portfolio website URL',
    },
    {
      key: 'resume',
      label: 'ATS-Friendly Resume Built',
      weight: 10,
      completed: hasResume,
      details: hasResume
        ? 'At least one resume version built and saved'
        : 'Build your first ATS resume in the Resume Builder',
    },
  ];

  let totalScore = 0;
  let completedCount = 0;
  const nextSteps: string[] = [];

  for (const sec of sections) {
    if (sec.completed) {
      totalScore += sec.weight;
      completedCount++;
    } else {
      nextSteps.push(sec.details);
    }
  }

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    isComplete: totalScore === 100,
    sections,
    completedCount,
    totalCount: sections.length,
    nextSteps,
  };
}
