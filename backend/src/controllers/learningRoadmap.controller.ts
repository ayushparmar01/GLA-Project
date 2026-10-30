import { Request, Response } from 'express';
import { LearningRoadmap } from '../models/learningRoadmap.model.js';
import { User } from '../models/user.model.js';
import { RoadmapGeneratorService } from '../services/roadmapGenerator.service.js';

export async function createRoadmap(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.sub;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { targetRole } = req.body;
    const user = await User.findById(studentId);
    if (!user) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    const roadmapData = await RoadmapGeneratorService.generateRoadmap(
      user,
      targetRole || 'Full-Stack Software Engineer'
    );

    const roadmap = new LearningRoadmap({
      ...roadmapData,
      studentId,
    });

    await roadmap.save();

    res.status(201).json({
      success: true,
      message: 'Personalized learning roadmap generated successfully',
      data: roadmap.toSafeObject(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create learning roadmap',
      error: error.message,
    });
  }
}

export async function listRoadmaps(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.sub;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const roadmaps = await LearningRoadmap.find({ studentId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: roadmaps.map((r) => r.toSafeObject()),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve learning roadmaps',
      error: error.message,
    });
  }
}

export async function getRoadmapById(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.sub;
    const { id } = req.params;

    const roadmap = await LearningRoadmap.findOne({ _id: id, studentId });
    if (!roadmap) {
      res.status(404).json({ success: false, message: 'Learning roadmap not found or access denied' });
      return;
    }

    res.status(200).json({
      success: true,
      data: roadmap.toSafeObject(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve learning roadmap',
      error: error.message,
    });
  }
}

export async function updateRoadmapMilestone(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.sub;
    const { id } = req.params;
    const { milestoneId, completed } = req.body;

    if (!milestoneId) {
      res.status(400).json({ success: false, message: 'Milestone ID is required' });
      return;
    }

    const roadmap = await LearningRoadmap.findOne({ _id: id, studentId });
    if (!roadmap) {
      res.status(404).json({ success: false, message: 'Learning roadmap not found or access denied' });
      return;
    }

    const milestone = roadmap.milestones.find((m) => m.id === milestoneId);
    if (!milestone) {
      res.status(404).json({ success: false, message: 'Milestone not found in roadmap' });
      return;
    }

    milestone.completed = Boolean(completed);
    milestone.completedAt = completed ? new Date() : undefined;

    // Recalculate progress percentage
    const total = roadmap.milestones.length;
    const completedCount = roadmap.milestones.filter((m) => m.completed).length;
    roadmap.progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    if (roadmap.progress === 100) {
      roadmap.status = 'COMPLETED';
    } else if (roadmap.status === 'COMPLETED' && roadmap.progress < 100) {
      roadmap.status = 'ACTIVE';
    }

    await roadmap.save();

    res.status(200).json({
      success: true,
      message: `Milestone updated (${roadmap.progress}% completed)`,
      data: roadmap.toSafeObject(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update roadmap milestone',
      error: error.message,
    });
  }
}

export async function updateRoadmapStatus(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.sub;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['ACTIVE', 'COMPLETED', 'PAUSED', 'ARCHIVED'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
      return;
    }

    const roadmap = await LearningRoadmap.findOne({ _id: id, studentId });
    if (!roadmap) {
      res.status(404).json({ success: false, message: 'Learning roadmap not found or access denied' });
      return;
    }

    roadmap.status = status;
    await roadmap.save();

    res.status(200).json({
      success: true,
      message: `Roadmap status changed to ${status}`,
      data: roadmap.toSafeObject(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update roadmap status',
      error: error.message,
    });
  }
}

export async function deleteRoadmap(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.sub;
    const { id } = req.params;

    const roadmap = await LearningRoadmap.findOneAndDelete({ _id: id, studentId });
    if (!roadmap) {
      res.status(404).json({ success: false, message: 'Learning roadmap not found or access denied' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Learning roadmap deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete learning roadmap',
      error: error.message,
    });
  }
}
