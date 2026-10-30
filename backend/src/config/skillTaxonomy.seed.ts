import { SkillCategory, SkillDifficulty, QuestionType } from '../types/index.js';

export interface SeedSkill {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  relatedSkills: string[];
  difficultyLevel: SkillDifficulty;
  isActive: boolean;
}

export interface SeedAssessmentQuestion {
  id: string;
  questionText: string;
  questionType: QuestionType;
  codeSnippet?: string;
  options: { id: string; text: string }[];
  correctAnswers: string[];
  marks: number;
  negativeMarks?: number;
  explanation: string;
  skill: string;
}

export interface SeedAssessment {
  id: string;
  title: string;
  description: string;
  category: SkillCategory;
  skillsTested: string[];
  difficulty: SkillDifficulty;
  durationMinutes: number;
  passingPercentage: number;
  isActive: boolean;
  questions: SeedAssessmentQuestion[];
}

export const SEED_SKILLS: SeedSkill[] = [
  // 1. Programming Languages
  {
    id: 'javascript',
    name: 'JavaScript',
    category: 'Programming Languages',
    description: 'Core JavaScript language fundamentals, closures, asynchronous event loop, and modern ES6+ specifications.',
    relatedSkills: ['TypeScript', 'Node.js', 'React'],
    difficultyLevel: 'INTERMEDIATE',
    isActive: true,
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    category: 'Programming Languages',
    description: 'Typed superset of JavaScript providing static typing, generics, interfaces, and strict type checking.',
    relatedSkills: ['JavaScript', 'React', 'Node.js'],
    difficultyLevel: 'INTERMEDIATE',
    isActive: true,
  },
  {
    id: 'python',
    name: 'Python',
    category: 'Programming Languages',
    description: 'Python 3 programming, data structures, list comprehensions, object-oriented concepts, and package ecosystem.',
    relatedSkills: ['Machine Learning Basics', 'Data Analysis & Pandas', 'REST APIs'],
    difficultyLevel: 'BEGINNER',
    isActive: true,
  },
  {
    id: 'java',
    name: 'Java',
    category: 'Programming Languages',
    description: 'Java programming language, JVM internals, multithreading, collections framework, and OOP principles.',
    relatedSkills: ['Data Structures and Algorithms', 'Software Engineering'],
    difficultyLevel: 'INTERMEDIATE',
    isActive: true,
  },
  {
    id: 'cpp',
    name: 'C++',
    category: 'Programming Languages',
    description: 'C++ programming, pointers, memory management, STL containers, and low-level algorithmic design.',
    relatedSkills: ['Data Structures and Algorithms', 'Problem Solving'],
    difficultyLevel: 'ADVANCED',
    isActive: true,
  },

  // 2. Data Structures and Algorithms
  {
    id: 'arrays-and-strings',
    name: 'Arrays & Strings',
    category: 'Data Structures and Algorithms',
    description: 'Two-pointer techniques, sliding window patterns, prefix sums, and string manipulation algorithms.',
    relatedSkills: ['Problem Solving', 'Data Structures and Algorithms'],
    difficultyLevel: 'BEGINNER',
    isActive: true,
  },
  {
    id: 'trees-and-graphs',
    name: 'Trees & Graphs',
    category: 'Data Structures and Algorithms',
    description: 'Binary trees, BST traversal, BFS, DFS, Dijkstra, topological sort, and cycle detection.',
    relatedSkills: ['Data Structures and Algorithms', 'Algorithmic Thinking'],
    difficultyLevel: 'ADVANCED',
    isActive: true,
  },
  {
    id: 'dynamic-programming',
    name: 'Dynamic Programming',
    category: 'Data Structures and Algorithms',
    description: 'Memoization, tabulation, state transitions, subproblem breakdown, and optimization problems.',
    relatedSkills: ['Data Structures and Algorithms', 'Algorithmic Thinking'],
    difficultyLevel: 'ADVANCED',
    isActive: true,
  },
  {
    id: 'sorting-and-searching',
    name: 'Sorting & Searching',
    category: 'Data Structures and Algorithms',
    description: 'Binary search variations, merge sort, quick sort, heap sort, and time/space complexity analysis.',
    relatedSkills: ['Data Structures and Algorithms', 'Arrays & Strings'],
    difficultyLevel: 'INTERMEDIATE',
    isActive: true,
  },

  // 3. Web Development
  {
    id: 'react',
    name: 'React',
    category: 'Web Development',
    description: 'Declarative component architecture, hooks lifecycle, state management, synthetic events, and virtual DOM.',
    relatedSkills: ['JavaScript', 'TypeScript', 'HTML5 & CSS3'],
    difficultyLevel: 'INTERMEDIATE',
    isActive: true,
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    category: 'Web Development',
    description: 'Server-side JavaScript runtime, event loop, Streams, Buffer, modules, and Express middleware architecture.',
    relatedSkills: ['JavaScript', 'REST APIs', 'Web Application Security (OWASP Top 10)'],
    difficultyLevel: 'INTERMEDIATE',
    isActive: true,
  },
  {
    id: 'rest-apis',
    name: 'REST APIs',
    category: 'Web Development',
    description: 'HTTP methods, status codes, REST architectural constraints, idempotency, serialization, and API design.',
    relatedSkills: ['Node.js', 'Python', 'Web Application Security (OWASP Top 10)'],
    difficultyLevel: 'BEGINNER',
    isActive: true,
  },
  {
    id: 'html5-css3',
    name: 'HTML5 & CSS3',
    category: 'Web Development',
    description: 'Semantic markup, accessibility (a11y), responsive design, Flexbox, CSS Grid, and box model fundamentals.',
    relatedSkills: ['React', 'JavaScript'],
    difficultyLevel: 'BEGINNER',
    isActive: true,
  },

  // 4. Databases
  {
    id: 'sql-relational',
    name: 'SQL & Relational Design',
    category: 'Databases',
    description: 'Relational database schema modeling, ACID transactions, JOIN operations, aggregations, and normalization.',
    relatedSkills: ['Database Indexing & Query Optimization', 'Databases'],
    difficultyLevel: 'INTERMEDIATE',
    isActive: true,
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    category: 'Databases',
    description: 'Document database modeling, BSON data types, Mongoose schemas, and aggregation pipelines.',
    relatedSkills: ['Node.js', 'Databases'],
    difficultyLevel: 'BEGINNER',
    isActive: true,
  },
  {
    id: 'db-indexing-opt',
    name: 'Database Indexing & Query Optimization',
    category: 'Databases',
    description: 'B-Tree indexes, compound indexes, EXPLAIN query plans, execution bottlenecks, and table scan reduction.',
    relatedSkills: ['SQL & Relational Design', 'Databases'],
    difficultyLevel: 'ADVANCED',
    isActive: true,
  },

  // 5. Cloud Computing
  {
    id: 'docker',
    name: 'Docker',
    category: 'Cloud Computing',
    description: 'Containerization, Dockerfile optimization, multi-stage builds, container networking, and Docker Compose.',
    relatedSkills: ['Microservices Architecture', 'CI/CD Pipelines'],
    difficultyLevel: 'INTERMEDIATE',
    isActive: true,
  },
  {
    id: 'aws-basics',
    name: 'AWS Basics',
    category: 'Cloud Computing',
    description: 'Core Amazon Web Services including EC2, S3, IAM, VPC, and serverless compute primitives.',
    relatedSkills: ['Docker', 'Cloud Computing'],
    difficultyLevel: 'BEGINNER',
    isActive: true,
  },
  {
    id: 'microservices',
    name: 'Microservices Architecture',
    category: 'Cloud Computing',
    description: 'Decoupled services, event-driven messaging, circuit breakers, service discovery, and resilient APIs.',
    relatedSkills: ['Docker', 'REST APIs', 'Software Engineering'],
    difficultyLevel: 'ADVANCED',
    isActive: true,
  },
  {
    id: 'ci-cd',
    name: 'CI/CD Pipelines',
    category: 'Cloud Computing',
    description: 'Continuous integration, automated build/test pipelines, deployment stages, and release management.',
    relatedSkills: ['Git & Version Control', 'Docker'],
    difficultyLevel: 'INTERMEDIATE',
    isActive: true,
  },

  // 6. AI and Machine Learning
  {
    id: 'ml-basics',
    name: 'Machine Learning Basics',
    category: 'AI and Machine Learning',
    description: 'Supervised vs unsupervised learning, regression, classification, overfitting, evaluation metrics (F1, precision, recall).',
    relatedSkills: ['Python', 'Data Analysis & Pandas'],
    difficultyLevel: 'BEGINNER',
    isActive: true,
  },
  {
    id: 'nlp-fundamentals',
    name: 'NLP Fundamentals',
    category: 'AI and Machine Learning',
    description: 'Text preprocessing, tokenization, embeddings, vector similarity, and LLM prompting/fine-tuning basics.',
    relatedSkills: ['Python', 'Machine Learning Basics'],
    difficultyLevel: 'INTERMEDIATE',
    isActive: true,
  },
  {
    id: 'pandas-data-analysis',
    name: 'Data Analysis & Pandas',
    category: 'AI and Machine Learning',
    description: 'DataFrames, Series, filtering, grouping, merging, data cleaning, and exploratory data analysis with Pandas.',
    relatedSkills: ['Python', 'Machine Learning Basics'],
    difficultyLevel: 'BEGINNER',
    isActive: true,
  },

  // 7. Cybersecurity
  {
    id: 'owasp-top-10',
    name: 'Web Application Security (OWASP Top 10)',
    category: 'Cybersecurity',
    description: 'SQL Injection, XSS, CSRF, broken access control, security headers, input sanitization, and security audits.',
    relatedSkills: ['Authentication & Authorization', 'Web Development'],
    difficultyLevel: 'INTERMEDIATE',
    isActive: true,
  },
  {
    id: 'auth-security',
    name: 'Authentication & Authorization',
    category: 'Cybersecurity',
    description: 'JWT tokens, bcrypt hashing, HttpOnly cookies, session management, RBAC, and OAuth2 security flows.',
    relatedSkills: ['Web Application Security (OWASP Top 10)', 'Node.js'],
    difficultyLevel: 'INTERMEDIATE',
    isActive: true,
  },

  // 8. Software Engineering
  {
    id: 'git-vcs',
    name: 'Git & Version Control',
    category: 'Software Engineering',
    description: 'Branches, rebasing, merge conflicts, pull requests, conventional commits, and collaborative workflows.',
    relatedSkills: ['Software Engineering', 'CI/CD Pipelines'],
    difficultyLevel: 'BEGINNER',
    isActive: true,
  },
  {
    id: 'clean-code-testing',
    name: 'Clean Code & Unit Testing',
    category: 'Software Engineering',
    description: 'SOLID principles, DRY, code smells, test-driven development, Vitest/Jest unit testing, and code coverage.',
    relatedSkills: ['Software Engineering', 'System Design Basics'],
    difficultyLevel: 'INTERMEDIATE',
    isActive: true,
  },
  {
    id: 'system-design',
    name: 'System Design Basics',
    category: 'Software Engineering',
    description: 'Horizontal vs vertical scaling, load balancing, caching (Redis), CDNs, and database partitioning.',
    relatedSkills: ['Microservices Architecture', 'Databases'],
    difficultyLevel: 'ADVANCED',
    isActive: true,
  },

  // 9. Communication
  {
    id: 'tech-docs',
    name: 'Technical Documentation',
    category: 'Communication',
    description: 'Writing clear READMEs, API specifications (OpenAPI), architecture decision records (ADRs), and release notes.',
    relatedSkills: ['Workplace Communication & Collaboration'],
    difficultyLevel: 'BEGINNER',
    isActive: true,
  },
  {
    id: 'workplace-collab',
    name: 'Workplace Communication & Collaboration',
    category: 'Communication',
    description: 'Cross-functional engineering communication, asynchronous sprint updates, code review etiquette, and clarity.',
    relatedSkills: ['Technical Documentation'],
    difficultyLevel: 'BEGINNER',
    isActive: true,
  },

  // 10. Problem Solving
  {
    id: 'algorithmic-thinking',
    name: 'Algorithmic Thinking',
    category: 'Problem Solving',
    description: 'Decomposing complex business challenges into mathematical logic, edge-case analysis, and complexity trade-offs.',
    relatedSkills: ['Problem Solving', 'Data Structures and Algorithms'],
    difficultyLevel: 'INTERMEDIATE',
    isActive: true,
  },
  {
    id: 'debugging-troubleshooting',
    name: 'Analytical Reasoning & Debugging',
    category: 'Problem Solving',
    description: 'Systematic root-cause identification, log tracing, stack trace debugging, reproduction scripts, and defensive coding.',
    relatedSkills: ['Clean Code & Unit Testing', 'Algorithmic Thinking'],
    difficultyLevel: 'INTERMEDIATE',
    isActive: true,
  },
];

