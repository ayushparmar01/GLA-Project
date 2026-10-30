import { MetricDefinition } from '../types/index.js';

export class MetricsDefinitionService {
  private static definitions: Record<string, MetricDefinition> = {
    TOTAL_APPLICATIONS: {
      key: 'TOTAL_APPLICATIONS',
      name: 'Total Applications Submitted',
      description: 'Count of all job application records created within the selected scope and date period.',
      formula: 'Count of all PlacementApplication records matching scope and appliedAt >= periodStart and appliedAt <= periodEnd.',
      sourceEntities: ['PlacementApplication'],
      countingUnit: 'Applications (may include multiple per student)',
      limitations: 'Does not reflect unique students; one student submitting 3 applications contributes 3 to this metric.',
    },
    UNIQUE_APPLICANTS: {
      key: 'UNIQUE_APPLICANTS',
      name: 'Unique Student Applicants',
      description: 'Distinct student accounts that submitted at least one job application in the period.',
      formula: 'Count of distinct studentId values in PlacementApplication records within period.',
      sourceEntities: ['PlacementApplication', 'User'],
      countingUnit: 'Unique Students',
      limitations: 'Students who only browsed or saved jobs without submitting an application are excluded.',
    },
    SHORTLISTED_APPLICATIONS: {
      key: 'SHORTLISTED_APPLICATIONS',
      name: 'Shortlisted Applications',
      description: 'Applications that advanced past initial resume screening into employer shortlist.',
      formula: "Count of PlacementApplication records where status in ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED'].",
      sourceEntities: ['PlacementApplication'],
      countingUnit: 'Applications',
      limitations: 'Does not indicate a job offer; only indicates qualification for interview rounds.',
    },
    VERIFIED_SELECTIONS: {
      key: 'VERIFIED_SELECTIONS',
      name: 'Verified Final Selections',
      description: 'Confirmed job placements with verified final selection outcome recorded on the platform.',
      formula: "Count of PlacementApplication records where status === 'SELECTED'.",
      sourceEntities: ['PlacementApplication'],
      countingUnit: 'Verified Selections (Offers)',
      limitations: 'Strictly excludes shortlisted candidates or verbal assurances without verified status.',
    },
    PLACEMENT_CONVERSION_RATE: {
      key: 'PLACEMENT_CONVERSION_RATE',
      name: 'Placement Conversion Rate',
      description: 'Percentage of unique participating student applicants who secured verified job selections.',
      formula: '(Unique Selected Students / Unique Applied Students) * 100.',
      sourceEntities: ['PlacementApplication'],
      countingUnit: 'Percentage (%)',
      limitations: 'Evaluates only participating students who submitted applications; does not divide by total enrolled class size.',
    },
    DAILY_ACTIVE_STUDENTS: {
      key: 'DAILY_ACTIVE_STUDENTS',
      name: 'Daily Active Students (DAS)',
      description: 'Distinct students engaging in substantive learning, assessment, application, or interview activity in the past 24 hours.',
      formula: 'Count of distinct studentIds with Qualifying Events within the last 24 hours.',
      sourceEntities: ['AnalyticsEvent', 'PlacementApplication', 'AssessmentAttempt', 'ModuleProgress'],
      countingUnit: 'Unique Students',
      limitations: 'Passive page refreshes or background health probes are filtered out.',
    },
    LEARNING_PATH_COMPLETION_RATE: {
      key: 'LEARNING_PATH_COMPLETION_RATE',
      name: 'Learning Path Completion Rate',
      description: 'Percentage of students enrolled in structured paths who successfully completed all required modules.',
      formula: "(Completed Enrollments [status === 'COMPLETED'] / Total Enrollments) * 100.",
      sourceEntities: ['LearningEnrollment'],
      countingUnit: 'Percentage (%)',
      limitations: 'Requires students to complete all sequential required modules and pass knowledge checks.',
    },
    SKILL_GAP_COUNT: {
      key: 'SKILL_GAP_COUNT',
      name: 'Missing Skill Frequency',
      description: 'Count of students identified as needing improvement in a specific technical skill based on assessment scores or ATS resume gap analysis.',
      formula: 'Count of distinct students scoring < 60% on skill assessment or with skill flagged as missing on target job ATS analysis.',
      sourceEntities: ['AssessmentAttempt', 'AtsAnalysisResult', 'User'],
      countingUnit: 'Students Requiring Remediation',
      limitations: 'Unassessed skills are classified as NOT_ASSESSED and excluded from missing calculations until audited.',
    },
  };

  public static getDefinition(key: string): MetricDefinition | undefined {
    return this.definitions[key];
  }

  public static getAllDefinitions(): MetricDefinition[] {
    return Object.values(this.definitions);
  }
}
