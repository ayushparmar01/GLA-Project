import {
  MockInterviewType,
  MockInterviewDifficulty,
  MockInterviewQuestionType,
  MockInterviewQuestionData,
} from '../types/index.js';
import {
  InterviewQuestionBank,
  IInterviewQuestionBank,
} from '../models/interviewQuestionBank.model.js';
import { PlacementDrive } from '../models/placementDrive.model.js';
import { Resume } from '../models/resume.model.js';
import { User } from '../models/user.model.js';
import { getDbStatus } from '../config/db.js';

export const SEED_MOCK_QUESTIONS: Array<Omit<MockInterviewQuestionData, 'id'>> = [
  // ==========================================
  // 1. TECHNICAL: DSA & PROGRAMMING
  // ==========================================
  {
    questionText: 'Given an array of integers, how would you find two numbers that sum up to a specific target? Explain the brute-force vs optimal hash map approach, comparing time and space complexities.',
    category: 'TECHNICAL',
    topic: 'Data Structures & Algorithms',
    role: 'Software Engineer',
    difficulty: 'BEGINNER',
    questionType: 'CODING',
    expectedConcepts: ['Two Sum', 'Hash Map lookup O(1)', 'Time complexity O(N)', 'Space complexity O(N)'],
    suggestedApproach: 'Start by explaining why nested loops take O(N^2) time. Introduce a single-pass hash map storing complement values (target - current). Conclude with O(N) time and O(N) space.',
    starterCode: `function twoSum(nums: number[], target: number): number[] {\n  // Your solution here\n}`,
    codeLanguage: 'typescript',
    timeLimitSeconds: 300,
    sourceType: 'CURATED',
  },
  {
    questionText: 'Explain how a Red-Black Tree or AVL Tree maintains balanced height during insertions, and why standard Binary Search Trees degrade to O(N) in worst-case scenarios.',
    category: 'TECHNICAL',
    topic: 'Trees & Graphs',
    role: 'Backend Engineer',
    difficulty: 'ADVANCED',
    questionType: 'CONCEPTUAL',
    expectedConcepts: ['Self-balancing binary search trees', 'Rotations (LL, RR, LR, RL)', 'Worst-case skewed tree O(N)', 'Balanced height O(log N)'],
    suggestedApproach: 'Discuss sorted insertion leading to linked-list degradation. Detail tree rotations, coloring rules, and height guarantees of O(log N) lookup.',
    timeLimitSeconds: 300,
    sourceType: 'CURATED',
  },
  {
    questionText: 'Implement a function to detect if a directed graph contains a cycle. Explain whether Depth-First Search with recursion stack coloring or Kahn’s algorithm (topological sort) is preferable.',
    category: 'TECHNICAL',
    topic: 'Graphs & Algorithms',
    role: 'Software Engineer',
    difficulty: 'ADVANCED',
    questionType: 'CODING',
    expectedConcepts: ['Graph cycle detection', 'DFS 3-color state (White, Gray, Black)', 'In-degree array in Kahn algorithm', 'Back-edges'],
    suggestedApproach: 'Contrast DFS recursion stack tracking vs BFS topological sort where an incomplete topological order signals a cycle.',
    timeLimitSeconds: 420,
    sourceType: 'CURATED',
  },

  // ==========================================
  // 2. TECHNICAL: WEB & FULL STACK
  // ==========================================
  {
    questionText: 'In React 18+, how does Concurrent Mode with startTransition and Suspense optimize UI rendering compared to synchronous blocking updates? What problem does it solve?',
    category: 'ROLE_SPECIFIC',
    topic: 'React & Frontend Architecture',
    role: 'Frontend Developer',
    difficulty: 'INTERMEDIATE',
    questionType: 'CONCEPTUAL',
    expectedConcepts: ['Concurrent rendering', 'Interruptible rendering', 'Urgent vs non-urgent updates', 'startTransition API', 'User responsiveness'],
    suggestedApproach: 'Differentiate urgent updates (typing in input) from non-urgent transitions (filtering large table). Explain how React yields control to browser events.',
    timeLimitSeconds: 300,
    sourceType: 'CURATED',
  },
  {
    questionText: 'Design a resilient rate-limiting middleware for an Express REST API using a sliding window counter algorithm. How would you handle distributed instances sharing rate limits?',
    category: 'ROLE_SPECIFIC',
    topic: 'Node.js & Backend Architecture',
    role: 'Backend Developer',
    difficulty: 'INTERMEDIATE',
    questionType: 'SCENARIO',
    expectedConcepts: ['Sliding window log vs counter', 'Express middleware pipeline', 'Redis atomic increments / Lua scripts', '429 Too Many Requests response headers'],
    suggestedApproach: 'Contrast fixed window burst flaws with sliding window smoothness. Explain shared in-memory caches like Redis with TTL expiration.',
    starterCode: `import { Request, Response, NextFunction } from 'express';\n\nexport const rateLimiter = (req: Request, res: Response, next: NextFunction) => {\n  // Implement sliding window check\n};`,
    codeLanguage: 'typescript',
    timeLimitSeconds: 360,
    sourceType: 'CURATED',
  },
  {
    questionText: 'Explain database indexing internal mechanisms. How does a B-Tree index differ from a Hash index, and what are the trade-offs of having too many indexes on a write-heavy database?',
    category: 'TECHNICAL',
    topic: 'Database Management Systems',
    role: 'Full-Stack Developer',
    difficulty: 'INTERMEDIATE',
    questionType: 'CONCEPTUAL',
    expectedConcepts: ['B-Tree node branching', 'Range query support in B-Trees', 'Hash index O(1) equality only', 'Write amplification and maintenance overhead'],
    suggestedApproach: 'Explain why B-Trees are preferred for relational range queries. Highlight that each INSERT/UPDATE must rewrite index pages, hurting write throughput.',
    timeLimitSeconds: 300,
    sourceType: 'CURATED',
  },

  // ==========================================
  // 3. BEHAVIORAL & STAR FRAMEWORK
  // ==========================================
  {
    questionText: 'Describe a significant engineering conflict or technical disagreement you had in a team project. Structure your answer using the STAR methodology (Situation, Task, Action, Result).',
    category: 'BEHAVIORAL',
    topic: 'Conflict Resolution & Teamwork',
    role: 'Software Engineer',
    difficulty: 'INTERMEDIATE',
    questionType: 'BEHAVIORAL',
    expectedConcepts: ['Situation context', 'Task objective', 'Objective data-driven action', 'Constructive result and learning'],
    suggestedApproach: 'Clearly identify Situation and Task. Focus 60% of your response on the collaborative Action taken (benchmarking, code spike, objective criteria) and positive team Result.',
    timeLimitSeconds: 300,
    sourceType: 'CURATED',
  },
  {
    questionText: 'Tell me about a project where requirements changed abruptly or a deadline was moved forward unexpectedly. How did you adapt your plan and prioritize deliverables?',
    category: 'BEHAVIORAL',
    topic: 'Adaptability & Prioritization',
    role: 'Software Engineer',
    difficulty: 'BEGINNER',
    questionType: 'BEHAVIORAL',
    expectedConcepts: ['Handling ambiguity', 'Scope negotiation', 'MoSCoW prioritization', 'Stakeholder communication', 'Successful delivery'],
    suggestedApproach: 'Highlight triage skills, separating core must-have MVP features from optional bells and whistles. Emphasize proactive team communication.',
    timeLimitSeconds: 300,
    sourceType: 'CURATED',
  },

  // ==========================================
  // 4. HR & CULTURE
  // ==========================================
  {
    questionText: 'Please introduce yourself, highlighting your technical background, your key engineering projects, and why you are specifically enthusiastic about joining our organization.',
    category: 'HR',
    topic: 'Professional Introduction',
    role: 'General Fresher',
    difficulty: 'BEGINNER',
    questionType: 'CONCEPTUAL',
    expectedConcepts: ['Clear 90-second elevator pitch', 'Key tech stack proficiencies', 'Flagship project impact', 'Company alignment'],
    suggestedApproach: 'Follow the Present-Past-Future framework: current status & skills, standout past project achievements, and future alignment with company vision.',
    timeLimitSeconds: 240,
    sourceType: 'CURATED',
  },
  {
    questionText: 'What is your biggest technical weakness or an area where you struggled recently, and what proactive steps have you taken over the past three months to systematically overcome it?',
    category: 'HR',
    topic: 'Self-Awareness & Growth Mindset',
    role: 'General Fresher',
    difficulty: 'BEGINNER',
    questionType: 'CONCEPTUAL',
    expectedConcepts: ['Genuine self-awareness', 'No humble-bragging', 'Concrete learning actions', 'Measurable improvement evidence'],
    suggestedApproach: 'Choose an authentic technical weakness (e.g., initial hesitation with Docker containerization or CI/CD). Detail books, courses, or labs taken to master it.',
    timeLimitSeconds: 240,
    sourceType: 'CURATED',
  },
];

