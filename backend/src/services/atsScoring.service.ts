import {
  ExtractedStructuredResume,
  AtsScoreBreakdown,
  AtsScoreTier,
  AtsKeywordAnalysis,
  AtsSkillGapItem,
  AtsResumeQualityReport,
} from '../types/index.js';

export interface JobRequirementsInput {
  title: string;
  organizationName?: string;
  description: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  eligibleCourses?: string[];
  minExperienceYears?: number;
}

export class AtsScoringService {
  public static readonly DEFAULT_WEIGHTS = {
    requiredSkills: 30,
    jobKeywords: 20,
    projectsExperience: 15,
    education: 10,
    structure: 10,
    achievementsCertifications: 10,
    formatting: 5,
  };

  /**
   * Deterministically calculates explainable ATS compatibility score and analyses.
   */
  public static calculateAtsScore(
    resume: ExtractedStructuredResume,
    job: JobRequirementsInput
  ): {
    atsScore: number;
    scoreTier: AtsScoreTier;
    scoreBreakdown: AtsScoreBreakdown;
    dataCoveragePercentage: number;
    reasons: string[];
    keywordAnalysis: AtsKeywordAnalysis;
    skillGapAnalysis: AtsSkillGapItem[];
    qualityReport: AtsResumeQualityReport;
  } {
    const weights = this.DEFAULT_WEIGHTS;

    // 1. Keyword Comparison Engine
    const keywordAnalysis = this.performKeywordAnalysis(resume, job);

    // 2. Skill Gap Analysis
    const skillGapAnalysis = this.performSkillGapAnalysis(resume, job, keywordAnalysis);

    // 3. Resume Quality Analysis
    const qualityReport = this.evaluateResumeQuality(resume);

    // 4. Calculate Individual Component Scores
    // A. Required Skill Coverage (30 pts)
    const requiredTotal = job.requiredSkills.length;
    let requiredMatched = 0;
    const resumeTechLower = resume.technicalSkills.map((s) => s.toLowerCase());

    for (const reqSkill of job.requiredSkills) {
      const lower = reqSkill.toLowerCase();
      if (
        resumeTechLower.some(
          (r) => r === lower || r.includes(lower) || lower.includes(r)
        )
      ) {
        requiredMatched++;
      }
    }
    const requiredSkillCoverage =
      requiredTotal > 0
        ? Math.round((requiredMatched / requiredTotal) * weights.requiredSkills)
        : weights.requiredSkills; // If no specific skills listed, default full credit

    // B. Job Keyword Alignment (20 pts)
    const totalJobKeywords =
      keywordAnalysis.matchedKeywords.length + keywordAnalysis.missingKeywords.length;
    const jobKeywordAlignment =
      totalJobKeywords > 0
        ? Math.round(
            (keywordAnalysis.matchedKeywords.length / totalJobKeywords) *
              weights.jobKeywords
          )
        : Math.round(weights.jobKeywords * 0.7);

    // C. Project / Experience Alignment (15 pts)
    let projectExpScore = 0;
    const hasProjects = resume.projects && resume.projects.length > 0;
    const hasExperience = resume.workExperience && resume.workExperience.length > 0;

    if (hasProjects) {
      projectExpScore += 8;
      const projectBullets = resume.projects.flatMap((p) => p.bullets || []);
      if (projectBullets.length >= 2) projectExpScore += 2;
    }
    if (hasExperience) {
      projectExpScore += 5;
    } else if (hasProjects && resume.projects.length >= 2) {
      // Fresher credit: 2+ substantive projects compensate for corporate experience
      projectExpScore += 5;
    }
    const projectExperienceAlignment = Math.min(weights.projectsExperience, projectExpScore);

    // D. Education & Qualification Alignment (10 pts)
    let educationScore = 0;
    if (resume.education && resume.education.length > 0) {
      educationScore += 7;
      if (resume.education.some((e) => e.degree && e.degree.length > 2)) {
        educationScore += 3;
      }
    }
    const educationAlignment = Math.min(weights.education, educationScore);

    // E. Resume Structure & Section Completeness (10 pts)
    let structureScore = 0;
    if (resume.contact && resume.contact.email) structureScore += 2;
    if (resume.contact && resume.contact.phone) structureScore += 2;
    if (resume.education && resume.education.length > 0) structureScore += 2;
    if (resume.technicalSkills && resume.technicalSkills.length > 0) structureScore += 2;
    if (hasProjects || hasExperience) structureScore += 2;
    const structureCompleteness = Math.min(weights.structure, structureScore);

    // F. Relevant Achievements & Certifications (10 pts)
    let achCertScore = 0;
    if (resume.certifications && resume.certifications.length > 0) achCertScore += 5;
    if (resume.achievements && resume.achievements.length > 0) achCertScore += 5;
    if (achCertScore === 0 && (resume.technicalSkills.length >= 8 || resume.projects.length >= 3)) {
      // Compensate for strong project portfolio
      achCertScore += 4;
    }
    const achievementsCertifications = Math.min(weights.achievementsCertifications, achCertScore);

    // G. Readability & Formatting Checks (5 pts)
    const formattingChecks = Math.min(
      weights.formatting,
      Math.max(1, Math.round((qualityReport.overallQualityScore / 100) * weights.formatting))
    );

    // Total Score (0-100)
    const atsScore = Math.min(
      100,
      Math.max(
        0,
        requiredSkillCoverage +
          jobKeywordAlignment +
          projectExperienceAlignment +
          educationAlignment +
          structureCompleteness +
          achievementsCertifications +
          formattingChecks
      )
    );

    // Determine Score Tier
    let scoreTier: AtsScoreTier = 'NEEDS_IMPROVEMENT';
    if (atsScore >= 85) {
      scoreTier = 'STRONG_ALIGNMENT';
    } else if (atsScore >= 70) {
      scoreTier = 'GOOD_ALIGNMENT';
    } else if (atsScore >= 50) {
      scoreTier = 'MODERATE_ALIGNMENT';
    }

    // Data Coverage Percentage
    let sectionsFound = 0;
    const totalTrackedSections = 6;
    if (resume.contact?.email || resume.contact?.phone) sectionsFound++;
    if (resume.education.length > 0) sectionsFound++;
    if (resume.technicalSkills.length > 0) sectionsFound++;
    if (resume.projects.length > 0) sectionsFound++;
    if (resume.workExperience.length > 0) sectionsFound++;
    if (resume.certifications.length > 0 || resume.achievements.length > 0) sectionsFound++;
    const dataCoveragePercentage = Math.round((sectionsFound / totalTrackedSections) * 100);

    // Explainable Reasons
    const reasons: string[] = [];
    if (requiredSkillCoverage >= 24) {
      reasons.push(`Strong required skill coverage (${requiredMatched}/${requiredTotal} target skills identified)`);
    } else {
      reasons.push(`Missing ${requiredTotal - requiredMatched} core required skills for this position`);
    }
    if (keywordAnalysis.matchedKeywords.length > 0) {
      reasons.push(`Aligned on ${keywordAnalysis.matchedKeywords.length} key domain terms from the job description`);
    }
    if (hasProjects) {
      reasons.push(`Practical project experience demonstrates hands-on technical application`);
    }
    if (!hasExperience && qualityReport.fresherFriendly) {
      reasons.push(`Fresher profile evaluated with academic project weighting; no penalty for lack of corporate tenure`);
    }
    if (qualityReport.warnings.length > 0) {
      reasons.push(qualityReport.warnings[0]);
    }

    const scoreBreakdown: AtsScoreBreakdown = {
      requiredSkillCoverage,
      jobKeywordAlignment,
      projectExperienceAlignment,
      educationAlignment,
      structureCompleteness,
      achievementsCertifications,
      formattingChecks,
      weights,
    };

    return {
      atsScore,
      scoreTier,
      scoreBreakdown,
      dataCoveragePercentage,
      reasons,
      keywordAnalysis,
      skillGapAnalysis,
      qualityReport,
    };
  }

