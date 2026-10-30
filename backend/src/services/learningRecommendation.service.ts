import {
  LearningResourceData,
  LearningRecommendationData,
  RecommendationPillarScore,
  StudentProfileData,
  SkillGapLearningRecommendation,
  LearningPathData,
} from '../types/index.js';
import { SEED_PHASE17_RESOURCES, SEED_LEARNING_PATHS } from '../config/learningHub.seed.js';

export class LearningRecommendationService {
  private static instance: LearningRecommendationService;

  public static getInstance(): LearningRecommendationService {
    if (!LearningRecommendationService.instance) {
      LearningRecommendationService.instance = new LearningRecommendationService();
    }
    return LearningRecommendationService.instance;
  }

  /**
   * Compute 5-Pillar Explainable Recommendations for a student
   */
  public calculateRecommendations(
    resources: LearningResourceData[],
    profile?: Partial<StudentProfileData>,
    assessedSkillGaps: string[] = [],
    limit: number = 8
  ): LearningRecommendationData[] {
    const studentSkills = [
      ...(profile?.skills || []),
      ...(profile?.technicalSkills || []),
    ].map((s) => s.toLowerCase());

    const preferredRoles = [
      ...(profile?.preferredJobRoles || []),
      profile?.headline,
      profile?.careerObjective,
    ]
      .filter((r): r is string => Boolean(r && r.trim()))
      .map((r) => r.toLowerCase());

    const gapsLower = assessedSkillGaps.map((g) => g.toLowerCase());

    const scored: LearningRecommendationData[] = resources.map((resource) => {
      const resSkills = (resource.skills || [resource.skill]).map((s) => s.toLowerCase());
      const resCategory = (resource.category || '').toLowerCase();
      const resTopic = (resource.topic || '').toLowerCase();
      const resTitle = resource.title.toLowerCase();

      // Pillar 1: Career Goal Match (30%)
      let pillar1Score = 15; // baseline interest
      let pillar1Reason = 'Covers foundational engineering capabilities relevant to modern tech careers.';
      const roleMatch = preferredRoles.some((role) =>
        resSkills.some((sk) => role.includes(sk)) ||
        resCategory.includes(role) ||
        role.includes(resCategory) ||
        resTopic.includes(role) ||
        resTitle.includes(role)
      );
      if (roleMatch) {
        pillar1Score = 30;
        pillar1Reason = `Directly matches your target career aspiration in ${profile?.preferredJobRoles?.[0] || 'software engineering'}.`;
      } else if (resCategory.includes('web') || resCategory.includes('backend') || resCategory.includes('languages')) {
        pillar1Score = 24;
        pillar1Reason = 'Aligns well with core software development career milestones.';
      }

      // Pillar 2: Skill Gap Match (30%)
      let pillar2Score = 12;
      let pillar2Reason = 'Expands technical breadth across essential programming concepts.';
      let matchedGap: string | undefined = undefined;

      const gapFound = resSkills.find((sk) => gapsLower.some((gap) => gap.includes(sk) || sk.includes(gap)));
      if (gapFound) {
        pillar2Score = 30;
        matchedGap = gapFound;
        pillar2Reason = `Directly bridges your identified skill gap in "${gapFound.toUpperCase()}".`;
      } else {
        // Check if student lacks this skill
        const lacksSkill = !studentSkills.some((sk) => resSkills.some((rsk) => rsk.includes(sk) || sk.includes(rsk)));
        if (lacksSkill) {
          pillar2Score = 22;
          pillar2Reason = `Helps you acquire a high-leverage skill (${resource.skill}) not yet on your profile.`;
        }
      }

      // Pillar 3: Target Job / Market Demand Alignment (20%)
      let pillar3Score = 15;
      let pillar3Reason = 'High industry demand across entry-level and campus placement listings.';
      const highDemandKeywords = ['javascript', 'react', 'node.js', 'sql', 'python', 'dsa', 'algorithms', 'git'];
      const isHighDemand = resSkills.some((sk) => highDemandKeywords.includes(sk));
      if (isHighDemand) {
        pillar3Score = 20;
        pillar3Reason = 'Skill is present in over 85% of active tech hiring assessments and job drives.';
      }

      // Pillar 4: Difficulty Suitability (10%)
      let pillar4Score = 8;
      let pillar4Reason = 'Paced appropriately for your current readiness stage.';
      const isBeginner = (profile?.profileCompletionScore || 50) < 60;
      if (isBeginner && resource.difficulty === 'BEGINNER') {
        pillar4Score = 10;
        pillar4Reason = 'Beginner-friendly structure with step-by-step guidance.';
      } else if (!isBeginner && resource.difficulty !== 'BEGINNER') {
        pillar4Score = 10;
        pillar4Reason = 'Offers rigorous, practical challenges suited to your proficiency.';
      }

      // Pillar 5: Learning Preference Match (10%)
      let pillar5Score = 10;
      let pillar5Reason = `Format (${resource.resourceType}) allows rapid, modular learning.`;
      if (resource.resourceType === 'Documentation' || resource.resourceType === 'Practice Platforms') {
        pillar5Score = 10;
        pillar5Reason = 'Hands-on practice format delivers maximal retention for technical interviews.';
      }

      const totalScore = Math.min(100, Math.round(
        pillar1Score + pillar2Score + pillar3Score + pillar4Score + pillar5Score
      ));

      const pillars: RecommendationPillarScore[] = [
        {
          name: 'Career Goal Match',
          weight: 30,
          score: pillar1Score,
          maxScore: 30,
          explanation: pillar1Reason,
        },
        {
          name: 'Skill Gap Addressed',
          weight: 30,
          score: pillar2Score,
          maxScore: 30,
          explanation: pillar2Reason,
        },
        {
          name: 'Industry Placement Demand',
          weight: 20,
          score: pillar3Score,
          maxScore: 20,
          explanation: pillar3Reason,
        },
        {
          name: 'Difficulty Suitability',
          weight: 10,
          score: pillar4Score,
          maxScore: 10,
          explanation: pillar4Reason,
        },
        {
          name: 'Learning Format Efficiency',
          weight: 10,
          score: pillar5Score,
          maxScore: 10,
          explanation: pillar5Reason,
        },
      ];

      const whyRecommended: string[] = [
        pillar1Reason,
        pillar2Reason,
        pillar3Reason,
      ];

      return {
        resource,
        matchScore: totalScore,
        pillars,
        whyRecommended,
        careerGoalMatch: pillar1Reason,
        skillGapAddressed: matchedGap,
      };
    });

    // Sort descending by matchScore
    scored.sort((a, b) => b.matchScore - a.matchScore);
    return scored.slice(0, limit);
  }

