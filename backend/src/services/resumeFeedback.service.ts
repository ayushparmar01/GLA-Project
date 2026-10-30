import { ResumeStructuredContent, ResumeFeedbackReport, ResumeFeedbackSection } from '../types/index.js';
import { AiService } from './ai/ai.service.js';

export class ResumeFeedbackService {
  /**
   * Generates objective, explainable feedback on an ATS resume without fabricating achievements.
   */
  public static async analyzeResume(
    userId: string,
    content: ResumeStructuredContent,
    targetRole: string = 'Software Engineer',
    resumeId?: string
  ): Promise<ResumeFeedbackReport> {
    const aiService = AiService.getInstance();
    const sections: ResumeFeedbackSection[] = [];
    const keyImprovements: string[] = [];

    // --- Section 1: Contact & Personal Info ---
    const pi = content.personalInfo || { fullName: '', email: '' };
    const hasEmail = Boolean(pi.email && pi.email.includes('@'));
    const hasPhone = Boolean(pi.phoneNumber && pi.phoneNumber.trim().length >= 8);
    const hasLinks = Boolean(pi.githubUrl || pi.linkedinUrl || pi.portfolioUrl);

    let contactScore = 10;
    const contactStrengths: string[] = [];
    const contactWeaknesses: string[] = [];
    const contactSuggestions: string[] = [];

    if (hasEmail && hasPhone) {
      contactStrengths.push('Complete direct contact details (email and phone number).');
    } else {
      contactScore -= 3;
      contactWeaknesses.push('Incomplete primary contact info.');
      contactSuggestions.push('Ensure both a professional email and reachable telephone number are present.');
    }

    if (hasLinks) {
      contactStrengths.push('Professional online links (GitHub / LinkedIn) provided.');
    } else {
      contactScore -= 3;
      contactWeaknesses.push('Missing professional online presence links.');
      contactSuggestions.push('Add active GitHub and LinkedIn profile URLs for recruiter verification.');
    }

    sections.push({
      sectionName: 'Personal & Contact Information',
      score: Math.max(0, contactScore),
      status: contactScore >= 9 ? 'STRONG' : contactScore >= 6 ? 'ADEQUATE' : 'NEEDS_IMPROVEMENT',
      strengths: contactStrengths,
      weaknesses: contactWeaknesses,
      actionableSuggestions: contactSuggestions,
    });

    // --- Section 2: Headline & Career Objective ---
    let headlineScore = 8;
    const headlineStrengths: string[] = [];
    const headlineWeaknesses: string[] = [];
    const headlineSuggestions: string[] = [];

    if (pi.headline && pi.headline.trim().length >= 10) {
      headlineStrengths.push(`Clear professional headline: "${pi.headline}".`);
    } else {
      headlineScore -= 4;
      headlineWeaknesses.push('Generic or missing professional headline.');
      headlineSuggestions.push(`Define a clear technical headline targeting ${targetRole}.`);
      keyImprovements.push(`Set an explicit role headline (e.g. "Junior ${targetRole}").`);
    }

    if (pi.summary && pi.summary.trim().length >= 30) {
      headlineStrengths.push('Concise summary highlighting aspirations and technical scope.');
    } else {
      headlineScore -= 2;
      headlineWeaknesses.push('Brief or missing summary statement.');
      headlineSuggestions.push('Write a 2-3 sentence summary highlighting your primary technical stack.');
    }

    sections.push({
      sectionName: 'Professional Headline & Summary',
      score: Math.max(0, headlineScore),
      status: headlineScore >= 8 ? 'STRONG' : headlineScore >= 5 ? 'ADEQUATE' : 'NEEDS_IMPROVEMENT',
      strengths: headlineStrengths,
      weaknesses: headlineWeaknesses,
      actionableSuggestions: headlineSuggestions,
    });

    // --- Section 3: Technical Skills Presentation ---
    const techSkills = content.technicalSkills || [];
    let skillsScore = 9;
    const skillsStrengths: string[] = [];
    const skillsWeaknesses: string[] = [];
    const skillsSuggestions: string[] = [];

    if (techSkills.length >= 5) {
      skillsStrengths.push(`Strong array of ${techSkills.length} technical skills listed.`);
    } else if (techSkills.length >= 2) {
      skillsScore -= 2;
      skillsWeaknesses.push('Relatively brief list of technical skills.');
      skillsSuggestions.push('Include relevant languages, frameworks, databases, and version control tools.');
    } else {
      skillsScore = 3;
      skillsWeaknesses.push('Critical: Fewer than 2 technical skills listed.');
      skillsSuggestions.push('Add core technical skills required for entry-level recruitment.');
      keyImprovements.push('Expand your technical skills section to match employer keyword filters.');
    }

    sections.push({
      sectionName: 'Technical Skills Presentation',
      score: Math.max(0, skillsScore),
      status: skillsScore >= 8 ? 'STRONG' : skillsScore >= 5 ? 'ADEQUATE' : 'NEEDS_IMPROVEMENT',
      strengths: skillsStrengths,
      weaknesses: skillsWeaknesses,
      actionableSuggestions: skillsSuggestions,
    });

    // --- Section 4: Project Portfolio & Descriptions ---
    const projects = content.projects || [];
    let projectScore = 10;
    const projectStrengths: string[] = [];
    const projectWeaknesses: string[] = [];
    const projectSuggestions: string[] = [];

    if (projects.length >= 2) {
      projectStrengths.push(`${projects.length} real projects documented.`);
    } else if (projects.length === 1) {
      projectScore -= 2;
      projectWeaknesses.push('Only 1 project documented.');
      projectSuggestions.push('Add at least one more project to demonstrate breadth across stack layers.');
    } else {
      projectScore = 2;
      projectWeaknesses.push('Missing project portfolio.');
      projectSuggestions.push('Add 2+ practical technical projects with descriptions and repository links.');
      keyImprovements.push('Add real-world projects with source code repositories to prove competency.');
    }

    const hasProjectLinks = projects.some((p) => p.githubUrl || p.liveDemoUrl);
    if (hasProjectLinks) {
      projectStrengths.push('Repository or deployment links provided for projects.');
    } else if (projects.length > 0) {
      projectScore -= 3;
      projectWeaknesses.push('Projects lack working GitHub repository or live demonstration links.');
      projectSuggestions.push('Include public GitHub links so technical recruiters can inspect your code.');
      keyImprovements.push('Attach public GitHub repository links to your project entries.');
    }

    sections.push({
      sectionName: 'Project Portfolio Evidence',
      score: Math.max(0, projectScore),
      status: projectScore >= 8 ? 'STRONG' : projectScore >= 5 ? 'ADEQUATE' : 'NEEDS_IMPROVEMENT',
      strengths: projectStrengths,
      weaknesses: projectWeaknesses,
      actionableSuggestions: projectSuggestions,
    });

    // --- Section 5: Education & Credentials ---
    const edu = content.education || [];
    let eduScore = 10;
    const eduStrengths: string[] = [];
    const eduWeaknesses: string[] = [];
    const eduSuggestions: string[] = [];

    if (edu.length >= 1 && edu[0].degree && edu[0].institution) {
      eduStrengths.push(`Degree and institution clearly specified (${edu[0].degree} at ${edu[0].institution}).`);
    } else {
      eduScore -= 4;
      eduWeaknesses.push('Education records missing or incomplete.');
      eduSuggestions.push('Specify degree, college name, and expected graduation year.');
    }

    sections.push({
      sectionName: 'Academic Background',
      score: Math.max(0, eduScore),
      status: eduScore >= 8 ? 'STRONG' : 'NEEDS_IMPROVEMENT',
      strengths: eduStrengths,
      weaknesses: eduWeaknesses,
      actionableSuggestions: eduSuggestions,
    });

    // --- Role Relevance & Keyword Matching ---
    const targetKeywords = ['javascript', 'react', 'node', 'typescript', 'sql', 'database', 'git', 'api', 'docker'];
    const resumeText = JSON.stringify(content).toLowerCase();

    const matchingKeywords: string[] = [];
    const missingKeywords: string[] = [];

    for (const kw of targetKeywords) {
      if (resumeText.includes(kw)) {
        matchingKeywords.push(kw.toUpperCase());
      } else {
        missingKeywords.push(kw.toUpperCase());
      }
    }

    const fitScore = Math.round((matchingKeywords.length / targetKeywords.length) * 100);

    // Compute Overall ATS Score
    const totalPossible = sections.reduce((sum, s) => sum + 10, 0);
    const totalEarned = sections.reduce((sum, s) => sum + s.score, 0);
    const overallScore = Math.round((totalEarned / totalPossible) * 100);

    const isFallback = !aiService.isRealProviderConnected();

    return {
      resumeId,
      overallScore,
      summary: `Your ATS Resume scores ${overallScore}/100 for ${targetRole} positions. It exhibits ${
        overallScore >= 80 ? 'strong ATS compliance and clear layout.' : 'good foundations with identifiable areas for improvement.'
      }`,
      isFallback,
      provider: aiService.getActiveProviderName(),
      sections,
      roleRelevance: {
        targetRole,
        fitScore,
        matchingKeywords,
        missingKeywords: missingKeywords.slice(0, 4),
      },
      keyImprovements: keyImprovements.length > 0 ? keyImprovements : ['Maintain current repository links and keep technical skills updated.'],
      disclaimer: 'AI resume feedback is advisory. Review and manually apply suggestions; CareerBridge never mutates your resume without your consent.',
      analyzedAt: new Date().toISOString(),
    };
  }
}