export class InterviewQuestionBankService {
  /**
   * Automatically seed initial curated questions if database collection is empty.
   */
  public static async ensureSeedQuestions(): Promise<void> {
    const dbStatus = getDbStatus();
    if (dbStatus.status !== 'connected') return;

    try {
      const count = await InterviewQuestionBank.countDocuments();
      if (count === 0) {
        await InterviewQuestionBank.insertMany(SEED_MOCK_QUESTIONS);
      }
    } catch {
      // Non-blocking seed failure
    }
  }

  /**
   * Fetch questions for an interview session based on category, role, difficulty, and count.
   */
  public static async getQuestionsForSession(params: {
    interviewType: MockInterviewType;
    targetRole: string;
    difficulty: MockInterviewDifficulty;
    questionCount: number;
    jobId?: string;
    resumeId?: string;
    studentId?: string;
  }): Promise<MockInterviewQuestionData[]> {
    const { interviewType, targetRole, difficulty, questionCount, jobId, resumeId, studentId } = params;
    const dbStatus = getDbStatus();

    // 1. If Job-Specific, generate questions based on PlacementDrive details
    if (interviewType === 'JOB_SPECIFIC' && jobId && dbStatus.status === 'connected') {
      try {
        const jobQuestions = await this.generateJobSpecificQuestions(jobId, questionCount);
        if (jobQuestions.length > 0) return jobQuestions;
      } catch {
        // Fallback to role-specific
      }
    }

    // 2. If Resume-Based, generate questions based on Resume details
    if (interviewType === 'RESUME_BASED' && (resumeId || studentId) && dbStatus.status === 'connected') {
      try {
        const resumeQuestions = await this.generateResumeBasedQuestions(studentId!, resumeId, questionCount);
        if (resumeQuestions.length > 0) return resumeQuestions;
      } catch {
        // Fallback to role-specific
      }
    }

    // 3. Query Question Bank from Database
    if (dbStatus.status === 'connected') {
      try {
        await this.ensureSeedQuestions();

        let query: Record<string, any> = { isActive: true };

        if (interviewType === 'TECHNICAL') {
          query.category = { $in: ['TECHNICAL', 'ROLE_SPECIFIC'] };
        } else if (interviewType === 'HR') {
          query.category = 'HR';
        } else if (interviewType === 'BEHAVIORAL') {
          query.category = 'BEHAVIORAL';
        } else if (interviewType === 'ROLE_SPECIFIC') {
          query.category = { $in: ['ROLE_SPECIFIC', 'TECHNICAL'] };
        }

        const foundQuestions = await InterviewQuestionBank.find(query).limit(questionCount * 2).lean();

        if (foundQuestions.length > 0) {
          // Shuffle and return requested count
          const shuffled = foundQuestions.sort(() => 0.5 - Math.random());
          return shuffled.slice(0, questionCount).map((doc) => ({
            id: (doc._id as any).toString(),
            questionText: doc.questionText,
            category: doc.category,
            topic: doc.topic,
            role: doc.role,
            difficulty: doc.difficulty,
            questionType: doc.questionType,
            expectedConcepts: doc.expectedConcepts || [],
            suggestedApproach: doc.suggestedApproach,
            starterCode: doc.starterCode,
            codeLanguage: doc.codeLanguage,
            timeLimitSeconds: doc.timeLimitSeconds,
            sourceType: doc.sourceType,
          }));
        }
      } catch {
        // Fallback to in-memory seeds
      }
    }

    // 4. Memory Seed Fallback
    const filteredSeeds = SEED_MOCK_QUESTIONS.filter((q) => {
      if (interviewType === 'TECHNICAL') return q.category === 'TECHNICAL' || q.category === 'ROLE_SPECIFIC';
      if (interviewType === 'HR') return q.category === 'HR';
      if (interviewType === 'BEHAVIORAL') return q.category === 'BEHAVIORAL';
      return true;
    });

    const selected = filteredSeeds.length > 0 ? filteredSeeds : SEED_MOCK_QUESTIONS;
    return selected.slice(0, questionCount).map((q, idx) => ({
      ...q,
      id: `seed-q-${idx + 1}`,
    }));
  }