  /**
   * Compares resume terms and keywords against job requirements.
   */
  public static performKeywordAnalysis(
    resume: ExtractedStructuredResume,
    job: JobRequirementsInput
  ): AtsKeywordAnalysis {
    // Extract keywords from job title and description
    const jobKeywordsSet = new Set<string>();
    for (const skill of job.requiredSkills) jobKeywordsSet.add(skill.trim());
    if (job.preferredSkills) {
      for (const skill of job.preferredSkills) jobKeywordsSet.add(skill.trim());
    }

    // Tokenize important keywords from description
    const descTokens = job.description
      .replace(/[^\w\s+#.-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !this.isStopWord(w.toLowerCase()));

    const candidateDomainKeywords = [
      'REST APIs', 'Microservices', 'Git', 'Agile', 'Docker', 'Kubernetes', 'CI/CD',
      'SQL', 'NoSQL', 'Unit Testing', 'TypeScript', 'Responsive Design', 'Scalability',
      'Data Structures', 'Debugging', 'Optimization', 'Security', 'Authentication',
    ];

    for (const c of candidateDomainKeywords) {
      if (job.description.toLowerCase().includes(c.toLowerCase())) {
        jobKeywordsSet.add(c);
      }
    }

    const resumeAllText = [
      ...resume.technicalSkills,
      ...resume.softSkills,
      ...resume.projects.flatMap((p) => [p.title, ...(p.bullets || []), ...(p.technologies || [])]),
      ...resume.workExperience.flatMap((e) => [e.role, ...(e.bullets || [])]),
      resume.contact.summary || '',
    ]
      .join(' ')
      .toLowerCase();

    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];
    const partiallyMatchedKeywords: Array<{ keyword: string; resumeTerm: string }> = [];

    // Partial match aliases
    const aliases: Record<string, string[]> = {
      react: ['react.js', 'reactjs', 'frontend react'],
      node: ['node.js', 'nodejs', 'backend node'],
      'rest apis': ['restful', 'rest api', 'api development', 'apis'],
      postgres: ['postgresql', 'psql'],
      mongo: ['mongodb'],
      aws: ['amazon web services', 'cloud aws', 's3', 'ec2'],
      docker: ['containerization', 'containers'],
      ts: ['typescript'],
      js: ['javascript'],
    };

    for (const kw of jobKeywordsSet) {
      const lowerKw = kw.toLowerCase();
      if (resumeAllText.includes(lowerKw)) {
        matchedKeywords.push(kw);
      } else {
        // Check partial alias match
        let foundPartial = false;
        const aliasList = aliases[lowerKw] || [];
        for (const alias of aliasList) {
          if (resumeAllText.includes(alias)) {
            partiallyMatchedKeywords.push({ keyword: kw, resumeTerm: alias });
            foundPartial = true;
            break;
          }
        }
        if (!foundPartial) {
          missingKeywords.push(kw);
        }
      }
    }

    // Additional resume keywords (skills in resume not strictly mentioned in job)
    const jobKeywordsLower = Array.from(jobKeywordsSet).map((k) => k.toLowerCase());
    const additionalResumeKeywords = resume.technicalSkills.filter(
      (s) => !jobKeywordsLower.includes(s.toLowerCase())
    );

    return {
      matchedKeywords,
      missingKeywords,
      partiallyMatchedKeywords,
      additionalResumeKeywords,
    };
  }

  /**
   * Generates prioritized skill gaps with verified curated free learning links.
   */
  public static performSkillGapAnalysis(
    resume: ExtractedStructuredResume,
    job: JobRequirementsInput,
    keywordAnalysis: AtsKeywordAnalysis
  ): AtsSkillGapItem[] {
    const gaps: AtsSkillGapItem[] = [];
    const requiredLower = job.requiredSkills.map((s) => s.toLowerCase());
    const preferredLower = (job.preferredSkills || []).map((s) => s.toLowerCase());

    const sampleResources: Record<string, { title: string; provider: string; url: string }> = {
      react: {
        title: 'React Official Documentation & Interactive Guide',
        provider: 'React.dev',
        url: 'https://react.dev/learn',
      },
      'node.js': {
        title: 'Node.js Developer Guides',
        provider: 'OpenJS Foundation',
        url: 'https://nodejs.org/en/learn',
      },
      typescript: {
        title: 'TypeScript for JavaScript Programmers',
        provider: 'TypeScript Official',
        url: 'https://www.typescriptlang.org/docs/',
      },
      mongodb: {
        title: 'MongoDB Basics University Course',
        provider: 'MongoDB University',
        url: 'https://learn.mongodb.com/',
      },
      sql: {
        title: 'SQL & Relational Database Design',
        provider: 'Khan Academy / W3Schools',
        url: 'https://www.khanacademy.org/computing/computer-programming/sql',
      },
      docker: {
        title: 'Docker Getting Started Guide',
        provider: 'Docker Docs',
        url: 'https://docs.docker.com/get-started/',
      },
      git: {
        title: 'Pro Git Book (Free)',
        provider: 'Git-SCM',
        url: 'https://git-scm.com/book/en/v2',
      },
      'rest apis': {
        title: 'RESTful API Architectural Guidelines',
        provider: 'Mozilla Developer Network (MDN)',
        url: 'https://developer.mozilla.org/en-US/docs/Glossary/REST',
      },
      'data structures': {
        title: 'Algorithms & Data Structures Curriculum',
        provider: 'freeCodeCamp',
        url: 'https://www.freecodecamp.org/learn',
      },
    };

    // Missing required skills => HIGH priority
    for (const missing of keywordAnalysis.missingKeywords) {
      const lower = missing.toLowerCase();
      const isReq = requiredLower.includes(lower);
      const isPref = preferredLower.includes(lower);
      const priority = isReq ? 'HIGH' : isPref ? 'MEDIUM' : 'LOW';

      // Look up resource
      const resourceEntry = sampleResources[lower] || {
        title: `${missing} Developer Reference & Practice`,
        provider: 'Developer Documentation',
        url: 'https://developer.mozilla.org',
      };

      gaps.push({
        skill: missing,
        priority,
        status: 'MISSING',
        category: isReq ? 'Mandatory Requirement' : 'Preferred Competency',
        learningResources: [
          {
            title: resourceEntry.title,
            topic: missing,
            provider: resourceEntry.provider,
            url: resourceEntry.url,
          },
        ],
      });
    }

    // Partially matched skills => MEDIUM priority
    for (const partial of keywordAnalysis.partiallyMatchedKeywords) {
      gaps.push({
        skill: partial.keyword,
        priority: 'MEDIUM',
        status: 'PARTIAL',
        category: 'Wording Alignment',
        learningResources: [
          {
            title: `Align ${partial.resumeTerm} with industry standard ${partial.keyword}`,
            topic: partial.keyword,
            provider: 'CareerBridge Knowledge Base',
            url: 'https://developer.mozilla.org',
          },
        ],
      });
    }

    // Sort: HIGH first, then MEDIUM, then LOW
    const order: Record<string, number> = { HIGH: 1, MEDIUM: 2, LOW: 3 };
    gaps.sort((a, b) => order[a.priority] - order[b.priority]);

    return gaps;
  }

  /**
   * Performs deterministic quality and formatting checks.
   */
  public static evaluateResumeQuality(resume: ExtractedStructuredResume): AtsResumeQualityReport {
    const warnings: string[] = [];

    // 1. Contact Completeness
    const hasEmail = Boolean(resume.contact?.email);
    const hasPhone = Boolean(resume.contact?.phone);
    const hasName = Boolean(resume.contact?.fullName);
    const hasLinks = Boolean(resume.contact?.githubUrl || resume.contact?.linkedinUrl);

    const contactStatus =
      hasEmail && hasPhone && hasName ? 'PASS' : hasEmail || hasPhone ? 'WARNING' : 'NEEDS_ATTENTION';
    if (!hasEmail) warnings.push('No valid email address detected on resume.');
    if (!hasPhone) warnings.push('No telephone contact number detected.');

    // 2. Structure Completeness
    const hasEdu = resume.education.length > 0;
    const hasSkills = resume.technicalSkills.length > 0;
    const hasProjects = resume.projects.length > 0;
    const hasExp = resume.workExperience.length > 0;

    const structureStatus =
      hasEdu && hasSkills && (hasProjects || hasExp)
        ? 'PASS'
        : hasEdu && hasSkills
        ? 'WARNING'
        : 'NEEDS_ATTENTION';
    if (!hasEdu) warnings.push('Education section not clearly identified.');
    if (!hasSkills) warnings.push('Technical skills section not formatted with standard keywords.');

    // 3. Project Quality
    let projectBulletsCount = 0;
    for (const p of resume.projects) {
      projectBulletsCount += p.bullets ? p.bullets.length : 0;
    }
    const projectStatus =
      hasProjects && projectBulletsCount >= 3
        ? 'PASS'
        : hasProjects
        ? 'WARNING'
        : 'NEEDS_ATTENTION';
    if (hasProjects && projectBulletsCount < 2) {
      warnings.push('Projects lack detailed bullet points describing your personal technical contributions.');
    }

    // 4. Experience Quality (Fresher-friendly)
    const fresherFriendly = !hasExp && hasProjects;
    const expStatus = hasExp
      ? 'PASS'
      : fresherFriendly
      ? 'PASS' // Fresher credit: Not penalized
      : 'WARNING';

    // 5. Formatting Checks
    let formattingStatus: 'PASS' | 'WARNING' | 'NEEDS_ATTENTION' = 'PASS';
    if (resume.rawTextLength < 200) {
      formattingStatus = 'NEEDS_ATTENTION';
      warnings.push('Resume document text is unusually short; ensure selectable text was extracted properly.');
    } else if (resume.rawTextLength > 15000) {
      formattingStatus = 'WARNING';
      warnings.push('Resume document exceeds standard length; consider condensing to 1-2 pages.');
    }

    // Overall Quality Score (0-100)
    let qualityPoints = 0;
    if (contactStatus === 'PASS') qualityPoints += 20;
    else if (contactStatus === 'WARNING') qualityPoints += 10;

    if (structureStatus === 'PASS') qualityPoints += 25;
    else if (structureStatus === 'WARNING') qualityPoints += 15;

    if (projectStatus === 'PASS') qualityPoints += 25;
    else if (projectStatus === 'WARNING') qualityPoints += 15;

    if (expStatus === 'PASS') qualityPoints += 15;
    else qualityPoints += 8;

    if (formattingStatus === 'PASS') qualityPoints += 15;
    else if (formattingStatus === 'WARNING') qualityPoints += 8;

    return {
      contactCompleteness: {
        name: 'Contact Information',
        present: hasEmail && hasPhone,
        status: contactStatus,
        notes: hasEmail && hasPhone ? 'Email and phone verified.' : 'Missing essential contact fields.',
      },
      structureCompleteness: {
        name: 'Section Structure',
        present: hasEdu && hasSkills,
        status: structureStatus,
        notes: hasEdu && hasSkills ? 'Essential sections detected.' : 'Some standard sections missing.',
      },
      projectQuality: {
        name: 'Project Details',
        present: hasProjects,
        status: projectStatus,
        notes:
          projectBulletsCount >= 3
            ? `${resume.projects.length} projects with ${projectBulletsCount} descriptive bullet points.`
            : 'Add action-oriented bullet points to projects.',
      },
      experienceQuality: {
        name: 'Work / Internship Experience',
        present: hasExp || fresherFriendly,
        status: expStatus,
        notes: hasExp
          ? 'Professional experience listed.'
          : fresherFriendly
          ? 'Fresher profile: Academic projects evaluated in lieu of corporate tenure.'
          : 'Consider adding internships or academic capstone work.',
      },
      formattingChecks: {
        name: 'Formatting & Readability',
        present: formattingStatus !== 'NEEDS_ATTENTION',
        status: formattingStatus,
        notes:
          formattingStatus === 'PASS'
            ? 'Clean layout with readable text extraction.'
            : 'Review length and layout density.',
      },
      fresherFriendly,
      overallQualityScore: Math.min(100, qualityPoints),
      warnings,
    };
  }

  private static isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'will', 'your', 'about',
      'candidate', 'requirements', 'responsibilities', 'experience', 'knowledge', 'ability',
      'working', 'strong', 'skills', 'role', 'team', 'company', 'work', 'join', 'must',
    ]);
    return stopWords.has(word);
  }
}
