import { IAiProvider, AiGenerateOptions, AiProviderResponse } from './aiProvider.interface.js';

export class DeterministicFallbackProvider implements IAiProvider {
  public readonly providerName = 'DETERMINISTIC_FALLBACK';

  public isConfigured(): boolean {
    return true; // Always available as reliable baseline
  }

  public async generateText(
    prompt: string,
    options?: AiGenerateOptions
  ): Promise<AiProviderResponse> {
    const lowerPrompt = prompt.toLowerCase();
    const studentContext = options?.studentContext || {};
    const lang = options?.language || (studentContext.language as string) || 'en';

    const verifiedSkills = (studentContext.verifiedSkills as string[]) || [];
    const readinessScore = studentContext.readinessScore ?? 'N/A';
    const targetRole = (studentContext.targetRole as string) || 'Software Engineer';

    let content = '';

    if (lang === 'hi') {
      if (lowerPrompt.includes('resume') || lowerPrompt.includes('cv') || lowerPrompt.includes('बायोडाटा')) {
        content = `[निश्चित कैरियर मार्गदर्शन] (Deterministic Career Guidance)
आपके वर्तमान छात्र प्रोफ़ाइल के आधार पर (कैरियर तत्परता स्कोर: ${readinessScore}%):
1. **शीर्षक और संपर्क विवरण**: सुनिश्चित करें कि आपका ईमेल, लिंक्डइन और GitHub प्रोफ़ाइल लिंक पूरी तरह सत्यापित और काम कर रहे हैं।
2. **थ्योरी से अधिक प्रोजेक्ट्स**: सामान्य कोर्सवर्क बुलेट्स की जगह 2-3 लाइव प्रोडक्शन-ग्रेड प्रोजेक्ट्स शामिल करें जो वास्तविक तकनीकी समस्याओं को हल करते हों।
3. **एक्शन-ओरिएंटेड बुलेट्स**: प्रत्येक बुलेट पॉइंट को मजबूत एक्शन वर्ब्स (जैसे "Engineered", "Optimized", "Architected") से शुरू करें और व्यावसायिक प्रभाव दिखाएं।
4. **कौशल सत्यापन**: आपके पास ${verifiedSkills.length} मूल्यांकन-सत्यापित कौशल हैं (${verifiedSkills.join(', ') || 'अभी तक कोई नहीं'})। अपने तकनीकी कौशल अनुभाग में सबसे ऊपर सत्यापित कौशलों को प्रमुखता से दिखाएं।`;
      } else if (lowerPrompt.includes('interview') || lowerPrompt.includes('question') || lowerPrompt.includes('साक्षात्कार')) {
        content = `[निश्चित कैरियर मार्गदर्शन] (Deterministic Career Guidance)
${targetRole} साक्षात्कारों के लिए प्रमुख तैयारी स्तंभ:
1. **डेटा स्ट्रक्चर्स और एल्गोरिदम (DSA)**: Array Two-Pointer, Binary Search और Tree Traversal (BFS/DFS) पर ध्यान केंद्रित करें। NeetCode 150 अनुशंसित सूची है।
2. **सिस्टम फंडामेंटल्स**: HTTP Idempotency, REST आर्किटेक्चर, डेटाबेस इंडेक्सिंग (Leftmost Prefix Rule) और Docker Caching समझाने के लिए तैयार रहें।
3. **व्यवहार STAR तकनीक**: अपने कॉलेज प्रोजेक्ट्स से Situation, Task, Action और Result पद्धति का उपयोग करके 3 कहानियाँ तैयार करें।
4. **मॉक अभ्यास**: तकनीकी और HR प्रश्नों पर खुद का परीक्षण करने के लिए हमारे इन-बिल्ट इंटरव्यू सिम्युलेटर का उपयोग करें।`;
      } else if (lowerPrompt.includes('roadmap') || lowerPrompt.includes('learn') || lowerPrompt.includes('path') || lowerPrompt.includes('रोडमैप')) {
        content = `[निश्चित कैरियर मार्गदर्शन] (Deterministic Career Guidance)
${targetRole} के लिए संरचित माइलस्टोन रोडमैप:
- **चरण 1 (सप्ताह 1-4)**: प्रोग्रामिंग भाषा के आधारभूत कॉन्सेप्ट्स और Git वर्जन कंट्रोल (Branching, PR शिष्टाचार) में महारत हासिल करें।
- **चरण 2 (सप्ताह 5-8)**: बैकएंड API, डेटाबेस स्कीमा सामान्यीकरण (Normalization) और ACID ट्रांजैक्शन सुरक्षा।
- **चरण 3 (सप्ताह 9-12)**: Docker कंटेनराइजेशन, CI/CD टेस्ट पाइपलाइन और एक संपूर्ण कैपस्टोन प्रोजेक्ट का लाइव डिप्लॉयमेंट।`;
      } else if (lowerPrompt.includes('project') || lowerPrompt.includes('portfolio') || lowerPrompt.includes('प्रोजेक्ट')) {
        content = `[निश्चित कैरियर मार्गदर्शन] (Deterministic Career Guidance)
उच्च-प्रभाव पोर्टफोलियो प्रोजेक्ट सुझाव:
1. **टियर-2/3 जिला संसाधन पोर्टल**: रुक-रुक कर कनेक्टिविटी के लिए स्थानीय IndexedDB सिंक के साथ ऑफ़लाइन-फ़र्स्ट वेब ऐप।
2. **टास्क क्यू माइक्रो-सर्विस**: Docker कंटेनराइजेशन के साथ Redis और Node.js Streams का उपयोग करने वाली उच्च-थ्रूपुट सर्विस।
3. **एल्गोरिथम पाथफाइंडिंग विज़ुअलाइज़र**: ग्राफ़ एल्गोरिदम (Dijkstra, A*) प्रदर्शित करने वाला इंटरैक्टिव वेब ऐप।`;
      } else {
        content = `[निश्चित कैरियर मार्गदर्शन] (Deterministic Career Guidance)
नमस्ते! ${studentContext.course || 'इंजीनियरिंग'} में आपके प्रोफ़ाइल के आधार पर (तत्परता स्कोर: ${readinessScore}%):
- **लक्षित भूमिका**: ${targetRole} पर ध्यान केंद्रित।
- **सत्यापित कौशल**: ${verifiedSkills.length > 0 ? verifiedSkills.join(', ') : 'रिक्रूटर्स के समक्ष अपनी क्षमताओं को प्रमाणित करने के लिए कौशल मूल्यांकन दें।'}
- **अनुशंसित कदम**: आगामी कैंपस प्लेसमेंट ड्राइव में अपनी रैंकिंग बढ़ाने के लिए प्रोफ़ाइल के 8 अनुभाग पूरे करें और स्किल असेसमेंट दें।`;
      }
    } else if (lang === 'hi-Latn') {
      if (lowerPrompt.includes('resume') || lowerPrompt.includes('cv')) {
        content = `[Deterministic Career Guidance]
Aapke current student profile ke basis par (Readiness Score: ${readinessScore}%):
1. **Header & Contact Info**: Ensure karein ki aapka email, LinkedIn, aur GitHub profile links verified aur clickable hon.
2. **Projects Over Coursework**: Generic theory points ki jagah 2-3 production-grade projects add karein jo real-world technical problems solve karte hon aur jinke live URLs hon.
3. **Action-Oriented Bullets**: Har bullet point ko strong action verbs (e.g. "Engineered", "Optimized", "Architected") se shuru karein aur business impact highlight karein.
4. **Skills Verification**: Aapke paas ${verifiedSkills.length} assessment-verified skills hain (${verifiedSkills.join(', ') || 'abhi tak koi nahi'}). Verified skills ko apne resume me top par show karein.`;
      } else if (lowerPrompt.includes('interview') || lowerPrompt.includes('question')) {
        content = `[Deterministic Career Guidance]
${targetRole} interview preparation ke main pillars:
1. **Core Data Structures & Algorithms (DSA)**: Array Two-Pointer, Binary Search, aur Tree Traversals (BFS/DFS) par focus karein. NeetCode 150 best curated list hai.
2. **System Fundamentals**: HTTP Idempotency, REST API design, Database Indexing rules, aur Docker fundamentals acche se prepare karein.
3. **Behavioral STAR Technique**: Apne college projects se Situation, Task, Action, aur Result (STAR) framework use karke 3 solid stories ready rakhein.
4. **Mock Practice**: Technical aur HR rounds ke liye hamare built-in Interview Preparation simulator par practice karein.`;
      } else if (lowerPrompt.includes('roadmap') || lowerPrompt.includes('learn') || lowerPrompt.includes('path')) {
        content = `[Deterministic Career Guidance]
${targetRole} ke liye structured milestone roadmap:
- **Phase 1 (Weeks 1-4)**: Core programming language fundamentals aur Git version control (Branching, PRs) master karein.
- **Phase 2 (Weeks 5-8)**: Backend APIs development, Database schema design, aur ACID transactions.
- **Phase 3 (Weeks 9-12)**: Docker containerization, CI/CD automated testing, aur complete capstone project live deploy karein.`;
      } else if (lowerPrompt.includes('project') || lowerPrompt.includes('portfolio')) {
        content = `[Deterministic Career Guidance]
Recommended high-impact portfolio project ideas:
1. **District Resource Portal**: Offline-first web application jisme poor network ke liye IndexedDB local sync ho.
2. **High-Throughput Task Queue Service**: Redis aur Node.js Streams use karke banaya gaya Dockerized backend microservice.
3. **Algorithmic Pathfinding Visualizer**: Interactive web application jo graph traversal algorithms (Dijkstra, A*) visually represent kare.`;
      } else {
        content = `[Deterministic Career Guidance]
Hello! Aapke verified academic profile (${studentContext.course || 'Engineering'}, Readiness: ${readinessScore}%) ke basis par:
- **Target Role Alignment**: ${targetRole} par focused.
- **Verified Skills**: ${verifiedSkills.length > 0 ? verifiedSkills.join(', ') : 'Recruiters ke liye apni skills prove karne ke liye skill assessments zaroor lein.'}
- **Recommended Action**: Upcoming campus drives me high ranking paane ke liye apne 8 profile sections complete karein aur standard assessments attempt karein.`;
      }
    } else {
      if (lowerPrompt.includes('resume') || lowerPrompt.includes('cv')) {
        content = `[Deterministic Career Guidance]
Based on your current student profile (Readiness Score: ${readinessScore}%):
1. **Header & Contact**: Ensure your email, LinkedIn, and GitHub links are verified and clickable.
2. **Projects Over Theory**: Replace generic coursework bullet points with 2-3 production-grade projects demonstrating real technical problems and deployed URLs.
3. **Action-Oriented Bullets**: Start each bullet with a strong action verb (e.g., "Engineered", "Optimized", "Architected") followed by the business impact.
4. **Skills Verification**: You have ${verifiedSkills.length} assessment-verified skills (${verifiedSkills.join(', ') || 'none yet'}). Highlight verified skills at the top of your technical skills section.`;
      } else if (lowerPrompt.includes('interview') || lowerPrompt.includes('question')) {
        content = `[Deterministic Career Guidance]
Key preparation pillars for ${targetRole} interviews:
1. **Core Data Structures & Algorithms**: Focus on Array two-pointer patterns, Binary Search, and Tree traversals (BFS/DFS). NeetCode 150 is the recommended curated list.
2. **System Fundamentals**: Be ready to explain HTTP idempotency, REST architectural constraints, database indexing Leftmost Prefix rules, and Docker caching.
3. **Behavioral STAR Technique**: Prepare 3 stories from your college projects using Situation, Task, Action, and Result.
4. **Mock Practice**: Use our built-in Interview Preparation simulator to test yourself on technical and HR questions.`;
      } else if (lowerPrompt.includes('roadmap') || lowerPrompt.includes('learn') || lowerPrompt.includes('path')) {
        content = `[Deterministic Career Guidance]
Structured milestone roadmap for ${targetRole}:
- **Phase 1 (Weeks 1-4)**: Master foundational language mechanics and version control (Git branching, PR etiquette).
- **Phase 2 (Weeks 5-8)**: Backend APIs, database schema normalization, and ACID transaction safety.
- **Phase 3 (Weeks 9-12)**: Containerization with Docker, CI/CD automated test pipelines, and full deployment of a capstone portfolio project.`;
      } else if (lowerPrompt.includes('project') || lowerPrompt.includes('portfolio')) {
        content = `[Deterministic Career Guidance]
Recommended high-impact portfolio project ideas:
1. **Tier-2/3 District Resource Portal**: Offline-first web application with local IndexedDB sync for intermittent network connectivity.
2. **High-Throughput Task Queue Service**: Microservice using Redis and Node.js Streams with Docker containerization.
3. **Algorithmic Pathfinding Visualizer**: Interactive canvas web app showcasing graph traversal algorithms (Dijkstra, A*).`;
      } else {
        content = `[Deterministic Career Guidance]
Hello! Based on your verified academic profile in ${studentContext.course || 'Engineering'} (Readiness: ${readinessScore}%):
- **Target Role Alignment**: Focusing on ${targetRole}.
- **Verified Skills**: ${verifiedSkills.length > 0 ? verifiedSkills.join(', ') : 'Take skill assessments to verify your abilities for recruiters.'}
- **Recommended Action**: Complete your 8 profile sections in the Career Profile tab and take standard skill assessments to maximize your ranking for upcoming campus drives.`;
      }
    }

    return {
      content,
      isFallback: true,
      provider: this.providerName,
      fallbackReason: 'AI provider credentials not configured or remote API unavailable',
      tokensUsed: 0,
    };
  }