  /**
   * Generates dynamic practice questions based on a real placement drive.
   */
  public static async generateJobSpecificQuestions(
    jobId: string,
    count: number
  ): Promise<MockInterviewQuestionData[]> {
    const drive = await PlacementDrive.findById(jobId).lean();
    if (!drive) return [];

    const questions: MockInterviewQuestionData[] = [];
    const skills = [...(drive.requiredSkills || []), ...(drive.preferredSkills || [])];

    // Core role conceptual question
    questions.push({
      id: `job-q-1-${jobId}`,
      questionText: `This role at ${drive.organizationName} is for a ${drive.title}. What core architectural patterns and engineering best practices would you apply in this position?`,
      category: 'JOB_SPECIFIC',
      topic: `${drive.title} Architecture`,
      role: drive.title,
      difficulty: 'INTERMEDIATE',
      questionType: 'CONCEPTUAL',
      expectedConcepts: ['Component architecture', 'Testing and CI/CD', 'Code modularity', 'System design principles'],
      suggestedApproach: `Discuss how you would design solutions aligned with the duties of a ${drive.title}.`,
      timeLimitSeconds: 300,
      sourceType: 'JOB_DESCRIPTION',
    });

    // Required skills technical drilldown
    for (let i = 0; i < skills.length && questions.length < count; i++) {
      const skill = skills[i];
      questions.push({
        id: `job-q-skill-${i}-${jobId}`,
        questionText: `A primary prerequisite for ${drive.title} is proficiency in ${skill}. Describe a complex problem you tackled using ${skill}, focusing on performance optimization or debugging.`,
        category: 'JOB_SPECIFIC',
        topic: skill,
        role: drive.title,
        difficulty: 'INTERMEDIATE',
        questionType: 'SCENARIO',
        expectedConcepts: [`Deep knowledge of ${skill}`, 'Optimization trade-offs', 'Troubleshooting methodology'],
        suggestedApproach: `Highlight practical experience using ${skill} with quantifiable technical decisions.`,
        timeLimitSeconds: 300,
        sourceType: 'JOB_DESCRIPTION',
      });
    }

    // Behavioral alignment with company
    if (questions.length < count) {
      questions.push({
        id: `job-q-behavioral-${jobId}`,
        questionText: `Why are you interested in joining ${drive.organizationName} as a ${drive.title}, and how do your technical accomplishments prepare you for this role?`,
        category: 'JOB_SPECIFIC',
        topic: 'Company Alignment',
        role: drive.title,
        difficulty: 'BEGINNER',
        questionType: 'BEHAVIORAL',
        expectedConcepts: ['Company mission awareness', 'Alignment with requirements', 'Proactive communication'],
        suggestedApproach: `Connect your skills directly to the published job requirements of ${drive.organizationName}.`,
        timeLimitSeconds: 240,
        sourceType: 'JOB_DESCRIPTION',
      });
    }

    return questions.slice(0, count);
  }

