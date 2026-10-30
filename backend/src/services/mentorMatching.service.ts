import {
  MentorProfileData,
  StudentMentorshipProfileData,
  StudentProfileData,
  MentorMatchCategory,
  MentorMatchFactors,
  MentorRecommendationData,
} from '../types/index.js';

export class MentorMatchingService {
  /**
   * Evaluates the 6-factor compatibility between a student and a mentor.
   * Total possible score = 100.
   *
   * Factors:
   * 1. Expertise & Skill Alignment (30%)
   * 2. Career Goal Alignment (20%)
   * 3. Industry Alignment (15%)
   * 4. Mentorship Topic Alignment (15%)
   * 5. Language Compatibility (10%)
   * 6. Availability Compatibility (10%)
   */
  public static calculateMatch(
    mentor: MentorProfileData,
    studentMentorshipProfile?: Partial<StudentMentorshipProfileData> | null,
    studentProfile?: Partial<StudentProfileData> | null
  ): MentorRecommendationData {
    const positiveMatchReasons: string[] = [];
    const potentialGaps: string[] = [];

    // Normalize student inputs
    const studentSkills = [
      ...(studentProfile?.skills || []),
      ...(studentProfile?.technicalSkills || []),
    ].map((s) => s.toLowerCase().trim());

    const studentGoals = [
      ...(studentMentorshipProfile?.careerGoals || []),
      ...(studentProfile?.careerInterests || []),
      ...(studentProfile?.preferredJobRoles || []),
    ].map((g) => g.toLowerCase().trim());

    const studentIndustries = (studentMentorshipProfile?.preferredIndustries || []).map((i) =>
      i.toLowerCase().trim()
    );

    const studentTopics = (studentMentorshipProfile?.preferredTopics || []).map((t) =>
      t.toLowerCase().trim()
    );

    const studentLanguages = (studentMentorshipProfile?.preferredLanguages || ['English']).map((l) =>
      l.toLowerCase().trim()
    );

    // Normalize mentor inputs
    const mentorExpertise = (mentor.expertise || []).map((e) => e.toLowerCase().trim());
    const mentorIndustry = (mentor.industry || '').toLowerCase().trim();
    const mentorDesignation = (mentor.designation || '').toLowerCase().trim();
    const mentorTopics = (mentor.mentorshipTopics || []).map((t) => t.toLowerCase().trim());
    const mentorLanguages = (mentor.languages || ['English']).map((l) => l.toLowerCase().trim());

    // 1. Expertise & Skill Alignment (Weight: 30%)
    let expertiseScore = 0;
    const matchingSkills: string[] = [];
    if (studentSkills.length > 0 && mentorExpertise.length > 0) {
      for (const skill of studentSkills) {
        if (mentorExpertise.some((exp) => exp.includes(skill) || skill.includes(exp))) {
          matchingSkills.push(skill);
        }
      }
      // Unique matching skills
      const uniqueMatches = Array.from(new Set(matchingSkills));
      if (uniqueMatches.length >= 4) {
        expertiseScore = 30;
      } else if (uniqueMatches.length === 3) {
        expertiseScore = 24;
      } else if (uniqueMatches.length === 2) {
        expertiseScore = 18;
      } else if (uniqueMatches.length === 1) {
        expertiseScore = 12;
      } else {
        expertiseScore = 6;
      }

      if (uniqueMatches.length > 0) {
        positiveMatchReasons.push(
          `Matches ${uniqueMatches.length} of your key technical skills (${uniqueMatches.slice(0, 3).join(', ')})`
        );
      } else {
        potentialGaps.push('Limited direct overlap with your current technical skills');
      }
    } else {
      expertiseScore = 15; // Moderate baseline if skills are not fully populated
    }

    // 2. Career Goal Alignment (Weight: 20%)
    let goalScore = 0;
    let goalMatched = false;
    if (studentGoals.length > 0) {
      for (const goal of studentGoals) {
        if (
          mentorDesignation.includes(goal) ||
          goal.includes(mentorDesignation) ||
          mentorExpertise.some((e) => e.includes(goal) || goal.includes(e))
        ) {
          goalMatched = true;
          break;
        }
      }
      if (goalMatched) {
        goalScore = 20;
        positiveMatchReasons.push(`Strong alignment with your career ambition towards ${mentor.designation}`);
      } else {
        goalScore = 10;
        potentialGaps.push(`Mentor designation (${mentor.designation}) is adjacent to your target career goals`);
      }
    } else {
      goalScore = 14;
    }

    // 3. Industry Alignment (Weight: 15%)
    let industryScore = 0;
    if (studentIndustries.length > 0) {
      const match = studentIndustries.some(
        (ind) => mentorIndustry.includes(ind) || ind.includes(mentorIndustry)
      );
      if (match) {
        industryScore = 15;
        positiveMatchReasons.push(`Direct industry match in ${mentor.industry}`);
      } else {
        industryScore = 6;
        potentialGaps.push(`Mentor is currently in ${mentor.industry}, which differs from your preferred industries`);
      }
    } else {
      industryScore = 12; // Baseline if no specific preference indicated
    }

    // 4. Mentorship Topic Alignment (Weight: 15%)
    let topicScore = 0;
    const matchingTopics: string[] = [];
    if (studentTopics.length > 0 && mentorTopics.length > 0) {
      for (const st of studentTopics) {
        if (mentorTopics.some((mt) => mt.includes(st) || st.includes(mt))) {
          matchingTopics.push(st);
        }
      }
      const uniqueTopicMatches = Array.from(new Set(matchingTopics));
      if (uniqueTopicMatches.length >= 2) {
        topicScore = 15;
        positiveMatchReasons.push(`Covers multiple preferred topics: ${uniqueTopicMatches.join(', ')}`);
      } else if (uniqueTopicMatches.length === 1) {
        topicScore = 11;
        positiveMatchReasons.push(`Covers preferred mentorship topic: ${uniqueTopicMatches[0]}`);
      } else {
        topicScore = 5;
        potentialGaps.push('Limited overlap on specific mentorship request topics');
      }
    } else {
      topicScore = 11;
    }

    // 5. Language Compatibility (Weight: 10%)
    let languageScore = 0;
    const sharedLanguages = studentLanguages.filter((sl) => mentorLanguages.includes(sl));
    if (sharedLanguages.length >= 2) {
      languageScore = 10;
      positiveMatchReasons.push(`Fluent in your preferred languages: ${sharedLanguages.join(' & ')}`);
    } else if (sharedLanguages.length === 1) {
      languageScore = 8;
      positiveMatchReasons.push(`Fluent in ${sharedLanguages[0]}`);
    } else {
      languageScore = 4;
      potentialGaps.push('Primary communication language may require alignment');
    }

    // 6. Availability Compatibility (Weight: 10%)
    let availabilityScore = 0;
    const remainingSlots = Math.max(0, mentor.maximumMentees - mentor.activeMenteeCount);
    const hasAvailableDays = (mentor.availableDays || []).length > 0;

    if (remainingSlots >= 2 && hasAvailableDays) {
      availabilityScore = 10;
      positiveMatchReasons.push(`High availability with ${remainingSlots} open mentee spots`);
    } else if (remainingSlots === 1 && hasAvailableDays) {
      availabilityScore = 7;
      positiveMatchReasons.push('Active availability with 1 mentee spot remaining');
    } else if (remainingSlots === 0) {
      availabilityScore = 2;
      potentialGaps.push('Mentor has reached maximum active mentee capacity currently');
    } else {
      availabilityScore = 5;
    }

    // Alumni Bonus / Highlight
    if (mentor.isAlumni) {
      positiveMatchReasons.unshift('Verified College Alumni Mentor');
    }

    // Calculate total composite compatibility score
    const totalScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          expertiseScore +
            goalScore +
            industryScore +
            topicScore +
            languageScore +
            availabilityScore
        )
      )
    );

    // Determine Match Category
    let matchCategory: MentorMatchCategory;
    if (totalScore >= 85) {
      matchCategory = 'EXCELLENT_MATCH';
    } else if (totalScore >= 70) {
      matchCategory = 'STRONG_MATCH';
    } else if (totalScore >= 50) {
      matchCategory = 'MODERATE_MATCH';
    } else {
      matchCategory = 'LIMITED_MATCH';
    }

    const factors: MentorMatchFactors = {
      expertiseAlignment: expertiseScore,
      goalAlignment: goalScore,
      industryAlignment: industryScore,
      topicAlignment: topicScore,
      languageMatch: languageScore,
      availabilityScore: availabilityScore,
    };

    return {
      mentor,
      compatibilityScore: totalScore,
      matchCategory,
      factors,
      positiveMatchReasons,
      potentialGaps,
    };
  }
}
