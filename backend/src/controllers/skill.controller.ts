import { Request, Response } from 'express';
import { Skill } from '../models/skill.model.js';
import { SEED_SKILLS } from '../config/skillTaxonomy.seed.js';
import { getDbStatus } from '../config/db.js';
import { ApiResponse, SkillCategory, SkillData } from '../types/index.js';

export class SkillController {
  /**
   * GET /api/skills
   * Returns list of skills filtered by category or search keyword.
   */
  public static async getSkills(req: Request, res: Response): Promise<void> {
    try {
      const category = req.query.category as SkillCategory | undefined;
      const search = (req.query.search as string | undefined)?.toLowerCase().trim();

      const dbStatus = getDbStatus();
      let skills: SkillData[] = [];

      if (dbStatus.status === 'connected') {
        const filter: Record<string, unknown> = { isActive: true };
        if (category) filter.category = category;
        if (search) {
          filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { relatedSkills: { $regex: search, $options: 'i' } },
          ];
        }

        const dbSkills = await Skill.find(filter).sort({ name: 1 });
        if (dbSkills.length > 0) {
          skills = dbSkills.map((s) => s.toSafeObject());
        }
      }

      // If database is offline or empty, fallback gracefully to curated SEED_SKILLS
      if (skills.length === 0) {
        skills = SEED_SKILLS.filter((s) => {
          if (!s.isActive) return false;
          if (category && s.category !== category) return false;
          if (search) {
            const matchesName = s.name.toLowerCase().includes(search);
            const matchesDesc = s.description.toLowerCase().includes(search);
            const matchesRelated = s.relatedSkills.some((r) => r.toLowerCase().includes(search));
            return matchesName || matchesDesc || matchesRelated;
          }
          return true;
        });
      }

      const response: ApiResponse<SkillData[]> = {
        success: true,
        data: skills,
      };
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'FETCH_SKILLS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to retrieve skill taxonomy',
        },
      };
      res.status(500).json(response);
    }
  }

  /**
   * GET /api/skills/categories
   * Returns the 10 standard skill taxonomy categories.
   */
  public static async getCategories(_req: Request, res: Response): Promise<void> {
    const categories: SkillCategory[] = [
      'Programming Languages',
      'Data Structures and Algorithms',
      'Web Development',
      'Databases',
      'Cloud Computing',
      'AI and Machine Learning',
      'Cybersecurity',
      'Software Engineering',
      'Communication',
      'Problem Solving',
    ];

    res.status(200).json({
      success: true,
      data: categories,
    });
  }
}
