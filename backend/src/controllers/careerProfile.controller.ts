import { Request, Response } from 'express';
import { User, IUser } from '../models/user.model.js';
import { getDbStatus } from '../config/db.js';
import { calculateProfileCompletion } from '../services/profileCompletion.service.js';
import { ProjectItem } from '../types/index.js';

function isValidHttpUrl(stringUrl?: string): boolean {
  if (!stringUrl || stringUrl.trim() === '') return true;
  try {
    const url = new URL(stringUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const getCareerProfile = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only students can access career profiles.' },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is currently unavailable.' },
    });
    return;
  }

  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Student profile not found.' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        profile: user.studentProfile || {},
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve career profile.',
        details: error instanceof Error ? error.message : undefined,
      },
    });
  }
};

export const updateCareerProfile = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only students can update career profiles.' },
    });
    return;
  }

  const {
    headline,
    careerObjective,
    specialization,
    technicalSkills,
    softSkills,
    skills,
    educationLevel,
    collegeName,
    course,
    graduationYear,
    cgpa,
    githubUrl,
    linkedinUrl,
    portfolioUrl,
    preferredJobRoles,
    preferredWorkLocations,
    preferredWorkLocation,
    careerInterests,
    workModePreference,
    educationHistory,
    certifications,
    internships,
    workExperience,
    achievements,
    extracurriculars,
  } = req.body;

  // URL Validation
  if (githubUrl && !isValidHttpUrl(githubUrl)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid GitHub URL format. Must start with http:// or https://' },
    });
    return;
  }

  if (linkedinUrl && !isValidHttpUrl(linkedinUrl)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid LinkedIn URL format. Must start with http:// or https://' },
    });
    return;
  }

  if (portfolioUrl && !isValidHttpUrl(portfolioUrl)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid Portfolio URL format. Must start with http:// or https://' },
    });
    return;
  }

  if (workModePreference && !['ONSITE', 'REMOTE', 'HYBRID', 'ANY'].includes(workModePreference)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Work mode preference must be ONSITE, REMOTE, HYBRID, or ANY.' },
    });
    return;
  }

  if (headline && headline.length > 150) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Headline cannot exceed 150 characters.' },
    });
    return;
  }

  if (careerObjective && careerObjective.length > 1500) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Career objective cannot exceed 1500 characters.' },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is currently unavailable.' },
    });
    return;
  }

  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Student not found.' },
      });
      return;
    }

    if (!user.studentProfile) {
      user.studentProfile = {};
    }

    if (headline !== undefined) user.studentProfile.headline = headline;
    if (careerObjective !== undefined) user.studentProfile.careerObjective = careerObjective;
    if (specialization !== undefined) user.studentProfile.specialization = specialization;
    if (technicalSkills !== undefined) user.studentProfile.technicalSkills = technicalSkills;
    if (softSkills !== undefined) user.studentProfile.softSkills = softSkills;
    if (skills !== undefined) user.studentProfile.skills = skills;
    if (educationLevel !== undefined) user.studentProfile.educationLevel = educationLevel;
    if (collegeName !== undefined) user.studentProfile.collegeName = collegeName;
    if (course !== undefined) user.studentProfile.course = course;
    if (graduationYear !== undefined) user.studentProfile.graduationYear = graduationYear;
    if (cgpa !== undefined) user.studentProfile.cgpa = cgpa;
    if (githubUrl !== undefined) user.studentProfile.githubUrl = githubUrl;
    if (linkedinUrl !== undefined) user.studentProfile.linkedinUrl = linkedinUrl;
    if (portfolioUrl !== undefined) user.studentProfile.portfolioUrl = portfolioUrl;
    if (preferredJobRoles !== undefined) user.studentProfile.preferredJobRoles = preferredJobRoles;
    if (preferredWorkLocations !== undefined) user.studentProfile.preferredWorkLocations = preferredWorkLocations;
    if (preferredWorkLocation !== undefined) user.studentProfile.preferredWorkLocation = preferredWorkLocation;
    if (careerInterests !== undefined) user.studentProfile.careerInterests = careerInterests;
    if (workModePreference !== undefined) user.studentProfile.workModePreference = workModePreference;
    if (educationHistory !== undefined) user.studentProfile.educationHistory = educationHistory;
    if (certifications !== undefined) user.studentProfile.certifications = certifications;
    if (internships !== undefined) user.studentProfile.internships = internships;
    if (workExperience !== undefined) user.studentProfile.workExperience = workExperience;
    if (achievements !== undefined) user.studentProfile.achievements = achievements;
    if (extracurriculars !== undefined) user.studentProfile.extracurriculars = extracurriculars;

    user.studentProfile.profileCompletionScore = user.calculateStudentScore();
    await user.save();

    const completion = await calculateProfileCompletion(user);

    res.status(200).json({
      success: true,
      data: {
        user: user.toSafeObject(),
        profileCompletion: completion,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update career profile.',
        details: error instanceof Error ? error.message : undefined,
      },
    });
  }
};

