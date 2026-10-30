import { v4 as uuidv4 } from 'uuid';
import { LearningEnrollment } from '../models/learningEnrollment.model.js';
import { ModuleProgress } from '../models/moduleProgress.model.js';
import { LearningModule } from '../models/learningModule.model.js';
import { LearningPath } from '../models/learningPath.model.js';
import { LearningActivity } from '../models/learningActivity.model.js';
import {
  LearningEnrollmentData,
  ModuleProgressData,
  ModuleCompletionMethod,
  LearningActivityType,
} from '../types/index.js';
import { getDbStatus } from '../config/db.js';

// In-memory fallback stores for offline/sandboxed environments
const inMemoryEnrollments = new Map<string, LearningEnrollmentData>();
const inMemoryProgress = new Map<string, ModuleProgressData>();
const inMemoryActivities: any[] = [];

export class LearningProgressService {
  private static instance: LearningProgressService;

  public static getInstance(): LearningProgressService {
    if (!LearningProgressService.instance) {
      LearningProgressService.instance = new LearningProgressService();
    }
    return LearningProgressService.instance;
  }

  /**
   * Enroll a student in a learning path
   */
  public async enrollStudent(
    studentId: string,
    learningPathId: string
  ): Promise<{ enrollment: LearningEnrollmentData; isNew: boolean }> {
    const isDbConnected = getDbStatus().status === 'connected';

    if (isDbConnected) {
      try {
        const existing = await LearningEnrollment.findOne({
          studentId,
          learningPathId,
        });

        if (existing) {
          // Update last accessed
          existing.lastAccessedAt = new Date();
          await existing.save();
          return { enrollment: existing.toSafeObject(), isNew: false };
        }

        // Count total modules
        const totalModules = await LearningModule.countDocuments({ learningPathId });

        const newEnrollment = new LearningEnrollment({
          enrollmentId: `enr-${uuidv4().slice(0, 8)}`,
          studentId,
          learningPathId,
          status: 'IN_PROGRESS',
          progressPercentage: 0,
          completedModulesCount: 0,
          totalModulesCount: totalModules || 3,
          enrolledAt: new Date(),
          lastAccessedAt: new Date(),
          streakDays: 1,
        });

        await newEnrollment.save();

        // Increment enrollment count on path
        await LearningPath.findOneAndUpdate(
          { pathId: learningPathId },
          { $inc: { enrollmentCount: 1 } }
        );

        // Record activity
        await this.recordActivity(studentId, 'PATH_ENROLLED', {
          learningPathId,
        });

        return { enrollment: newEnrollment.toSafeObject(), isNew: true };
      } catch (err) {
        // Fall back to in-memory
      }
    }

    // In-memory fallback
    const key = `${studentId}:${learningPathId}`;
    const existing = inMemoryEnrollments.get(key);
    if (existing) {
      existing.lastAccessedAt = new Date().toISOString();
      return { enrollment: existing, isNew: false };
    }

    const created: LearningEnrollmentData = {
      id: `enr-${uuidv4().slice(0, 8)}`,
      studentId,
      learningPathId,
      status: 'IN_PROGRESS',
      progressPercentage: 0,
      completedModulesCount: 0,
      totalModulesCount: 3,
      enrolledAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      streakDays: 1,
    };
    inMemoryEnrollments.set(key, created);
    this.recordActivity(studentId, 'PATH_ENROLLED', { learningPathId });
    return { enrollment: created, isNew: true };
  }