  /**
   * Map student skill gaps directly to curated learning paths and resources
   */
  public mapSkillGapsToLearning(
    skillGaps: Array<{ skill: string; status?: string; source?: 'ASSESSMENT' | 'RESUME' | 'TARGET_ROLE' }>,
    availablePaths: LearningPathData[] = [],
    availableResources: LearningResourceData[] = []
  ): SkillGapLearningRecommendation[] {
    const pathsPool = availablePaths.length > 0 ? availablePaths : SEED_LEARNING_PATHS.map((p) => p.path as LearningPathData);
    const resourcesPool = availableResources.length > 0 ? availableResources : SEED_PHASE17_RESOURCES;

    return skillGaps.map((gap) => {
      const gapLower = gap.skill.toLowerCase();

      // Find matching paths
      const matchingPaths = pathsPool
        .filter((path) =>
          path.targetSkills.some((ts) => ts.toLowerCase().includes(gapLower) || gapLower.includes(ts.toLowerCase())) ||
          path.title.toLowerCase().includes(gapLower) ||
          path.careerRole.toLowerCase().includes(gapLower)
        )
        .slice(0, 2)
        .map((p) => ({
          id: p.id,
          title: p.title,
          careerRole: p.careerRole,
          difficulty: p.difficulty,
          estimatedDuration: p.estimatedDuration,
        }));

      // Find matching resources
      const matchingResources = resourcesPool
        .filter((res) => {
          const resSkills = (res.skills || [res.skill]).map((s) => s.toLowerCase());
          return (
            resSkills.some((s) => s.includes(gapLower) || gapLower.includes(s)) ||
            res.title.toLowerCase().includes(gapLower) ||
            res.topic.toLowerCase().includes(gapLower)
          );
        })
        .slice(0, 3);

      return {
        skill: gap.skill,
        gapStatus: (gap.status as any) || 'MISSING',
        source: gap.source || 'ASSESSMENT',
        recommendedPaths: matchingPaths,
        recommendedResources: matchingResources,
      };
    });
  }
}