export const getProfileCompletion = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only students can check profile completion.' },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is currently unavailable.' },
    });
    return;
  }

  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Student not found.' },
      });
      return;
    }

    const report = await calculateProfileCompletion(user);

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to calculate profile completion report.',
        details: error instanceof Error ? error.message : undefined,
      },
    });
  }
};

export const addProject = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only students can add portfolio projects.' },
    });
    return;
  }

  const { title, description, technologies, role, duration, githubUrl, liveDemoUrl, imageUrl, visibility } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Project title is required (minimum 2 characters).' },
    });
    return;
  }

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Project description is required (minimum 10 characters).' },
    });
    return;
  }

  if (githubUrl && !isValidHttpUrl(githubUrl)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid GitHub URL format.' },
    });
    return;
  }

  if (liveDemoUrl && !isValidHttpUrl(liveDemoUrl)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid Live Demo URL format.' },
    });
    return;
  }

  if (imageUrl && !isValidHttpUrl(imageUrl)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid Image URL format.' },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is currently unavailable.' },
    });
    return;
  }

  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Student not found.' },
      });
      return;
    }

    if (!user.studentProfile) {
      user.studentProfile = {};
    }

    if (!user.studentProfile.projects) {
      user.studentProfile.projects = [];
    }

    const newProject: ProjectItem = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      description: description.trim(),
      technologies: Array.isArray(technologies) ? technologies.map((t) => String(t).trim()).filter(Boolean) : [],
      role: role ? String(role).trim() : undefined,
      duration: duration ? String(duration).trim() : undefined,
      githubUrl: githubUrl ? String(githubUrl).trim() : undefined,
      liveDemoUrl: liveDemoUrl ? String(liveDemoUrl).trim() : undefined,
      imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
      visibility: visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    user.studentProfile.projects.push(newProject);
    user.markModified('studentProfile');
    await user.save();

    res.status(201).json({
      success: true,
      data: newProject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to add project.',
        details: error instanceof Error ? error.message : undefined,
      },
    });
  }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only students can update projects.' },
    });
    return;
  }

  const projectId = String(req.params.projectId);
  const { title, description, technologies, role, duration, githubUrl, liveDemoUrl, imageUrl, visibility } = req.body;

  if (title !== undefined && (typeof title !== 'string' || title.trim().length < 2)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Title must be at least 2 characters.' },
    });
    return;
  }

  if (description !== undefined && (typeof description !== 'string' || description.trim().length < 10)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Description must be at least 10 characters.' },
    });
    return;
  }

  if (githubUrl && !isValidHttpUrl(githubUrl)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid GitHub URL format.' },
    });
    return;
  }

  if (liveDemoUrl && !isValidHttpUrl(liveDemoUrl)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid Live Demo URL format.' },
    });
    return;
  }

  if (imageUrl && !isValidHttpUrl(imageUrl)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid Image URL format.' },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is currently unavailable.' },
    });
    return;
  }

  try {
    const user = await User.findById(req.user.sub);
    if (!user || !user.studentProfile?.projects) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found.' },
      });
      return;
    }

    const projIndex = user.studentProfile.projects.findIndex((p) => p.id === projectId);
    if (projIndex === -1) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found in profile.' },
      });
      return;
    }

    const proj = user.studentProfile.projects[projIndex];
    if (title !== undefined) proj.title = title.trim();
    if (description !== undefined) proj.description = description.trim();
    if (technologies !== undefined) {
      proj.technologies = Array.isArray(technologies) ? technologies.map((t) => String(t).trim()).filter(Boolean) : [];
    }
    if (role !== undefined) proj.role = role ? String(role).trim() : undefined;
    if (duration !== undefined) proj.duration = duration ? String(duration).trim() : undefined;
    if (githubUrl !== undefined) proj.githubUrl = githubUrl ? String(githubUrl).trim() : undefined;
    if (liveDemoUrl !== undefined) proj.liveDemoUrl = liveDemoUrl ? String(liveDemoUrl).trim() : undefined;
    if (imageUrl !== undefined) proj.imageUrl = imageUrl ? String(imageUrl).trim() : undefined;
    if (visibility !== undefined) proj.visibility = visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
    proj.updatedAt = new Date().toISOString();

    user.studentProfile.projects[projIndex] = proj;
    user.markModified('studentProfile');
    await user.save();

    res.status(200).json({
      success: true,
      data: proj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update project.',
        details: error instanceof Error ? error.message : undefined,
      },
    });
  }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only students can delete projects.' },
    });
    return;
  }

  const projectId = String(req.params.projectId);
  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is currently unavailable.' },
    });
    return;
  }

  try {
    const user = await User.findById(req.user.sub);
    if (!user || !user.studentProfile?.projects) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found.' },
      });
      return;
    }

    const initialLength = user.studentProfile.projects.length;
    user.studentProfile.projects = user.studentProfile.projects.filter((p) => p.id !== projectId);

    if (user.studentProfile.projects.length === initialLength) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found in profile.' },
      });
      return;
    }

    user.markModified('studentProfile');
    await user.save();

    res.status(200).json({
      success: true,
      data: { message: 'Project deleted successfully.', projectId },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete project.',
        details: error instanceof Error ? error.message : undefined,
      },
    });
  }
};
