import { AiService } from '../ai/ai.service.js';
import { User } from '../../models/user.model.js';

export class WhatsAppAiAssistantService {
  /**
   * Generates conversational career assistance formatted specifically for WhatsApp messaging.
   */
  static async answerCareerQuery(params: {
    question: string;
    phoneNumber: string;
    userId?: string;
  }): Promise<string> {
    const { question, userId } = params;
    const aiService = AiService.getInstance();

    // 1. Sanitize input prompt to prevent prompt injection attacks
    const sanitizedQuestion = aiService.sanitizePrompt(question, 800);

    // 2. Fetch authenticated student profile context if linked
    let profileContext = '';
    if (userId) {
      try {
        const student = await User.findById(userId);
        if (student && student.studentProfile) {
          const sp = student.studentProfile;
          profileContext = `Student Profile: ${student.fullName}, Course: ${sp.course || 'Engineering/Diploma'}, Graduation: ${sp.graduationYear || '2025'}, Skills: ${(sp.skills || []).join(', ') || 'General'}`;
        }
      } catch {
        // Fallback gracefully without context
      }
    }

    const systemPrompt = `You are the CareerBridge WhatsApp AI Career Assistant for college students in Tier-2/3 polytechnics and engineering institutes across India.
Your mission is empowering students who have no placement cell with practical, encouraging, and honest advice.
Constraints:
- Keep responses concise, structured, and easy to read on WhatsApp (under 750 characters).
- Use WhatsApp formatting: *bold* for emphasis and bullet points (- ).
- Never fabricate job openings, guaranteed packages, or unverified claims.
${profileContext ? `Context: ${profileContext}` : ''}`;

    try {
      const response = await aiService.generateText({
        systemPrompt,
        userPrompt: sanitizedQuestion,
        temperature: 0.4,
        maxTokens: 350,
      });

      let reply = response.text.trim();

      // If response was generated via deterministic fallback, prepend clear transparency label
      if (response.isFallback) {
        reply = `💡 *Career Guidance (CareerBridge Knowledge Base)*\n\n${reply}\n\n_Note: For live personalized AI career coaching, access your CareerBridge web portal._`;
      }

      return reply;
    } catch {
      return (
        `💡 *CareerBridge Assistant FAQ*\n\n` +
        `- *Job Search:* Type *JOBS* to see active campus recruitment drives.\n` +
        `- *Applications:* Type *APPLICATIONS* to inspect your submission updates.\n` +
        `- *Interviews:* Type *INTERVIEWS* to check your scheduled interview rounds.\n` +
        `- *Skill Tests:* Type *SKILLS* to explore standardized assessments.\n\n` +
        `_Tip: Log in to the CareerBridge web portal for interactive mock interviews and full learning roadmaps!_`
      );
    }
  }
}
