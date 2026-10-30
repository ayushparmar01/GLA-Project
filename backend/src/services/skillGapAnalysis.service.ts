import { IUser } from '../models/user.model.js';
import { PlacementDrive, IPlacementDrive } from '../models/placementDrive.model.js';
import { AssessmentAttempt } from '../models/assessmentAttempt.model.js';
import { LearningResource } from '../models/learningResource.model.js';
import { getDbStatus } from '../config/db.js';
import {
  SkillGapItem,
  StudentSkillGapAnalysisReport,
} from '../types/index.js';

export class SkillGapAnalysisService {
  /**
   * Generates a comprehensive skill gap analysis report for a student across all published drives
   * or targeted to a specific drive.
   */
  public static async analyzeSkillGaps(
    user: IUser,
    targetDriveId?: string
  ): Promise<StudentSkillGapAnalysisReport> {
    const sp = user.studentProfile || {};
    const dbStatus = getDbStatus();

    // 1. Collect student skills and verification states
    const selfDeclaredSkills = [
      ...(sp.technicalSkills || []),
      ...(sp.skills || []),
    ].map((s) => s.trim().toLowerCase());

    const verifiedSkillsMap = new Map<string, number>(); // skill -> highest score
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
              const lower = sr.skill.trim().toLowerCase();
              const curr = verifiedSkillsMap.get(lower) || 0;
              if (sr.percentage > curr) {
                verifiedSkillsMap.set(lower, sr.percentage);
              }
            }
          }
        }
      } catch {
        // Continue gracefully
      }
    }

    // 2. Fetch drives
    let drives: IPlacementDrive[] = [];
    if (dbStatus.status === 'connected') {
      try {
        if (targetDriveId) {
          const single = await PlacementDrive.findById(targetDriveId);
          if (single) drives = [single];
        } else {
          drives = await PlacementDrive.find({ status: 'PUBLISHED' }).limit(30);
        }
      } catch {
        drives = [];
      }
    }

    // 3. Aggregate drive skill frequencies and requirement types
    const mandatorySkillDemand = new Map<string, number>();
    const preferredSkillDemand = new Map<string, number>();

    for (const drive of drives) {
      for (const skill of drive.requiredSkills || []) {
        const lower = skill.trim();
        mandatorySkillDemand.set(lower, (mandatorySkillDemand.get(lower) || 0) + 1);
      }
      for (const skill of drive.preferredSkills || []) {
        const lower = skill.trim();
        preferredSkillDemand.set(lower, (preferredSkillDemand.get(lower) || 0) + 1);
      }
    }

    // Combine all unique skills in demand
    const allSkills = Array.from(
      new Set([...Array.from(mandatorySkillDemand.keys()), ...Array.from(preferredSkillDemand.keys())])
    );

    // 4. Fetch learning resources from catalog
    const resourceMap = new Map<string, any>();
    if (dbStatus.status === 'connected' && allSkills.length > 0) {
      try {
        const catalogResources = await LearningResource.find({
          isActive: true,
        }).limit(100).lean();

        for (const res of catalogResources) {
          const resSkill = res.skill.toLowerCase().trim();
          if (!resourceMap.has(resSkill)) {
            resourceMap.set(resSkill, {
              title: res.title,
              topic: res.topic,
              difficulty: res.difficulty,
              url: res.url,
              source: res.provider || 'CareerBridge Learning Catalog',
            });
          }
        }
      } catch {
        // Fallback gracefully
      }
    }

    // 5. Evaluate gap for each skill
    const gaps: SkillGapItem[] = [];
    let matchingCount = 0;
    let missingCount = 0;
    const criticalMissingSkills: string[] = [];

    for (const rawSkill of allSkills) {
      const lower = rawSkill.toLowerCase().trim();
      const isMandatory = mandatorySkillDemand.has(rawSkill);
      const requirementType = isMandatory ? 'MANDATORY' : 'PREFERRED';
      const demandCount = (mandatorySkillDemand.get(rawSkill) || 0) + (preferredSkillDemand.get(rawSkill) || 0);

      // Student skill presence
      const hasDeclared = selfDeclaredSkills.some(
        (s) => s === lower || s.includes(lower) || lower.includes(s)
      );
      const verifiedScore = verifiedSkillsMap.get(lower);
      const isVerified = verifiedScore !== undefined && verifiedScore >= 60;

      let proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'NONE' = 'NONE';
      if (isVerified) {
        proficiency = verifiedScore >= 80 ? 'ADVANCED' : 'INTERMEDIATE';
      } else if (hasDeclared) {
        proficiency = 'BEGINNER';
      }

      let gapCategory: 'MATCHED' | 'MISSING_MANDATORY' | 'MISSING_PREFERRED' | 'NEEDS_IMPROVEMENT';
      let action = '';

      if (isVerified) {
        gapCategory = 'MATCHED';
        matchingCount++;
        action = `Skill is verified at ${verifiedScore}%. Maintain proficiency with advanced challenges.`;
      } else if (hasDeclared) {
        gapCategory = 'NEEDS_IMPROVEMENT';
        matchingCount++;
        action = `Self-declared in profile. Take an assessment to earn verified credentials for employers.`;
      } else {
        missingCount++;
        if (isMandatory) {
          gapCategory = 'MISSING_MANDATORY';
          criticalMissingSkills.push(rawSkill);
          action = `High-priority requirement across ${demandCount} opportunities. Study core concepts and practice.`;
        } else {
          gapCategory = 'MISSING_PREFERRED';
          action = `Preferred skill for competitive advantage. Review foundational tutorials.`;
        }
      }

      // Learning resource resolution (from DB or structured fallback)
      let learningRes = resourceMap.get(lower);
      if (!learningRes) {
        learningRes = {
          title: `Mastering ${rawSkill}`,
          topic: rawSkill,
          difficulty: isMandatory ? 'INTERMEDIATE' : 'BEGINNER',
          url: `https://www.google.com/search?q=learn+${encodeURIComponent(rawSkill)}+tutorial`,
          source: 'CareerBridge Curated Library',
        };
      }

      const relevanceScore = Math.min(100, demandCount * 20 + (isMandatory ? 40 : 10));

      gaps.push({
        skill: rawSkill,
        requirementType,
        studentProficiency: proficiency,
        verified: Boolean(isVerified),
        gapCategory,
        relevanceScore,
        recommendedAction: action,
        recommendedLearningResource: learningRes,
      });
    }

    // Sort gaps: Missing Mandatory first, then Needs Improvement, then Missing Preferred, then Matched
    const categoryPriority = {
      MISSING_MANDATORY: 1,
      NEEDS_IMPROVEMENT: 2,
      MISSING_PREFERRED: 3,
      MATCHED: 4,
    };

    gaps.sort((a, b) => {
      const pDiff = categoryPriority[a.gapCategory] - categoryPriority[b.gapCategory];
      if (pDiff !== 0) return pDiff;
      return b.relevanceScore - a.relevanceScore;
    });

    // Prioritized learning sequence
    const prioritizedLearningSequence = gaps
      .filter((g) => g.gapCategory !== 'MATCHED')
      .slice(0, 8)
      .map((g) => g.skill);

    const totalEvaluated = matchingCount + missingCount;
    const averageScore = totalEvaluated > 0 ? Math.round((matchingCount / totalEvaluated) * 100) : 50;

    return {
      studentId: (user._id as any).toString(),
      overallMatchScoreAverage: averageScore,
      matchingSkillsCount: matchingCount,
      missingSkillsCount: missingCount,
      criticalMissingSkills: criticalMissingSkills.slice(0, 5),
      gaps,
      prioritizedLearningSequence,
      analyzedAt: new Date().toISOString(),
    };
  }
}
