import { IUser } from '../models/user.model.js';
import { AssessmentAttempt } from '../models/assessmentAttempt.model.js';
import { SEED_LEARNING_RESOURCES } from '../config/learningResources.seed.js';
import { AiService } from './ai/ai.service.js';
import { getDbStatus } from '../config/db.js';
import {
  RoadmapMilestone,
  LearningRoadmapData,
} from '../types/index.js';

export class RoadmapGeneratorService {
  /**
   * Generates a structured personalized learning roadmap for a student and target role.
   */
  public static async generateRoadmap(
    user: IUser,
    targetRole: string = 'Full-Stack Software Engineer'
  ): Promise<Partial<LearningRoadmapData>> {
    const sp = user.studentProfile || {};
    const aiService = AiService.getInstance();

    // 1. Collect student's declared skills
    const declaredSkills = [
      ...(sp.technicalSkills || []),
      ...(sp.skills || []),
    ];

    // 2. Collect student's verified skills
    const verifiedSkills: string[] = [];
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
                verifiedSkills.push(sr.skill);
              }
            }
          }
        }
      } catch {
        // Fallback gracefully
      }
    }

    // 3. Determine current skill level
    let currentSkillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' = 'BEGINNER';
    if (verifiedSkills.length >= 3 || declaredSkills.length >= 6) {
      currentSkillLevel = 'INTERMEDIATE';
    }
    if (verifiedSkills.length >= 5) {
      currentSkillLevel = 'ADVANCED';
    }

    // 4. Role-specific curriculum templates & milestones
    const normalizedRole = targetRole.toLowerCase();
    let milestones: RoadmapMilestone[] = [];
    let recommendedTopics: string[] = [];
    let estimatedDuration = '12 Weeks';

    if (normalizedRole.includes('backend') || normalizedRole.includes('node') || normalizedRole.includes('api')) {
      estimatedDuration = '10 Weeks';
      recommendedTopics = [
        'Advanced Asynchronous Node.js & Event Loop',
        'Relational Database Modeling & ACID Transactions',
        'Database Indexing Optimization & Query Plans',
        'Microservices Architecture & REST Security',
        'Docker Containerization & Testing with Vitest',
      ];
      milestones = [
        {
          id: 'ms-be-1',
          title: 'Milestone 1: Server Runtime & Asynchronous Mechanics',
          description: 'Deep dive into Node.js event loop, Streams, Buffer, and secure Express middleware patterns.',
          order: 1,
          estimatedWeeks: 2,
          completed: false,
          topics: ['Event Loop Phases', 'Streams & Pipelines', 'Error Handling Architecture'],
          projectIdea: 'Build a streaming file processing microservice with chunked uploads.',
          practiceTasks: ['Implement custom stream transform', 'Benchmark promise vs callback throughput'],
        },
        {
          id: 'ms-be-2',
          title: 'Milestone 2: Database Modeling & ACID Transactions',
          description: 'Master PostgreSQL/MongoDB schema design, compound indexing, and Leftmost Prefix rules.',
          order: 2,
          estimatedWeeks: 3,
          completed: false,
          topics: ['Relational Normalization', 'B-Tree Index Scans', 'Mongoose Query Optimization'],
          projectIdea: 'E-commerce transactional API with inventory reservation and ACID rollback.',
          practiceTasks: ['Analyze slow queries using EXPLAIN ANALYZE', 'Implement compound indexes'],
        },
        {
          id: 'ms-be-3',
          title: 'Milestone 3: API Security & Authentication',
          description: 'Implement JWT with HttpOnly cookies, bcrypt hashing, OWASP security headers, and rate limiting.',
          order: 3,
          estimatedWeeks: 2,
          completed: false,
          topics: ['JWT & Session Security', 'OWASP Top 10 Defenses', 'Rate Limiting & CORS'],
          projectIdea: 'Secure identity provider service with refresh token rotation.',
          practiceTasks: ['Penetration test endpoints for SQL/NoSQL injection', 'Configure Helmet headers'],
        },
        {
          id: 'ms-be-4',
          title: 'Milestone 4: Containerization & CI/CD Pipelines',
          description: 'Package backend into multi-stage Docker builds and configure GitHub Actions for automated testing.',
          order: 4,
          estimatedWeeks: 3,
          completed: false,
          topics: ['Dockerfile Optimization', 'Docker Compose Networking', 'GitHub Actions Test Pipelines'],
          projectIdea: 'Fully containerized microservices suite deployed to a cloud staging host.',
          practiceTasks: ['Create minimal alpine multi-stage Dockerfile', 'Setup automated CI tests with Vitest'],
        },
      ];
    } else if (normalizedRole.includes('frontend') || normalizedRole.includes('react') || normalizedRole.includes('ui')) {
      estimatedDuration = '10 Weeks';
      recommendedTopics = [
        'Modern Semantic HTML5 & Responsive CSS3',
        'JavaScript ES6+ Language Mechanics & Closures',
        'React Component Lifecycle & Custom Hooks',
        'TypeScript Interfaces & Strict Type Checking',
        'State Management & Performance Optimization',
      ];
      milestones = [
        {
          id: 'ms-fe-1',
          title: 'Milestone 1: Web Standards & Modern Layouts',
          description: 'Semantic HTML, accessibility (a11y), responsive design with Flexbox and CSS Grid.',
          order: 1,
          estimatedWeeks: 2,
          completed: false,
          topics: ['Semantic Elements', 'Flexbox & CSS Grid', 'WCAG Accessibility Standards'],
          projectIdea: 'Accessible multi-page responsive institutional website with zero UI frameworks.',
          practiceTasks: ['Pass Lighthouse 100 accessibility audit', 'Build responsive navigation drawer'],
        },
        {
          id: 'ms-fe-2',
          title: 'Milestone 2: Modern JavaScript & Strict TypeScript',
          description: 'Closures, asynchronous promises, Fetch API, and TypeScript interfaces/generics.',
          order: 2,
          estimatedWeeks: 3,
          completed: false,
          topics: ['Closures & Scopes', 'Promise Concurrency (all/race)', 'TypeScript Generics'],
          projectIdea: 'Type-safe state-driven dashboard communicating with public REST APIs.',
          practiceTasks: ['Implement typed generic fetch client', 'Write unit tests for state reducers'],
        },
        {
          id: 'ms-fe-3',
          title: 'Milestone 3: Declarative React Architecture',
          description: 'Hooks (useState, useEffect, useMemo, useCallback), context providers, and component composition.',
          order: 3,
          estimatedWeeks: 3,
          completed: false,
          topics: ['Rules of Hooks', 'Virtual DOM & Reconciliation', 'Custom Reusable Hooks'],
          projectIdea: 'Real-time collaborative kanban board with drag-and-drop state updates.',
          practiceTasks: ['Optimize re-renders using React Profiler', 'Build custom useDebounce hook'],
        },
        {
          id: 'ms-fe-4',
          title: 'Milestone 4: Testing, Build Tooling & Portfolio Deployment',
          description: 'Vite build optimization, Vitest/Testing Library unit tests, and production deployment.',
          order: 4,
          estimatedWeeks: 2,
          completed: false,
          topics: ['Testing Library Best Practices', 'Bundle Splitting', 'Lighthouse Optimization'],
          projectIdea: 'Comprehensive personal engineering portfolio with live interactive demos.',
          practiceTasks: ['Achieve 80%+ component test coverage', 'Deploy to production CDN'],
        },
      ];
    } else {
      // Default: Full-Stack Software Engineer
      estimatedDuration = '12 Weeks';
      recommendedTopics = [
        'Modern JavaScript & Strict TypeScript',
        'Full-Stack Component Architecture with React',
        'REST API Design & Express Middleware',
        'Database Modeling & Index Optimization',
        'Data Structures & Algorithmic Problem Solving',
        'Docker Containerization & CI/CD Pipelines',
      ];
      milestones = [
        {
          id: 'ms-fs-1',
          title: 'Milestone 1: Language Fundamentals & Algorithmic Thinking',
          description: 'Master core JavaScript/TypeScript mechanics, two-pointer arrays, and binary search patterns.',
          order: 1,
          estimatedWeeks: 3,
          completed: false,
          topics: ['TypeScript Types', 'Sliding Window Patterns', 'Sorting & Binary Search'],
          projectIdea: 'Algorithmic problem visualizer web application.',
          practiceTasks: ['Solve NeetCode Core 30 array and string problems', 'Build generic TypeScript utilities'],
        },
        {
          id: 'ms-fs-2',
          title: 'Milestone 2: Declarative Frontend & Interactive UI',
          description: 'Component lifecycles, custom hooks, Tailwind CSS, and state management.',
          order: 2,
          estimatedWeeks: 3,
          completed: false,
          topics: ['React Hooks', 'State Architecture', 'Responsive Design'],
          projectIdea: 'Placement portal candidate analytics dashboard with filtering and search.',
          practiceTasks: ['Build interactive forms with client validation', 'Write component tests with Vitest'],
        },
        {
          id: 'ms-fs-3',
          title: 'Milestone 3: Backend Systems & Database Architecture',
          description: 'Express REST APIs, authentication security (JWT/cookies), and relational/document databases.',
          order: 3,
          estimatedWeeks: 3,
          completed: false,
          topics: ['REST Design', 'ACID Transactions', 'Mongoose / SQL Indexing'],
          projectIdea: 'End-to-end recruitment drive management system with RBAC authorization.',
          practiceTasks: ['Implement compound indexes for search queries', 'Write API integration tests'],
        },
        {
          id: 'ms-fs-4',
          title: 'Milestone 4: DevOps, Testing & Capstone Deployment',
          description: 'Docker containerization, GitHub Actions CI/CD, and live production deployment with public source code.',
          order: 4,
          estimatedWeeks: 3,
          completed: false,
          topics: ['Docker Multi-stage Builds', 'CI/CD Automation', 'System Design Primitives'],
          projectIdea: 'Production deployment of full-stack capstone project with working live demo.',
          practiceTasks: ['Configure GitHub Actions automated test runner', 'Create Docker Compose development environment'],
        },
      ];
    }

    // 5. Select relevant curated resources matching the curriculum
    const relevantResources = SEED_LEARNING_RESOURCES.slice(0, 5).map((r) => ({
      title: r.title,
      url: r.url,
      type: r.resourceType,
      provider: r.provider,
    }));

    // 6. Calculate skill gaps
    const targetRequiredSkills =
      normalizedRole.includes('backend')
        ? ['Node.js', 'SQL & Relational Design', 'Database Indexing & Query Optimization', 'Docker']
        : normalizedRole.includes('frontend')
        ? ['React', 'JavaScript', 'TypeScript', 'HTML5 & CSS3']
        : ['JavaScript', 'React', 'Node.js', 'SQL & Relational Design', 'Docker'];

    const skillGaps = targetRequiredSkills.map((req) => {
      const isVerified = verifiedSkills.some((vs) => vs.toLowerCase() === req.toLowerCase());
      const isDeclared = declaredSkills.some((ds) => ds.toLowerCase() === req.toLowerCase());

      return {
        skill: req,
        status: (isVerified
          ? 'ASSESSMENT_VERIFIED'
          : isDeclared
          ? 'SELF_DECLARED'
          : 'MISSING') as 'ASSESSMENT_VERIFIED' | 'SELF_DECLARED' | 'MISSING',
        importance: 'REQUIRED' as const,
      };
    });

    const isAiConnected = aiService.isRealProviderConnected();

    return {
      targetRole,
      currentSkillLevel,
      skillGaps,
      milestones,
      recommendedTopics,
      resourceReferences: relevantResources,
      estimatedDuration,
      progress: 0,
      status: 'ACTIVE',
      isAiGenerated: isAiConnected,
    };
  }
}
