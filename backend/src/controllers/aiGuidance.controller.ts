import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AiConversation } from '../models/aiConversation.model.js';
import { User } from '../models/user.model.js';
import { Resume } from '../models/resume.model.js';
import { AiService } from '../services/ai/ai.service.js';
import { ResumeFeedbackService } from '../services/resumeFeedback.service.js';
import {
  InterviewPrepService,
  CURATED_INTERVIEW_QUESTIONS,
} from '../services/interviewPrep.service.js';
import { ResumeStructuredContent } from '../types/index.js';

export async function postCareerGuidance(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.sub;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { message, conversationId, contextSnapshot, language } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ success: false, message: 'Valid message text is required' });
      return;
    }

    const aiService = AiService.getInstance();
    const sanitizedMsg = aiService.sanitizePrompt(message);

    // Fetch student profile to enrich context
    const student = await User.findById(studentId).lean();
    const sp = student?.studentProfile || {};

    const preferredLang =
      language && typeof language === 'string' && ['en', 'hi', 'hi-Latn'].includes(language)
        ? language
        : student?.preferredLanguage || 'en';

    let conversation;
    if (conversationId) {
      conversation = await AiConversation.findOne({
        _id: conversationId,
        studentId,
      });
      if (!conversation) {
        res.status(404).json({ success: false, message: 'Conversation not found or access denied' });
        return;
      }
    } else {
      const title = sanitizedMsg.slice(0, 40) + (sanitizedMsg.length > 40 ? '...' : '');
      conversation = new AiConversation({
        studentId,
        title,
        messages: [],
        contextSnapshot: {
          targetRole:
            contextSnapshot?.targetRole ||
            sp.preferredJobRoles?.[0] ||
            (sp as any).preferredRoles?.[0] ||
            'Software Engineer',
          headline: sp.headline || '',
          course: sp.course || '',
          verifiedSkills: sp.technicalSkills || sp.skills || [],
          readinessScore: undefined,
        },
      });
    }

    // Add user message
    const userMsgId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    conversation.messages.push({
      id: userMsgId,
      role: 'user',
      content: sanitizedMsg,
      timestamp: new Date(),
    });

    // Build system guidance prompt with student profile context
    const profileContext = `Student Context:
- Target Role: ${conversation.contextSnapshot?.targetRole || 'Software Engineer'}
- Current Course: ${conversation.contextSnapshot?.course || 'Engineering'}
- Skills: ${(conversation.contextSnapshot?.verifiedSkills || []).join(', ') || 'General'}`;

    const langInstruction =
      preferredLang === 'hi'
        ? 'Please answer in clear, professional Hindi (Devanagari script), keeping core technical terms (DSA, API, SQL, React, etc.) in standard English.'
        : preferredLang === 'hi-Latn'
        ? 'Please answer in natural colloquial Hinglish (Roman script Hindi), keeping technical terms in standard English.'
        : 'Please answer in English.';

    const aiResponse = await aiService.generateGuidance(studentId, sanitizedMsg, {
      systemPrompt: `You are CareerBridge AI Career Advisor for Indian engineering/diploma students from colleges without on-campus placement cells. Offer practical, honest, encouraging, and actionable placement advice. ${profileContext} ${langInstruction}`,
      language: preferredLang,
      studentContext: {
        targetRole: conversation.contextSnapshot?.targetRole,
        verifiedSkills: conversation.contextSnapshot?.verifiedSkills,
        course: conversation.contextSnapshot?.course,
        language: preferredLang,
      },
    });

    // Add assistant message
    const assistantMsgId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    conversation.messages.push({
      id: assistantMsgId,
      role: 'assistant',
      content: aiResponse.content,
      isFallback: aiResponse.isFallback,
      provider: aiResponse.provider,
      fallbackReason: aiResponse.fallbackReason,
      timestamp: new Date(),
    });

    await conversation.save();

    res.status(200).json({
      success: true,
      data: conversation.toSafeObject(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to process career guidance request',
      error: error.message,
    });
  }
}

export async function getConversations(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.sub;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const conversations = await AiConversation.find({ studentId })
      .sort({ updatedAt: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      data: conversations.map((c) => c.toSafeObject()),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversations',
      error: error.message,
    });
  }
}

export async function getConversationById(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.sub;
    const { id } = req.params;

    const conversation = await AiConversation.findOne({ _id: id, studentId });
    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found or access denied' });
      return;
    }

    res.status(200).json({
      success: true,
      data: conversation.toSafeObject(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversation',
      error: error.message,
    });
  }
}

export async function postResumeFeedback(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.sub;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { resumeId, targetRole, structuredContent } = req.body;
    let contentToAnalyze: ResumeStructuredContent | null = structuredContent || null;

    if (!contentToAnalyze && resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, studentId }).lean();
      if (!resume) {
        res.status(404).json({ success: false, message: 'Resume not found or access denied' });
        return;
      }
      contentToAnalyze = resume.structuredContent;
    }

    if (!contentToAnalyze) {
      // Build from student user profile
      const user = await User.findById(studentId).lean();
      const sp = user?.studentProfile || {};
      contentToAnalyze = {
        personalInfo: {
          fullName: user?.fullName || (user as any)?.name || '',
          email: user?.email || '',
          phoneNumber: user?.phoneNumber || (user as any)?.phone || '',
          headline: sp.headline || '',
          githubUrl: sp.githubUrl || '',
          linkedinUrl: sp.linkedinUrl || '',
          portfolioUrl: sp.portfolioUrl || '',
        },
        education: sp.educationHistory || (sp as any).education || [],
        technicalSkills: sp.technicalSkills || sp.skills || [],
        softSkills: sp.softSkills || [],
        projects: sp.projects || [],
        experience: sp.workExperience || sp.internships || (sp as any).experience || [],
        certifications: sp.certifications || [],
        customSections: [],
      };
    }

    const report = await ResumeFeedbackService.analyzeResume(
      studentId,
      contentToAnalyze,
      targetRole || 'Software Engineer',
      resumeId
    );

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to analyze resume',
      error: error.message,
    });
  }
}

export async function getInterviewQuestions(req: Request, res: Response): Promise<void> {
  try {
    const { role, category } = req.query;
    let questions = [...CURATED_INTERVIEW_QUESTIONS];

    if (category && typeof category === 'string') {
      questions = questions.filter(
        (q) => q.category.toUpperCase() === category.toUpperCase()
      );
    }

    if (role && typeof role === 'string') {
      const searchRole = role.toLowerCase();
      questions = questions.filter(
        (q) => q.role.toLowerCase().includes(searchRole) || searchRole.includes(q.role.toLowerCase())
      );
    }

    res.status(200).json({
      success: true,
      data: questions,
      disclaimer: 'CareerBridge interview preparation questions are for mock practice and self-reflection. Feedback is advisory.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve interview questions',
      error: error.message,
    });
  }
}

export async function evaluateInterviewAnswer(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.sub;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { questionId, studentAnswer } = req.body;
    if (!questionId || typeof questionId !== 'string') {
      res.status(400).json({ success: false, message: 'Question ID is required' });
      return;
    }

    if (!studentAnswer || typeof studentAnswer !== 'string' || !studentAnswer.trim()) {
      res.status(400).json({ success: false, message: 'Valid student answer is required' });
      return;
    }

    const evaluation = await InterviewPrepService.evaluateAnswer(
      studentId,
      questionId,
      studentAnswer
    );

    res.status(200).json({
      success: true,
      data: evaluation,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate interview answer',
      error: error.message,
    });
  }
}