export const SEED_ASSESSMENTS: SeedAssessment[] = [
  // 1. JavaScript & Web Development Assessment
  {
    id: 'asm-js-web-dev',
    title: 'Full-Stack JavaScript & Web Development Assessment',
    description: 'Evaluate core JavaScript mechanics, asynchronous promise lifecycles, React components, and secure REST API design.',
    category: 'Web Development',
    skillsTested: ['JavaScript', 'React', 'Node.js', 'REST APIs', 'TypeScript'],
    difficulty: 'INTERMEDIATE',
    durationMinutes: 25,
    passingPercentage: 65,
    isActive: true,
    questions: [
      {
        id: 'q1-js-eventloop',
        questionText: 'What is the exact execution order of the console.log statements in the following asynchronous snippet?',
        questionType: 'OUTPUT_PREDICTION',
        codeSnippet: `console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');`,
        options: [
          { id: 'opt-a', text: '1, 2, 3, 4' },
          { id: 'opt-b', text: '1, 4, 3, 2' },
          { id: 'opt-c', text: '1, 4, 2, 3' },
          { id: 'opt-d', text: '3, 1, 4, 2' },
        ],
        correctAnswers: ['opt-b'],
        marks: 4,
        negativeMarks: 1,
        explanation: 'Synchronous statements run first ("1", "4"). Microtasks (Promise.then) run immediately after synchronous execution ("3"), followed by macrotasks (setTimeout) in the event loop ("2").',
        skill: 'JavaScript',
      },
      {
        id: 'q2-react-hooks',
        questionText: 'Which statements regarding React hooks rules and behavior are correct? (Select all that apply)',
        questionType: 'MULTIPLE_SELECT',
        options: [
          { id: 'opt-a', text: 'Hooks must only be called at the top level of function components or custom hooks.' },
          { id: 'opt-b', text: 'Hooks can be safely invoked inside conditional if-blocks if the condition never changes.' },
          { id: 'opt-c', text: 'useEffect cleanup functions run before the component unmounts and before rerunning the effect on dependency change.' },
          { id: 'opt-d', text: 'useCallback returns a memoized callback that only changes if one of the dependencies has updated.' },
        ],
        correctAnswers: ['opt-a', 'opt-c', 'opt-d'],
        marks: 5,
        negativeMarks: 1,
        explanation: 'React hooks rely on deterministic call order and MUST NOT be called inside conditionals, loops, or nested functions (Rules of Hooks).',
        skill: 'React',
      },
      {
        id: 'q3-rest-idempotency',
        questionText: 'According to the HTTP/1.1 specification (RFC 7231), which of the following HTTP methods are idempotent by definition? (Select all that apply)',
        questionType: 'MULTIPLE_SELECT',
        options: [
          { id: 'opt-a', text: 'GET' },
          { id: 'opt-b', text: 'POST' },
          { id: 'opt-c', text: 'PUT' },
          { id: 'opt-d', text: 'DELETE' },
        ],
        correctAnswers: ['opt-a', 'opt-c', 'opt-d'],
        marks: 4,
        negativeMarks: 1,
        explanation: 'GET, PUT, and DELETE are idempotent (executing them multiple times produces the same server state). POST creates a new resource on each execution and is not idempotent.',
        skill: 'REST APIs',
      },
      {
        id: 'q4-node-debugging',
        questionText: 'Identify the bug in this Express error-handling middleware that prevents the response from being sent:',
        questionType: 'DEBUGGING',
        codeSnippet: `// Express error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
  next();
});`,
        options: [
          { id: 'opt-a', text: 'Calling next() after res.json() risks headers-already-sent errors or double response dispatch.' },
          { id: 'opt-b', text: 'Express error middleware requires only 3 arguments (err, req, res).' },
          { id: 'opt-c', text: 'status(500) is invalid syntax in Express 4/5.' },
          { id: 'opt-d', text: 'res.json() does not accept plain JavaScript objects.' },
        ],
        correctAnswers: ['opt-a'],
        marks: 4,
        negativeMarks: 1,
        explanation: 'Error-handling middleware should terminate the request cycle by sending the response. Calling next() afterward invokes subsequent handlers which will attempt to modify an already finished response.',
        skill: 'Node.js',
      },
      {
        id: 'q5-ts-conceptual',
        questionText: 'In TypeScript, what is the core semantic difference between the "unknown" type and the "any" type?',
        questionType: 'CONCEPTUAL',
        options: [
          { id: 'opt-a', text: '"unknown" completely disables type checking, whereas "any" enforces runtime assertions.' },
          { id: 'opt-b', text: '"unknown" is the type-safe counterpart of "any"; operations cannot be performed on "unknown" without explicit narrowing or type casting.' },
          { id: 'opt-c', text: '"unknown" can only hold primitive values, while "any" can hold objects and functions.' },
          { id: 'opt-d', text: 'There is no difference; "unknown" is simply an alias for "any".' },
        ],
        correctAnswers: ['opt-b'],
        marks: 3,
        negativeMarks: 0,
        explanation: '"unknown" requires type guards or assertions before invoking methods or passing it to typed parameters, preserving compile-time type safety.',
        skill: 'TypeScript',
      },
    ],
  },

  // 2. Data Structures & Algorithmic Problem Solving Assessment
  {
    id: 'asm-dsa-algorithms',
    title: 'Data Structures & Algorithmic Problem Solving Assessment',
    description: 'Test your understanding of array manipulation, binary search, graph traversals, and dynamic programming.',
    category: 'Data Structures and Algorithms',
    skillsTested: ['Arrays & Strings', 'Trees & Graphs', 'Dynamic Programming', 'Sorting & Searching', 'Algorithmic Thinking'],
    difficulty: 'ADVANCED',
    durationMinutes: 30,
    passingPercentage: 60,
    isActive: true,
    questions: [
      {
        id: 'q1-binary-search-complexity',
        questionText: 'What is the worst-case time complexity of binary search on a sorted array of size N?',
        questionType: 'MCQ',
        options: [
          { id: 'opt-a', text: 'O(1)' },
          { id: 'opt-b', text: 'O(log N)' },
          { id: 'opt-c', text: 'O(N)' },
          { id: 'opt-d', text: 'O(N log N)' },
        ],
        correctAnswers: ['opt-b'],
        marks: 3,
        negativeMarks: 1,
        explanation: 'Binary search halves the search space at each iteration, yielding logarithmic time complexity O(log N).',
        skill: 'Sorting & Searching',
      },
      {
        id: 'q2-tree-traversal-output',
        questionText: 'Given a Binary Search Tree with root 10, left child 5, right child 15, left-of-5 2, and right-of-5 7. What is the In-Order traversal output?',
        questionType: 'OUTPUT_PREDICTION',
        options: [
          { id: 'opt-a', text: '10, 5, 2, 7, 15' },
          { id: 'opt-b', text: '2, 5, 7, 10, 15' },
          { id: 'opt-c', text: '2, 7, 5, 15, 10' },
          { id: 'opt-d', text: '15, 10, 7, 5, 2' },
        ],
        correctAnswers: ['opt-b'],
        marks: 4,
        negativeMarks: 1,
        explanation: 'In-order traversal (Left, Root, Right) of any valid Binary Search Tree always yields keys in strictly ascending sorted order.',
        skill: 'Trees & Graphs',
      },
      {
        id: 'q3-dp-coinchange',
        questionText: 'Which statements about the classic 0/1 Knapsack and Unbounded Coin Change dynamic programming problems are TRUE? (Select all that apply)',
        questionType: 'MULTIPLE_SELECT',
        options: [
          { id: 'opt-a', text: '0/1 Knapsack items can each be taken at most once, meaning subproblems iterate through items and remaining capacity.' },
          { id: 'opt-b', text: 'Greedy algorithms always yield the optimal solution for arbitrary coin denominations.' },
          { id: 'opt-c', text: 'Top-down memoization and bottom-up tabulation have identical asymptotic time complexity for these problems.' },
          { id: 'opt-d', text: 'The space complexity of 0/1 Knapsack can be optimized to O(Capacity) using a 1D array traversed backwards.' },
        ],
        correctAnswers: ['opt-a', 'opt-c', 'opt-d'],
        marks: 5,
        negativeMarks: 1,
        explanation: 'Greedy fails for arbitrary coin systems (e.g. coins [1, 3, 4] for amount 6 yields greedy 4+1+1=3 coins, but optimal is 3+3=2 coins).',
        skill: 'Dynamic Programming',
      },
      {
        id: 'q4-sliding-window-debugging',
        questionText: 'Identify the bug causing an infinite loop in this sliding window implementation finding minimum subarray length with sum >= target:',
        questionType: 'DEBUGGING',
        codeSnippet: `function minSubArrayLen(target, nums) {
  let left = 0, currentSum = 0, minLen = Infinity;
  for (let right = 0; right < nums.length; right++) {
    currentSum += nums[right];
    while (currentSum >= target) {
      minLen = Math.min(minLen, right - left + 1);
      // BUGGY LINE MISSING
      currentSum -= nums[left];
    }
  }
  return minLen === Infinity ? 0 : minLen;
}`,
        options: [
          { id: 'opt-a', text: 'The pointer "left" is never incremented (left++), resulting in an infinite while loop when currentSum >= target.' },
          { id: 'opt-b', text: 'minLen should be initialized to 0 instead of Infinity.' },
          { id: 'opt-c', text: 'right should iterate backwards from nums.length - 1.' },
          { id: 'opt-d', text: 'currentSum should be multiplied by nums[right].' },
        ],
        correctAnswers: ['opt-a'],
        marks: 4,
        negativeMarks: 1,
        explanation: 'Without advancing left (left++), nums[left] is repeatedly subtracted without shrinking the window, causing an infinite loop when nums contains zeros or positive values.',
        skill: 'Arrays & Strings',
      },
      {
        id: 'q5-dsa-graph-conceptual',
        questionText: 'Which graph algorithm is most suitable for finding the shortest path from a single source to all vertices in a weighted graph with non-negative edge weights?',
        questionType: 'CONCEPTUAL',
        options: [
          { id: 'opt-a', text: "Dijkstra's Algorithm" },
          { id: 'opt-b', text: 'Depth First Search (DFS)' },
          { id: 'opt-c', text: "Kruskal's Algorithm" },
          { id: 'opt-d', text: 'Floyd-Warshall Algorithm' },
        ],
        correctAnswers: ['opt-a'],
        marks: 4,
        negativeMarks: 0,
        explanation: "Dijkstra's algorithm efficiently computes single-source shortest paths on non-negative weighted graphs with O((V + E) log V) complexity using a priority queue.",
        skill: 'Trees & Graphs',
      },
    ],
  },

  // 3. Database Systems, SQL & Query Optimization
  {
    id: 'asm-db-sql',
    title: 'Database Architecture, SQL & Query Optimization',
    description: 'Assess schema design, ACID transactions, complex SQL queries, index structures, and query execution plans.',
    category: 'Databases',
    skillsTested: ['SQL & Relational Design', 'MongoDB', 'Database Indexing & Query Optimization'],
    difficulty: 'INTERMEDIATE',
    durationMinutes: 20,
    passingPercentage: 65,
    isActive: true,
    questions: [
      {
        id: 'q1-acid-isolation',
        questionText: 'In ACID transaction semantics, which anomaly occurs when a transaction reads data that has been modified by another concurrent uncommitted transaction?',
        questionType: 'MCQ',
        options: [
          { id: 'opt-a', text: 'Dirty Read' },
          { id: 'opt-b', text: 'Non-repeatable Read' },
          { id: 'opt-c', text: 'Phantom Read' },
          { id: 'opt-d', text: 'Lost Update' },
        ],
        correctAnswers: ['opt-a'],
        marks: 3,
        negativeMarks: 1,
        explanation: 'A Dirty Read happens when transaction T1 reads uncommitted modifications made by T2. If T2 later rolls back, T1 processed invalid state.',
        skill: 'SQL & Relational Design',
      },
      {
        id: 'q2-indexing-compound',
        questionText: 'Suppose you have a B-Tree compound index on columns (department_id, salary, hire_date). Which of the following WHERE clauses can effectively use this index? (Select all that apply)',
        questionType: 'MULTIPLE_SELECT',
        options: [
          { id: 'opt-a', text: 'WHERE department_id = 10 AND salary > 50000' },
          { id: 'opt-b', text: 'WHERE salary > 50000 AND hire_date > "2024-01-01"' },
          { id: 'opt-c', text: 'WHERE department_id = 5' },
          { id: 'opt-d', text: 'WHERE department_id = 12 AND salary = 80000 AND hire_date = "2023-05-15"' },
        ],
        correctAnswers: ['opt-a', 'opt-c', 'opt-d'],
        marks: 5,
        negativeMarks: 1,
        explanation: 'Compound indexes follow the Leftmost Prefix Rule. Queries without the leading column (department_id) cannot perform an index range scan and require a table scan.',
        skill: 'Database Indexing & Query Optimization',
      },
      {
        id: 'q3-sql-group-by',
        questionText: 'What is the result of the following SQL query when the Orders table contains 3 orders for customer 101 ($100, $200, NULL)?',
        questionType: 'OUTPUT_PREDICTION',
        codeSnippet: `SELECT customer_id, COUNT(*), COUNT(amount), SUM(amount)
FROM Orders
WHERE customer_id = 101
GROUP BY customer_id;`,
        options: [
          { id: 'opt-a', text: 'customer_id: 101, COUNT(*): 3, COUNT(amount): 2, SUM(amount): 300' },
          { id: 'opt-b', text: 'customer_id: 101, COUNT(*): 2, COUNT(amount): 2, SUM(amount): 300' },
          { id: 'opt-c', text: 'customer_id: 101, COUNT(*): 3, COUNT(amount): 3, SUM(amount): NULL' },
          { id: 'opt-d', text: 'Query throws a syntax error on NULL handling' },
        ],
        correctAnswers: ['opt-a'],
        marks: 4,
        negativeMarks: 1,
        explanation: 'COUNT(*) counts all rows including NULLs (3 rows). Aggregate functions like COUNT(column) and SUM(column) ignore NULL values (2 non-null amounts, sum=300).',
        skill: 'SQL & Relational Design',
      },
      {
        id: 'q4-mongo-modeling-debugging',
        questionText: 'Identify the schema antipattern in this Mongoose model for an e-commerce platform expecting millions of reviews:',
        questionType: 'DEBUGGING',
        codeSnippet: `const ProductSchema = new mongoose.Schema({
  title: String,
  price: Number,
  reviews: [{
    userId: mongoose.Schema.Types.ObjectId,
    rating: Number,
    comment: String,
    createdAt: Date
  }]
});`,
        options: [
          { id: 'opt-a', text: 'Unbounded embedded array: embedding millions of reviews will exceed MongoDB’s 16MB BSON document size limit.' },
          { id: 'opt-b', text: 'ProductSchema cannot have ObjectId types inside array definitions.' },
          { id: 'opt-c', text: 'Mongoose requires all embedded subdocuments to have their own separate connection.' },
          { id: 'opt-d', text: 'reviews must always be stored in Redis instead of MongoDB.' },
        ],
        correctAnswers: ['opt-a'],
        marks: 4,
        negativeMarks: 1,
        explanation: 'Embedding high-volume, continuously growing subdocuments (reviews) leads to the Unbounded Array antipattern and document growth exceeding 16MB. A 1-to-N reference pattern should be used.',
        skill: 'MongoDB',
      },
    ],
  },

  // 4. Cloud Computing, Containers & DevOps
  {
    id: 'asm-cloud-devops',
    title: 'Cloud Fundamentals, Docker & DevOps Architecture',
    description: 'Verify your proficiency in Docker containerization, cloud primitives, microservices resiliency, and CI/CD automation.',
    category: 'Cloud Computing',
    skillsTested: ['Docker', 'AWS Basics', 'Microservices Architecture', 'CI/CD Pipelines'],
    difficulty: 'INTERMEDIATE',
    durationMinutes: 20,
    passingPercentage: 60,
    isActive: true,
    questions: [
      {
        id: 'q1-docker-layers',
        questionText: 'Why should package installation commands (`RUN npm ci` or `pip install`) be placed before copying the application source code (`COPY . .`) in a Dockerfile?',
        questionType: 'CONCEPTUAL',
        options: [
          { id: 'opt-a', text: 'To maximize Docker layer cache hits so dependencies are not reinstalled when only source files change.' },
          { id: 'opt-b', text: 'Because Docker will not allow npm to access files copied before it.' },
          { id: 'opt-c', text: 'To compress the resulting image into a single binary layer.' },
          { id: 'opt-d', text: 'Package managers fail if source code files already exist in the container.' },
        ],
        correctAnswers: ['opt-a'],
        marks: 4,
        negativeMarks: 0,
        explanation: 'Docker caches layers based on instruction hash and file contents. Copying package manifests first allows dependency layers to remain cached unless dependencies change.',
        skill: 'Docker',
      },
      {
        id: 'q2-microservices-patterns',
        questionText: 'Which architectural patterns are commonly employed to maintain resilience and data consistency across distributed microservices? (Select all that apply)',
        questionType: 'MULTIPLE_SELECT',
        options: [
          { id: 'opt-a', text: 'Circuit Breaker Pattern to fail fast and prevent cascading system outages.' },
          { id: 'opt-b', text: 'Saga Pattern for managing distributed transactions across independent service databases.' },
          { id: 'opt-c', text: 'API Gateway Pattern to route, authenticate, and throttle incoming client traffic.' },
          { id: 'opt-d', text: 'Global 2-Phase Commit across all services over HTTP without local fallbacks.' },
        ],
        correctAnswers: ['opt-a', 'opt-b', 'opt-c'],
        marks: 5,
        negativeMarks: 1,
        explanation: 'Distributed 2PC over HTTP is brittle, blocking, and an anti-pattern in modern microservices; Sagas with compensating actions are preferred.',
        skill: 'Microservices Architecture',
      },
      {
        id: 'q3-cicd-debugging',
        questionText: 'What is the defect in this GitHub Actions CI pipeline step for a production deploy?',
        questionType: 'DEBUGGING',
        codeSnippet: `- name: Run Tests and Deploy
  run: |
    npm test
    npm run build
    npm run deploy --env=production
  continue-on-error: true`,
        options: [
          { id: 'opt-a', text: '"continue-on-error: true" causes the deployment to proceed even if unit tests or build fail, pushing broken code to production.' },
          { id: 'opt-b', text: 'GitHub Actions does not support multi-line run scripts with pipe (|).' },
          { id: 'opt-c', text: 'npm test cannot be run on a CI runner.' },
          { id: 'opt-d', text: 'The step name is too descriptive.' },
        ],
        correctAnswers: ['opt-a'],
        marks: 4,
        negativeMarks: 1,
        explanation: 'Setting continue-on-error: true on a build/test step allows failing test runs to bypass the gate and trigger production deployment.',
        skill: 'CI/CD Pipelines',
      },
    ],
  },
];