  /**
   * Generates dynamic practice questions based on the student's actual resume or profile.
   */
  public static async generateResumeBasedQuestions(
    studentId: string,
    resumeId?: string,
    count: number = 5
  ): Promise<MockInterviewQuestionData[]> {
    let projects: any[] = [];
    let skills: string[] = [];
    let studentRole = 'Software Engineer';

    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, studentId }).lean();
      if (resume?.structuredContent) {
        projects = resume.structuredContent.projects || [];
        skills = resume.structuredContent.technicalSkills || [];
        studentRole = resume.targetRole || studentRole;
      }
    }

    if (projects.length === 0) {
      const user = await User.findById(studentId).lean();
      const sp = user?.studentProfile || {};
      projects = sp.projects || [];
      skills = sp.technicalSkills || sp.skills || [];
    }

    const questions: MockInterviewQuestionData[] = [];

    // Project deep-dive questions
    if (projects.length > 0) {
      const p = projects[0];
      questions.push({
        id: `res-q-proj-1`,
        questionText: `On your resume, you highlighted the project "${p.title || 'Technical Project'}". Walk me through the system architecture, how the frontend and backend communicate, and what database schema choices you made.`,
        category: 'RESUME_BASED',
        topic: 'Project Architecture',
        role: studentRole,
        difficulty: 'INTERMEDIATE',
        questionType: 'PROJECT_EXPLANATION',
        expectedConcepts: ['Component architecture', 'REST/GraphQL APIs', 'Data modeling', 'State management'],
        suggestedApproach: `Present your architecture clearly: client layer, API gateway/routes, business logic, and database persistence.`,
        timeLimitSeconds: 300,
        sourceType: 'RESUME',
      });

      questions.push({
        id: `res-q-proj-2`,
        questionText: `In "${p.title || 'your flagship project'}", what was the most difficult bug or technical bottleneck you encountered, and what diagnostic steps did you take to resolve it?`,
        category: 'RESUME_BASED',
        topic: 'Engineering Problem Solving',
        role: studentRole,
        difficulty: 'INTERMEDIATE',
        questionType: 'SCENARIO',
        expectedConcepts: ['Root cause analysis', 'Profiling / logs', 'Systematic debugging', 'Outcome verification'],
        suggestedApproach: `Use the STAR format: specify the bug, how you reproduced it, the hypothesis tested, and the permanent fix.`,
        timeLimitSeconds: 300,
        sourceType: 'RESUME',
      });
    }

    // Technology choices from resume skills
    if (skills.length > 0 && questions.length < count) {
      const topSkill = skills[0];
      questions.push({
        id: `res-q-tech-1`,
        questionText: `Your resume lists ${topSkill}. What specific features or design patterns in ${topSkill} do you rely on most heavily, and what are its notable limitations?`,
        category: 'RESUME_BASED',
        topic: `${topSkill} Mastery`,
        role: studentRole,
        difficulty: 'INTERMEDIATE',
        questionType: 'CONCEPTUAL',
        expectedConcepts: [`Core principles of ${topSkill}`, 'Idiomatic patterns', 'Performance constraints'],
        suggestedApproach: `Discuss both strengths and trade-offs of ${topSkill} to demonstrate practical engineering maturity.`,
        timeLimitSeconds: 300,
        sourceType: 'RESUME',
      });
    }

    // If still need more questions, add general behavioral questions
    while (questions.length < count) {
      const seed = SEED_MOCK_QUESTIONS[questions.length % SEED_MOCK_QUESTIONS.length];
      questions.push({
        ...seed,
        id: `res-fallback-${questions.length + 1}`,
        category: 'RESUME_BASED',
        sourceType: 'RESUME',
      });
    }

    return questions.slice(0, count);
  }
}
