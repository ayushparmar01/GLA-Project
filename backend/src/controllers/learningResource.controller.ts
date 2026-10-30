import { Request, Response } from 'express';
import { LearningResource } from '../models/learningResource.model.js';
import { SEED_LEARNING_RESOURCES } from '../config/learningResources.seed.js';
import { getDbStatus } from '../config/db.js';
import { LearningResourceData } from '../types/index.js';

export async function listResources(req: Request, res: Response): Promise<void> {
  try {
    const { skill, category, resourceType, difficulty, isFree, search } = req.query;

    let resources: LearningResourceData[] = [];
    const dbStatus = getDbStatus();

    if (dbStatus.status === 'connected') {
      try {
        const count = await LearningResource.countDocuments();
        if (count === 0) {
          // Auto-seed if collection is empty
          await LearningResource.insertMany(SEED_LEARNING_RESOURCES);
        }

        const query: any = { isActive: true };
        if (category && typeof category === 'string') {
          query.category = { $regex: new RegExp(category, 'i') };
        }
        if (skill && typeof skill === 'string') {
          query.skills = { $regex: new RegExp(skill, 'i') };
        }
        if (resourceType && typeof resourceType === 'string') {
          query.resourceType = resourceType.toUpperCase();
        }
        if (difficulty && typeof difficulty === 'string') {
          query.difficulty = difficulty.toUpperCase();
        }
        if (isFree !== undefined) {
          query.isFree = isFree === 'true';
        }
        if (search && typeof search === 'string') {
          const sRegex = new RegExp(search, 'i');
          query.$or = [{ title: sRegex }, { description: sRegex }, { skills: sRegex }, { provider: sRegex }];
        }

        const docs = await LearningResource.find(query).sort({ rating: -1, title: 1 });
        resources = docs.map((d) => d.toSafeObject());
      } catch {
        // Fall back to in-memory seed catalog
        resources = SEED_LEARNING_RESOURCES.map((r, idx) => ({
          id: `res-${idx + 1}`,
          ...r,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      }
    } else {
      // Offline / In-memory fallback
      resources = SEED_LEARNING_RESOURCES.map((r, idx) => ({
        id: `res-${idx + 1}`,
        ...r,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }

    // Apply in-memory filtering if fallback was used
    if (skill && typeof skill === 'string') {
      const sLower = skill.toLowerCase();
      resources = resources.filter((r) =>
        r.skills.some((sk) => sk.toLowerCase().includes(sLower))
      );
    }
    if (category && typeof category === 'string') {
      const cLower = category.toLowerCase();
      resources = resources.filter((r) => r.category.toLowerCase().includes(cLower));
    }
    if (resourceType && typeof resourceType === 'string') {
      resources = resources.filter((r) => r.resourceType === resourceType.toUpperCase());
    }
    if (difficulty && typeof difficulty === 'string') {
      resources = resources.filter((r) => r.difficulty === difficulty.toUpperCase());
    }
    if (isFree !== undefined) {
      const freeBool = isFree === 'true';
      resources = resources.filter((r) => r.isFree === freeBool);
    }
    if (search && typeof search === 'string') {
      const sLower = search.toLowerCase();
      resources = resources.filter(
        (r) =>
          r.title.toLowerCase().includes(sLower) ||
          r.description.toLowerCase().includes(sLower) ||
          r.provider.toLowerCase().includes(sLower) ||
          r.skills.some((sk) => sk.toLowerCase().includes(sLower))
      );
    }

    res.status(200).json({
      success: true,
      count: resources.length,
      data: resources,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve learning resources',
      error: error.message,
    });
  }
}
