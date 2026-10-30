import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import cohortRoutes from './cohort.routes.js';
import placementDriveRoutes from './placementDrive.routes.js';
import applicationRoutes from './application.routes.js';
import collegeStatsRoutes from './collegeStats.routes.js';
import employerRoutes from './employer.routes.js';
import skillRoutes from './skill.routes.js';
import assessmentRoutes from './assessment.routes.js';
import { studentCareerRoutes } from './studentCareer.routes.js';
import aiGuidanceRoutes from './aiGuidance.routes.js';
import learningRoadmapRoutes from './learningRoadmap.routes.js';
import learningResourceRoutes from './learningResource.routes.js';
import notificationRoutes from './notification.routes.js';
import careerEventRoutes from './careerEvent.routes.js';
import announcementRoutes from './announcement.routes.js';
import adminRoutes from './admin.routes.js';
import whatsappRoutes from './whatsapp.routes.js';
import recommendationRoutes from './recommendation.routes.js';
import mockInterviewRoutes from './mockInterview.routes.js';
import resumeAnalyzerRoutes from './resumeAnalyzer.routes.js';
import mentorshipRoutes from './mentorship.routes.js';
import learningHubRoutes from './learningHub.routes.js';
import analyticsRoutes from './analytics.routes.js';
import { listCohorts } from '../controllers/cohort.controller.js';
import { listMyApplications } from '../controllers/application.controller.js';
import {
  listPublicOpportunities,
  getPublicOpportunityById,
} from '../controllers/employerOpportunity.controller.js';
import {
  listCollegeConnections,
  respondToConnection,
  blockConnection,
} from '../controllers/collegeConnection.controller.js';
import { listStudentInterviews } from '../controllers/interview.controller.js';
import { authenticate, authorizeRole } from '../middlewares/auth.js';

const apiRouter = Router();

// Root API information endpoint
apiRouter.get('/', (req, res) => {
  res.json({
    name: 'CareerBridge API',
    tagline: 'Bridging Career Opportunities for Tier-2/3 Colleges with No Placement Cell',
    version: '0.19.0',
    phase: 'Phase 19: Advanced Security, Performance & Scalability',
    documentation: '/api/health',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
      },
      employers: {
        profile: {
          create: 'POST /api/employers/profile',
          getMe: 'GET /api/employers/profile/me',
          updateMe: 'PATCH /api/employers/profile/me',
          getPublic: 'GET /api/employers/:employerId',
          verify: 'PATCH /api/employers/:employerId/verify',
        },
        dashboard: 'GET /api/employers/dashboard',
        opportunities: {
          create: 'POST /api/employers/opportunities',
          list: 'GET /api/employers/opportunities',
          getById: 'GET /api/employers/opportunities/:driveId',
          update: 'PATCH /api/employers/opportunities/:driveId',
          publish: 'POST /api/employers/opportunities/:driveId/publish',
          close: 'POST /api/employers/opportunities/:driveId/close',
          cancel: 'POST /api/employers/opportunities/:driveId/cancel',
        },
        connections: {
          create: 'POST /api/employers/connections',
          listOutgoing: 'GET /api/employers/connections',
        },
        applications: {
          listAll: 'GET /api/employers/applications',
          listByDrive: 'GET /api/employers/opportunities/:driveId/applications',
          getById: 'GET /api/employers/applications/:applicationId',
          updateStatus: 'PATCH /api/employers/applications/:applicationId/status',
        },
        interviews: {
          schedule: 'POST /api/employers/applications/:applicationId/interviews',
          list: 'GET /api/employers/interviews',
          update: 'PATCH /api/employers/interviews/:interviewId',
          cancel: 'POST /api/employers/interviews/:interviewId/cancel',
        },
      },
      publicOpportunities: {
        list: 'GET /api/opportunities',
        getById: 'GET /api/opportunities/:driveId',
      },
      colleges: {
        connections: {
          listIncoming: 'GET /api/colleges/:collegeId/connections',
          respond: 'PATCH /api/connections/:connectionId/respond',
          block: 'POST /api/connections/:connectionId/block',
        },
      },
      students: {
        interviews: 'GET /api/students/me/interviews',
      },
    },
  });
});

// Mount modular sub-routers
apiRouter.use('/', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/cohorts', cohortRoutes);
apiRouter.use('/placement-drives', placementDriveRoutes);
apiRouter.use('/applications', applicationRoutes);
apiRouter.use('/college', collegeStatsRoutes);
apiRouter.use('/employers', employerRoutes);
apiRouter.use('/skills', skillRoutes);
apiRouter.use('/assessments', assessmentRoutes);
apiRouter.use('/ai', aiGuidanceRoutes);
apiRouter.use('/learning-resources', learningResourceRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/events', careerEventRoutes);
apiRouter.use('/announcements', announcementRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/whatsapp', whatsappRoutes);
apiRouter.use('/recommendations', recommendationRoutes);
apiRouter.use('/interviews', mockInterviewRoutes);
apiRouter.use('/resume-analyzer', resumeAnalyzerRoutes);
apiRouter.use('/mentorship', mentorshipRoutes);
apiRouter.use('/learning', learningHubRoutes);
apiRouter.use('/analytics', analyticsRoutes);

// Public Opportunities
apiRouter.get('/opportunities', listPublicOpportunities);
apiRouter.get('/opportunities/:driveId', getPublicOpportunityById);

// College Connection endpoints
apiRouter.get('/colleges/:collegeId/connections', authenticate, authorizeRole('COLLEGE'), listCollegeConnections);
apiRouter.patch('/connections/:connectionId/respond', authenticate, authorizeRole('COLLEGE'), respondToConnection);
apiRouter.post('/connections/:connectionId/block', authenticate, authorizeRole('COLLEGE'), blockConnection);

// Student endpoints
apiRouter.get('/students/me/cohorts', authenticate, authorizeRole('STUDENT'), listCohorts);
apiRouter.get('/students/me/applications', authenticate, authorizeRole('STUDENT'), listMyApplications);
apiRouter.get('/students/me/interviews', authenticate, authorizeRole('STUDENT'), listStudentInterviews);
apiRouter.use('/students/me/roadmaps', learningRoadmapRoutes);
apiRouter.use('/students/me', authenticate, authorizeRole('STUDENT'), studentCareerRoutes);

export default apiRouter;
