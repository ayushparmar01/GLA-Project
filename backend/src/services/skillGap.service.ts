import { IUser } from '../models/user.model.js';
import { IPlacementDrive } from '../models/placementDrive.model.js';
import { AssessmentAttempt } from '../models/assessmentAttempt.model.js';
import { SEED_ASSESSMENTS } from '../config/skillTaxonomy.seed.js';
import { getDbStatus } from '../config/db.js';
import { SkillGapItem, SkillGapReport } from '../types/index.js';

export class SkillGapService {
  /**
   * Performs an explainable Skill Gap Analysis comparing a student's skills
   * (both self-declared and assessment-verified) against placement drive requirements.
   */
  public static async analyzeSkillGap(
    user: IUser,
    drive?: IPlacementDrive
  ): Promise<SkillGapReport> {
    const sp = user.studentProfile || {};

    // 1. Gather self-declared skills (normalized lowercase for matching)
    const selfDeclaredRaw = [
      ...(sp.technicalSkills || []),
      ...(sp.skills || []),
    ];
    const selfDeclaredSet = new Set<string>(
      selfDeclaredRaw.map((s) => s.trim().toLowerCase())
    );

    // 2. Gather assessment-verified skills
    const verifiedSkillsSet = new Set<string>();
    const dbStatus = getDbStatus();
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
        // If DB fails, fallback gracefully
      }
    }

    // 3. Define target skills (required and preferred)
    const requiredSkills = drive?.requiredSkills || ['JavaScript', 'React', 'Node.js', 'SQL & Relational Design'];
    const preferredSkills = drive?.preferredSkills || ['TypeScript', 'Docker', 'REST APIs'];

    const items: SkillGapItem[] = [];
    let matchedSkillsCount = 0;

    // Helper to find matching assessment
    const findAssessmentForSkill = (skillName: string) => {
      const lower = skillName.toLowerCase();
      const match = SEED_ASSESSMENTS.find(
        (a) =>
          a.skillsTested.some((st) => st.toLowerCase().includes(lower) || lower.includes(st.toLowerCase())) ||
          a.category.toLowerCase().includes(lower)
      );
      return match ? { id: match.id, title: match.title } : undefined;
    };

    // Helper to generate curated resources
    const getLearningResources = (skillName: string): string[] => {
      const s = skillName.toLowerCase();
      if (s.includes('react')) {
        return ['Official React Documentation (react.dev)', 'Full-Stack Open React Module'];
      }
      if (s.includes('node') || s.includes('express')) {
        return ['Node.js API Reference', 'Express.js Security Best Practices Guide'];
      }
      if (s.includes('sql') || s.includes('database')) {
        return ['Use The Index, Luke (SQL Indexing)', 'PostgreSQL / MySQL Official Tutorials'];
      }
      if (s.includes('docker') || s.includes('cloud')) {
        return ['Docker Getting Started Guide', 'AWS Cloud Practitioner Essentials'];
      }
      if (s.includes('dsa') || s.includes('algorithm') || s.includes('tree')) {
        return ['NeetCode 150 Algorithms Roadmap', 'MIT OpenCourseWare 6.006 (Intro to Algorithms)'];
      }
      return [`Comprehensive Guide to ${skillName}`, `FreeCodeCamp ${skillName} Interactive Path`];
    };

    // Process Required Skills
    for (const skill of requiredSkills) {
      const lower = skill.trim().toLowerCase();
      let status: SkillGapItem['status'] = 'MISSING';

      // Check verified first (takes highest priority)
      const isVerified = Array.from(verifiedSkillsSet).some(
        (vs) => vs === lower || vs.includes(lower) || lower.includes(vs)
      );
      const isSelfDeclared = Array.from(selfDeclaredSet).some(
        (sd) => sd === lower || sd.includes(lower) || lower.includes(sd)
      );

      if (isVerified) {
        status = 'ASSESSMENT_VERIFIED';
        matchedSkillsCount++;
      } else if (isSelfDeclared) {
        status = 'SELF_DECLARED';
        matchedSkillsCount++;
      }

      const suggestedAsm = findAssessmentForSkill(skill);

      items.push({
        skill,
        status,
        importance: 'REQUIRED',
        suggestedAssessmentId: suggestedAsm?.id,
        suggestedAssessmentTitle: suggestedAsm?.title,
        learningResources: status === 'MISSING' || status === 'SELF_DECLARED' ? getLearningResources(skill) : undefined,
      });
    }

    // Process Preferred Skills
    for (const skill of preferredSkills) {
      const lower = skill.trim().toLowerCase();
      let status: SkillGapItem['status'] = 'MISSING';

      const isVerified = Array.from(verifiedSkillsSet).some(
        (vs) => vs === lower || vs.includes(lower) || lower.includes(vs)
      );
      const isSelfDeclared = Array.from(selfDeclaredSet).some(
        (sd) => sd === lower || sd.includes(lower) || lower.includes(sd)
      );

      if (isVerified) {
        status = 'ASSESSMENT_VERIFIED';
      } else if (isSelfDeclared) {
        status = 'SELF_DECLARED';
      }

      const suggestedAsm = findAssessmentForSkill(skill);

      items.push({
        skill,
        status,
        importance: 'PREFERRED',
        suggestedAssessmentId: suggestedAsm?.id,
        suggestedAssessmentTitle: suggestedAsm?.title,
        learningResources: status === 'MISSING' ? getLearningResources(skill) : undefined,
      });
    }

    const missingSkillsCount = requiredSkills.length - matchedSkillsCount;
    const matchPercentage =
      requiredSkills.length > 0
        ? Math.round((matchedSkillsCount / requiredSkills.length) * 100)
        : 100;

    // Tailored learning path
    const learningPath: string[] = [];
    const missingRequired = items.filter((i) => i.importance === 'REQUIRED' && i.status === 'MISSING');
    const selfDeclaredReq = items.filter((i) => i.importance === 'REQUIRED' && i.status === 'SELF_DECLARED');

    if (missingRequired.length > 0) {
      learningPath.push(
        `High Priority: Study fundamentals for missing required skills: ${missingRequired.map((m) => m.skill).join(', ')}.`
      );
    }
    if (selfDeclaredReq.length > 0) {
      learningPath.push(
        `Verification Priority: Validate your self-declared skills (${selfDeclaredReq.map((s) => s.skill).join(', ')}) by passing our standardized assessments.`
      );
    }
    learningPath.push(
      'Portfolio Proof: Build and deploy a capstone project demonstrating the combination of these skills with public GitHub source code.'
    );

    return {
      driveId: drive ? (drive._id as unknown as { toString(): string }).toString() : undefined,
      driveTitle: drive?.title,
      organizationName: drive?.organizationName,
      requiredSkillsCount: requiredSkills.length,
      matchedSkillsCount,
      missingSkillsCount: Math.max(0, missingSkillsCount),
      matchPercentage,
      skills: items,
      learningPath,
    };
  }
}
