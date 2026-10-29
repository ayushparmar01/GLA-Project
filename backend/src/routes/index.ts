import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import cohortRoutes from './cohort.routes.js';
import placementDriveRoutes from './placementDrive.routes.js';
import applicationRoutes from './application.routes.js';
import collegeStatsRoutes from './collegeStats.routes.js';
import { listCohorts } from '../controllers/cohort.controller.js';
import { listMyApplications } from '../controllers/application.controller.js';
import { authenticate, authorizeRole } from '../middlewares/auth.js';

const apiRouter = Router();

// Root API information endpoint
apiRouter.get('/', (req, res) => {
  res.json({
    name: 'CareerBridge API',
    tagline: 'Bridging Career Opportunities for Tier-2/3 Colleges with No Placement Cell',
    version: '0.3.0',
    phase: 'Phase 3: Automated Placement Cell & Cohort Management',
    documentation: '/api/health',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
      },
      users: {
        getProfile: 'GET /api/users/me',
        updateProfile: 'PATCH /api/users/me',
      },
      cohorts: {
        list: 'GET /api/cohorts',
        create: 'POST /api/cohorts',
        getById: 'GET /api/cohorts/:cohortId',
        update: 'PATCH /api/cohorts/:cohortId',
        archive: 'POST /api/cohorts/:cohortId/archive',
        listStudents: 'GET /api/cohorts/:cohortId/students',
        enrollStudent: 'POST /api/cohorts/:cohortId/students',
        removeStudent: 'DELETE /api/cohorts/:cohortId/students/:studentId',
      },
      placementDrives: {
        list: 'GET /api/placement-drives',
        create: 'POST /api/placement-drives',
        getById: 'GET /api/placement-drives/:driveId',
        update: 'PATCH /api/placement-drives/:driveId',
        publish: 'POST /api/placement-drives/:driveId/publish',
        close: 'POST /api/placement-drives/:driveId/close',
        cancel: 'POST /api/placement-drives/:driveId/cancel',
        checkEligibility: 'GET /api/placement-drives/:driveId/eligibility',
        apply: 'POST /api/placement-drives/:driveId/apply',
        listApplications: 'GET /api/placement-drives/:driveId/applications',
      },
      applications: {
        myApplications: 'GET /api/applications/me',
        updateStatus: 'PATCH /api/applications/:applicationId/status',
        withdraw: 'POST /api/applications/:applicationId/withdraw',
      },
      college: {
        stats: 'GET /api/college/stats',
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

// Spec convenience aliases
apiRouter.get('/students/me/cohorts', authenticate, authorizeRole('STUDENT'), listCohorts);
apiRouter.get('/students/me/applications', authenticate, authorizeRole('STUDENT'), listMyApplications);

export default apiRouter;