  public async generateStructured<T>(
    prompt: string,
    options?: AiGenerateOptions
  ): Promise<{ data: T; isFallback: boolean; provider: string; fallbackReason?: string }> {
    // Deterministic fallback for structured generation (JSON)
    const fallbackResponse = await this.generateText(prompt, options);

    let parsedData: any = {};
    const lower = prompt.toLowerCase();

    if (lower.includes('roadmap')) {
      parsedData = {
        targetRole: (options?.studentContext?.targetRole as string) || 'Full-Stack Software Engineer',
        estimatedDuration: '12 Weeks',
        recommendedTopics: ['TypeScript & Advanced ES6', 'Express & REST APIs', 'Relational Database Schema Design', 'Docker & CI/CD'],
        milestones: [
          {
            id: 'ms-1',
            title: 'Phase 1: Language Mechanics & Typing',
            description: 'Master core JavaScript asynchronous execution, event loop, and strict TypeScript types.',
            order: 1,
            estimatedWeeks: 3,
            completed: false,
            topics: ['JavaScript Closures', 'Event Loop & Microtasks', 'TypeScript Interfaces & Generics'],
            projectIdea: 'Build an open-source typed utility library with 100% unit test coverage.',
            practiceTasks: ['Solve 15 NeetCode array problems', 'Build custom promise polyfill'],
          },
          {
            id: 'ms-2',
            title: 'Phase 2: Backend Architecture & Databases',
            description: 'Design robust REST APIs, normalized SQL/MongoDB schemas, and ACID transactions.',
            order: 2,
            estimatedWeeks: 4,
            completed: false,
            topics: ['REST Idempotency', 'Mongoose / PostgreSQL Design', 'Database Indexing Optimization'],
            projectIdea: 'Full-stack campus directory portal with JWT authentication and rate limiting.',
            practiceTasks: ['Implement compound index query benchmarking', 'Write integration tests with Vitest'],
          },
          {
            id: 'ms-3',
            title: 'Phase 3: DevOps, Containers & Deployment',
            description: 'Package applications into optimized multi-stage Docker containers and configure CI/CD.',
            order: 3,
            estimatedWeeks: 5,
            completed: false,
            topics: ['Dockerfile Optimization', 'Docker Compose', 'GitHub Actions Automated Testing'],
            projectIdea: 'Deploy full-stack portfolio application with automated GitHub Actions testing pipeline.',
            practiceTasks: ['Create multi-stage production Docker build', 'Configure automated lint and test workflows'],
          },
        ],
      };
    } else if (lower.includes('resume')) {
      parsedData = {
        overallScore: 78,
        summary: 'Solid foundational resume. Project portfolio and assessment-verified skills should be elevated to improve recruiter ATS matching.',
        sections: [
          {
            sectionName: 'Technical Skills',
            score: 8,
            status: 'STRONG',
            strengths: ['Clearly categorized programming languages and web tools.'],
            weaknesses: ['Does not explicitly highlight assessment-verified credentials.'],
            actionableSuggestions: ['Add a "Verified Skills" tag for skills passed through CareerBridge standardized assessments.'],
          },
          {
            sectionName: 'Project Portfolio',
            score: 7,
            status: 'ADEQUATE',
            strengths: ['Includes real-world full stack project.'],
            weaknesses: ['Missing quantitative business or technical metrics in descriptions.'],
            actionableSuggestions: ['Quantify performance gains (e.g. "Reduced API latency by 35% using compound indexes").'],
          },
          {
            sectionName: 'Summary & Headline',
            score: 7,
            status: 'NEEDS_IMPROVEMENT',
            strengths: ['Clear aspiration stated.'],
            weaknesses: ['Generic wording without specialization focus.'],
            actionableSuggestions: ['Specify your focus area (e.g. "Backend Node.js & Database Systems Engineer").'],
          },
        ],
        roleRelevance: {
          targetRole: (options?.studentContext?.targetRole as string) || 'Software Engineer',
          fitScore: 80,
          matchingKeywords: ['JavaScript', 'React', 'Node.js', 'REST APIs', 'SQL'],
          missingKeywords: ['Docker', 'CI/CD Pipelines', 'Unit Testing'],
        },
        keyImprovements: [
          'Add live deployment and GitHub repository links for all listed projects.',
          'Format bullet points with action verbs and quantifiable impact.',
          'Verify missing skills through CareerBridge objective assessments.',
        ],
      };
    } else if (lower.includes('interview')) {
      parsedData = {
        score: 80,
        strengths: [
          'Directly addressed the core architectural question.',
          'Demonstrated clear understanding of fundamental tradeoffs.',
        ],
        areasForImprovement: [
          'Structure your response using the STAR method (Situation, Task, Action, Result).',
          'Include concrete edge cases or failure modes in your explanation.',
        ],
        modelAnswerSnippet: 'A strong response outlines the problem context, identifies the specific architectural constraint, implements the technical solution, and concludes with measurable outcomes.',
      };
    }

    return {
      data: parsedData as T,
      isFallback: true,
      provider: this.providerName,
      fallbackReason: fallbackResponse.fallbackReason,
    };
  }
}