  /**
   * Update module progress for a student
   */
  public async updateModuleProgress(
    studentId: string,
    learningPathId: string,
    moduleId: string,
    status: 'IN_PROGRESS' | 'COMPLETED',
    completionMethod: ModuleCompletionMethod = 'STUDENT_CONFIRMED',
    quizScore?: number,
    notes?: string
  ): Promise<{
    moduleProgress: ModuleProgressData;
    enrollment: LearningEnrollmentData;
  }> {
    const isDbConnected = getDbStatus().status === 'connected';

    if (isDbConnected) {
      try {
        let modProg = await ModuleProgress.findOne({
          studentId,
          learningPathId,
          moduleId,
        });

        if (!modProg) {
          modProg = new ModuleProgress({
            progressId: `prog-${uuidv4().slice(0, 8)}`,
            studentId,
            learningPathId,
            moduleId,
            status,
            completionMethod,
            completedAt: status === 'COMPLETED' ? new Date() : undefined,
            quizScore,
            notes,
          });
        } else {
          modProg.status = status;
          modProg.completionMethod = completionMethod;
          if (status === 'COMPLETED' && !modProg.completedAt) {
            modProg.completedAt = new Date();
          }
          if (quizScore !== undefined) modProg.quizScore = quizScore;
          if (notes !== undefined) modProg.notes = notes;
        }

        await modProg.save();

        // Recalculate enrollment progress
        const totalModules = await LearningModule.countDocuments({ learningPathId });
        const completedModules = await ModuleProgress.countDocuments({
          studentId,
          learningPathId,
          status: 'COMPLETED',
        });

        const effectiveTotal = Math.max(1, totalModules || 3);
        const percentage = Math.min(
          100,
          Math.round((completedModules / effectiveTotal) * 100)
        );

        let enrollment = await LearningEnrollment.findOne({
          studentId,
          learningPathId,
        });

        if (!enrollment) {
          enrollment = new LearningEnrollment({
            enrollmentId: `enr-${uuidv4().slice(0, 8)}`,
            studentId,
            learningPathId,
            status: percentage >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
            progressPercentage: percentage,
            completedModulesCount: completedModules,
            totalModulesCount: effectiveTotal,
            enrolledAt: new Date(),
            lastAccessedAt: new Date(),
            completedAt: percentage >= 100 ? new Date() : undefined,
            streakDays: 1,
          });
        } else {
          enrollment.progressPercentage = percentage;
          enrollment.completedModulesCount = completedModules;
          enrollment.totalModulesCount = effectiveTotal;
          enrollment.lastAccessedAt = new Date();
          if (percentage >= 100) {
            enrollment.status = 'COMPLETED';
            if (!enrollment.completedAt) {
              enrollment.completedAt = new Date();
              await LearningPath.findOneAndUpdate(
                { pathId: learningPathId },
                { $inc: { completionCount: 1 } }
              );
            }
          }
        }

        await enrollment.save();

        if (status === 'COMPLETED') {
          await this.recordActivity(studentId, 'MODULE_COMPLETED', {
            learningPathId,
            moduleId,
            quizScore,
          });
        }

        return {
          moduleProgress: modProg.toSafeObject(),
          enrollment: enrollment.toSafeObject(),
        };
      } catch (err) {
        // Fall back to in-memory
      }
    }

    // In-memory fallback
    const progKey = `${studentId}:${learningPathId}:${moduleId}`;
    const modProgressData: ModuleProgressData = {
      id: `prog-${uuidv4().slice(0, 8)}`,
      studentId,
      learningPathId,
      moduleId,
      status,
      completionMethod,
      completedAt: status === 'COMPLETED' ? new Date().toISOString() : undefined,
      quizScore,
      notes,
    };
    inMemoryProgress.set(progKey, modProgressData);

    const enrKey = `${studentId}:${learningPathId}`;
    let enrollment = inMemoryEnrollments.get(enrKey);
    const completedCount = status === 'COMPLETED' ? 1 : 0;
    const totalCount = 3;
    const progressPct = Math.round((completedCount / totalCount) * 100);

    if (!enrollment) {
      enrollment = {
        id: `enr-${uuidv4().slice(0, 8)}`,
        studentId,
        learningPathId,
        status: progressPct >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
        progressPercentage: progressPct,
        completedModulesCount: completedCount,
        totalModulesCount: totalCount,
        enrolledAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        completedAt: progressPct >= 100 ? new Date().toISOString() : undefined,
        streakDays: 1,
      };
    } else {
      enrollment.completedModulesCount = Math.min(
        totalCount,
        enrollment.completedModulesCount + (status === 'COMPLETED' ? 1 : 0)
      );
      enrollment.progressPercentage = Math.round(
        (enrollment.completedModulesCount / totalCount) * 100
      );
      enrollment.lastAccessedAt = new Date().toISOString();
      if (enrollment.progressPercentage >= 100) {
        enrollment.status = 'COMPLETED';
        enrollment.completedAt = new Date().toISOString();
      }
    }
    inMemoryEnrollments.set(enrKey, enrollment);

    if (status === 'COMPLETED') {
      this.recordActivity(studentId, 'MODULE_COMPLETED', {
        learningPathId,
        moduleId,
      });
    }

    return {
      moduleProgress: modProgressData,
      enrollment,
    };
  }

  /**
   * Log student activity
   */
  public async recordActivity(
    studentId: string,
    activityType: LearningActivityType,
    metadata: {
      resourceId?: string;
      learningPathId?: string;
      moduleId?: string;
      [key: string]: any;
    } = {}
  ): Promise<void> {
    const isDbConnected = getDbStatus().status === 'connected';

    if (isDbConnected) {
      try {
        const activity = new LearningActivity({
          activityId: `act-${uuidv4().slice(0, 8)}`,
          studentId,
          resourceId: metadata.resourceId,
          learningPathId: metadata.learningPathId,
          moduleId: metadata.moduleId,
          activityType,
          metadata,
        });
        await activity.save();
        return;
      } catch (err) {
        // Fall back
      }
    }

    inMemoryActivities.push({
      id: `act-${uuidv4().slice(0, 8)}`,
      studentId,
      resourceId: metadata.resourceId,
      learningPathId: metadata.learningPathId,
      moduleId: metadata.moduleId,
      activityType,
      metadata,
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Get student's active enrollments
   */
  public async getStudentEnrollments(
    studentId: string
  ): Promise<LearningEnrollmentData[]> {
    const isDbConnected = getDbStatus().status === 'connected';

    if (isDbConnected) {
      try {
        const docs = await LearningEnrollment.find({ studentId }).sort({
          lastAccessedAt: -1,
        });
        return docs.map((d) => d.toSafeObject());
      } catch (err) {
        // Fall back
      }
    }

    const list: LearningEnrollmentData[] = [];
    inMemoryEnrollments.forEach((enr) => {
      if (enr.studentId === studentId) {
        list.push(enr);
      }
    });
    return list.sort((a, b) => b.lastAccessedAt.localeCompare(a.lastAccessedAt));
  }

  /**
   * Get student module progress map for a learning path
   */
  public async getStudentPathProgress(
    studentId: string,
    learningPathId: string
  ): Promise<Record<string, ModuleProgressData>> {
    const isDbConnected = getDbStatus().status === 'connected';
    const progressMap: Record<string, ModuleProgressData> = {};

    if (isDbConnected) {
      try {
        const docs = await ModuleProgress.find({ studentId, learningPathId });
        docs.forEach((d) => {
          progressMap[d.moduleId] = d.toSafeObject();
        });
        return progressMap;
      } catch (err) {
        // Fall back
      }
    }

    inMemoryProgress.forEach((prog) => {
      if (prog.studentId === studentId && prog.learningPathId === learningPathId) {
        progressMap[prog.moduleId] = prog;
      }
    });
    return progressMap;
  }
}
