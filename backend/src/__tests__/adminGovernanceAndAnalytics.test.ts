import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { generateToken } from '../utils/auth.js';
import { User } from '../models/user.model.js';
import { EmployerProfile } from '../models/employerProfile.model.js';
import { Cohort } from '../models/cohort.model.js';
import { PlacementDrive } from '../models/placementDrive.model.js';
import { PlacementApplication } from '../models/placementApplication.model.js';
import { CareerEvent } from '../models/careerEvent.model.js';
import { AuditLog } from '../models/auditLog.model.js';
import { ModerationItem } from '../models/moderationItem.model.js';
import { AdminAnalyticsService } from '../services/adminAnalytics.service.js';
import { AuditLoggerService } from '../services/auditLogger.service.js';

describe('Phase 9: Admin Control Centre, Analytics, Moderation & Platform Governance', () => {
  const app = createApp();

  const adminId = '507f1f77bcf86cd799439999';
  const studentId = '507f1f77bcf86cd799439011';
  const employerId = '507f1f77bcf86cd799439022';
  const collegeId = '507f1f77bcf86cd799439033';
  const targetUserId = '507f1f77bcf86cd799439044';

  const adminToken = generateToken({
    sub: adminId,
    email: 'admin.governance@careerbridge.in',
    role: 'ADMIN',
  });

  const studentToken = generateToken({
    sub: studentId,
    email: 'student@district.edu.in',
    role: 'STUDENT',
  });

  const employerToken = generateToken({
    sub: employerId,
    email: 'recruiter@techcorp.in',
    role: 'EMPLOYER',
  });

  const collegeToken = generateToken({
    sub: collegeId,
    email: 'principal@rural-polytechnic.ac.in',
    role: 'COLLEGE',
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Role & Permission Matrix (RBAC)', () => {
    it('should reject unauthenticated requests to /api/admin/dashboard with 401', async () => {
      const res = await request(app).get('/api/admin/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should forbid STUDENT role from accessing admin endpoints (403)', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should forbid EMPLOYER role from accessing admin endpoints (403)', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${employerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should forbid COLLEGE role from accessing admin endpoints (403)', async () => {
      const res = await request(app)
        .get('/api/admin/system-health')
        .set('Authorization', `Bearer ${collegeToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should authorize ADMIN role to access admin dashboard (200)', async () => {
      vi.spyOn(AdminAnalyticsService, 'getDashboardMetrics').mockResolvedValue({
        totalUsers: 150,
        totalStudents: 120,
        totalEmployers: 20,
        totalColleges: 10,
        activeCohorts: 8,
        publishedOpportunities: 15,
        totalApplications: 95,
        activeCareerEvents: 4,
        pendingEmployerVerifications: 3,
        pendingCollegeVerifications: 2,
        recentActivities: [],
      });

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUsers).toBe(150);
      expect(res.body.data.totalStudents).toBe(120);
      expect(res.body.data.pendingEmployerVerifications).toBe(3);
    });
  });

  describe('2. User Management & Suspension Governance', () => {
    it('should list users with pagination and role filters', async () => {
      const mockUsers = [
        {
          _id: new mongoose.Types.ObjectId(studentId),
          fullName: 'Aarav Patel',
          email: 'aarav@district.edu.in',
          role: 'STUDENT',
          isActive: true,
          isSuspended: false,
          toSafeObject() {
            return {
              id: studentId,
              fullName: 'Aarav Patel',
              email: 'aarav@district.edu.in',
              role: 'STUDENT',
              isActive: true,
              isSuspended: false,
            };
          },
        },
      ];

      vi.spyOn(User, 'find').mockReturnValue({
        sort: () => ({
          skip: () => ({
            limit: () => ({
              exec: async () => mockUsers,
            }),
          }),
        }),
      } as any);

      vi.spyOn(User, 'countDocuments').mockReturnValue({
        exec: async () => 1,
      } as any);

      const res = await request(app)
        .get('/api/admin/users?role=STUDENT&page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toHaveLength(1);
      expect(res.body.data.pagination.total).toBe(1);
    });

    it('should reject suspension if reason is missing', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${targetUserId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should prohibit administrators from suspending their own account', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${adminId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Self test' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SELF_SUSPENSION_PROHIBITED');
    });

    it('should suspend a user with recorded reason and write to append-only AuditLog', async () => {
      const mockTarget = {
        _id: new mongoose.Types.ObjectId(targetUserId),
        email: 'violator@domain.com',
        role: 'STUDENT',
        isSuspended: false,
        save: vi.fn().mockResolvedValue(true),
        toSafeObject() {
          return {
            id: targetUserId,
            email: 'violator@domain.com',
            role: 'STUDENT',
            isSuspended: true,
            suspensionReason: 'Spam recruitment messages',
          };
        },
      };

      vi.spyOn(User, 'findById').mockResolvedValue(mockTarget as any);
      const auditSpy = vi.spyOn(AuditLoggerService, 'log').mockResolvedValue();

      const res = await request(app)
        .post(`/api/admin/users/${targetUserId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Spam recruitment messages' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.isSuspended).toBe(true);
      expect(mockTarget.save).toHaveBeenCalled();
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SUSPEND_USER',
          resourceType: 'USER',
          resourceId: targetUserId,
        })
      );
    });

    it('should reactivate a suspended user and record audit entry', async () => {
      const mockTarget = {
        _id: new mongoose.Types.ObjectId(targetUserId),
        email: 'violator@domain.com',
        role: 'STUDENT',
        isSuspended: true,
        suspensionReason: 'Prior violation',
        save: vi.fn().mockResolvedValue(true),
        toSafeObject() {
          return {
            id: targetUserId,
            email: 'violator@domain.com',
            role: 'STUDENT',
            isSuspended: false,
          };
        },
      };

      vi.spyOn(User, 'findById').mockResolvedValue(mockTarget as any);
      const auditSpy = vi.spyOn(AuditLoggerService, 'log').mockResolvedValue();

      const res = await request(app)
        .post(`/api/admin/users/${targetUserId}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.isSuspended).toBe(false);
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'REACTIVATE_USER',
          resourceType: 'USER',
          resourceId: targetUserId,
        })
      );
    });
  });

  describe('3. Employer Verification Workflow', () => {
    it('should list pending employer profiles for review', async () => {
      const mockProfiles = [
        {
          _id: new mongoose.Types.ObjectId(employerId),
          userId: employerId,
          companyName: 'Bharat Cloud Tech',
          verificationStatus: 'PENDING',
          toSafeObject() {
            return {
              id: employerId,
              companyName: 'Bharat Cloud Tech',
              verificationStatus: 'PENDING',
            };
          },
        },
      ];

      vi.spyOn(EmployerProfile, 'find').mockReturnValue({
        populate: () => ({
          sort: () => ({
            exec: async () => mockProfiles,
          }),
        }),
      } as any);

      const res = await request(app)
        .get('/api/admin/employers/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.employers).toHaveLength(1);
      expect(res.body.data.employers[0].companyName).toBe('Bharat Cloud Tech');
    });

    it('should approve employer verification and write audit trail', async () => {
      const mockProfile = {
        _id: new mongoose.Types.ObjectId(employerId),
        userId: new mongoose.Types.ObjectId(employerId),
        companyName: 'Bharat Cloud Tech',
        verified: false,
        verificationStatus: 'PENDING',
        save: vi.fn().mockResolvedValue(true),
        toSafeObject() {
          return {
            id: employerId,
            companyName: 'Bharat Cloud Tech',
            verified: true,
            verificationStatus: 'VERIFIED',
          };
        },
      };

      vi.spyOn(EmployerProfile, 'findOne').mockResolvedValue(mockProfile as any);
      const auditSpy = vi.spyOn(AuditLoggerService, 'log').mockResolvedValue();

      const res = await request(app)
        .post(`/api/admin/employers/${employerId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'CIN and GST credentials verified with ministry registry' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.verified).toBe(true);
      expect(res.body.data.profile.verificationStatus).toBe('VERIFIED');
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'VERIFY_EMPLOYER',
          resourceType: 'EMPLOYER',
        })
      );
    });

    it('should reject employer verification with mandatory reason', async () => {
      const mockProfile = {
        _id: new mongoose.Types.ObjectId(employerId),
        userId: new mongoose.Types.ObjectId(employerId),
        companyName: 'Fake Corp',
        verified: false,
        verificationStatus: 'PENDING',
        save: vi.fn().mockResolvedValue(true),
        toSafeObject() {
          return {
            id: employerId,
            companyName: 'Fake Corp',
            verified: false,
            verificationStatus: 'REJECTED',
          };
        },
      };

      vi.spyOn(EmployerProfile, 'findOne').mockResolvedValue(mockProfile as any);
      const auditSpy = vi.spyOn(AuditLoggerService, 'log').mockResolvedValue();

      const res = await request(app)
        .post(`/api/admin/employers/${employerId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Invalid incorporation documentation' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.verificationStatus).toBe('REJECTED');
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'REJECT_EMPLOYER',
          reason: 'Invalid incorporation documentation',
        })
      );
    });
  });

  describe('4. College Management & Verification', () => {
    it('should list registered colleges with cohort and drive statistics', async () => {
      const mockColleges = [
        {
          _id: new mongoose.Types.ObjectId(collegeId),
          fullName: 'Government Polytechnic Ambikapur',
          email: 'principal@gpa.ac.in',
          role: 'COLLEGE',
          collegeProfile: { institutionName: 'Government Polytechnic Ambikapur', verified: false },
          toSafeObject() {
            return {
              id: collegeId,
              fullName: 'Government Polytechnic Ambikapur',
              collegeProfile: { institutionName: 'Government Polytechnic Ambikapur' },
            };
          },
        },
      ];

      vi.spyOn(User, 'find').mockReturnValue({
        sort: () => ({
          exec: async () => mockColleges,
        }),
      } as any);

      vi.spyOn(Cohort, 'countDocuments').mockReturnValue({ exec: async () => 4 } as any);
      vi.spyOn(PlacementDrive, 'countDocuments').mockReturnValue({ exec: async () => 2 } as any);

      const res = await request(app)
        .get('/api/admin/colleges')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.colleges).toHaveLength(1);
      expect(res.body.data.colleges[0].stats.cohortCount).toBe(4);
      expect(res.body.data.colleges[0].stats.driveCount).toBe(2);
    });

    it('should verify a college account institutional status', async () => {
      const mockCollege = {
        _id: new mongoose.Types.ObjectId(collegeId),
        role: 'COLLEGE',
        collegeProfile: { institutionName: 'GPA', verified: false },
        save: vi.fn().mockResolvedValue(true),
        toSafeObject() {
          return {
            id: collegeId,
            collegeProfile: { institutionName: 'GPA', verified: true },
          };
        },
      };

      vi.spyOn(User, 'findOne').mockResolvedValue(mockCollege as any);
      const auditSpy = vi.spyOn(AuditLoggerService, 'log').mockResolvedValue();

      const res = await request(app)
        .post(`/api/admin/colleges/${collegeId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.college.collegeProfile.verified).toBe(true);
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'VERIFY_COLLEGE',
          resourceType: 'COLLEGE',
          resourceId: collegeId,
        })
      );
    });
  });

  describe('5. Content Moderation Engine', () => {
    it('should allow authenticated users to flag content for moderation', async () => {
      const mockItem = {
        _id: new mongoose.Types.ObjectId(),
        targetType: 'OPPORTUNITY',
        targetId: 'opp-101',
        targetTitle: 'Suspicious Job Post',
        reason: 'Demands upfront registration fees',
        status: 'PENDING',
        toSafeObject() {
          return {
            id: 'mod-1',
            targetType: 'OPPORTUNITY',
            targetId: 'opp-101',
            targetTitle: 'Suspicious Job Post',
            reason: 'Demands upfront registration fees',
            status: 'PENDING',
          };
        },
      };

      vi.spyOn(ModerationItem, 'create').mockResolvedValue(mockItem as any);

      const res = await request(app)
        .post('/api/admin/moderation')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          targetType: 'OPPORTUNITY',
          targetId: 'opp-101',
          targetTitle: 'Suspicious Job Post',
          reason: 'Demands upfront registration fees',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.item.status).toBe('PENDING');
    });

    it('should allow admin to review moderation item and record action', async () => {
      const modId = new mongoose.Types.ObjectId().toString();
      const mockItem = {
        _id: new mongoose.Types.ObjectId(modId),
        targetType: 'OPPORTUNITY',
        targetId: 'opp-101',
        status: 'PENDING',
        save: vi.fn().mockResolvedValue(true),
        toSafeObject() {
          return {
            id: modId,
            targetType: 'OPPORTUNITY',
            targetId: 'opp-101',
            status: 'ACTION_TAKEN',
            moderatorNotes: 'Drive removed for fee solicitation',
          };
        },
      };

      vi.spyOn(ModerationItem, 'findById').mockResolvedValue(mockItem as any);
      const auditSpy = vi.spyOn(AuditLoggerService, 'log').mockResolvedValue();

      const res = await request(app)
        .post(`/api/admin/moderation/${modId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'ACTION_TAKEN',
          notes: 'Drive removed for fee solicitation',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.item.status).toBe('ACTION_TAKEN');
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'REVIEW_MODERATION',
          resourceType: 'MODERATION',
        })
      );
    });
  });

  describe('6. Platform Analytics & Placement Outcome Transparency', () => {
    it('should compile platform analytics without inflating metrics', async () => {
      vi.spyOn(AdminAnalyticsService, 'getPlatformAnalytics').mockResolvedValue({
        userGrowth: [{ date: '2026-10-01', students: 50, employers: 5, colleges: 2 }],
        opportunityCategories: [{ category: 'JOB', count: 12 }],
        applicationFunnel: {
          applied: 80,
          shortlisted: 40,
          interviewScheduled: 20,
          selected: 10,
          rejected: 15,
          withdrawn: 5,
        },
        transparentPlacementOutcomes: {
          totalSelected: 10,
          offerConfirmed: 10,
          joined: 8,
          outcomeVerified: 7,
          note: 'All placement figures reflect actual database records.',
        },
        topSkillsInDemand: [{ skill: 'javascript', count: 8 }],
      });

      const res = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.applicationFunnel.applied).toBe(80);
      expect(res.body.data.applicationFunnel.selected).toBe(10);
      expect(res.body.data.transparentPlacementOutcomes.note).toContain('actual database records');
    });

    it('should return transparent placement outcome reports', async () => {
      vi.spyOn(AdminAnalyticsService, 'getPlatformAnalytics').mockResolvedValue({
        userGrowth: [],
        opportunityCategories: [{ category: 'INTERNSHIP', count: 6 }],
        applicationFunnel: {
          applied: 30,
          shortlisted: 15,
          interviewScheduled: 8,
          selected: 5,
          rejected: 5,
          withdrawn: 2,
        },
        transparentPlacementOutcomes: {
          totalSelected: 5,
          offerConfirmed: 5,
          joined: 4,
          outcomeVerified: 4,
          note: 'Strict verification',
        },
        topSkillsInDemand: [],
      });

      const res = await request(app)
        .get('/api/admin/placement-reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.transparentPlacementOutcomes.totalSelected).toBe(5);
    });
  });

  describe('7. Append-Only Audit Logging', () => {
    it('should list audit logs with pagination and filters', async () => {
      const mockLogs = [
        {
          _id: new mongoose.Types.ObjectId(),
          actorId: new mongoose.Types.ObjectId(adminId),
          actorRole: 'ADMIN',
          action: 'SUSPEND_USER',
          resourceType: 'USER',
          resourceId: targetUserId,
          reason: 'Terms violation',
          toSafeObject() {
            return {
              id: 'log-1',
              actorId: adminId,
              actorRole: 'ADMIN',
              action: 'SUSPEND_USER',
              resourceType: 'USER',
              resourceId: targetUserId,
              reason: 'Terms violation',
              timestamp: new Date().toISOString(),
            };
          },
        },
      ];

      vi.spyOn(AuditLog, 'find').mockReturnValue({
        sort: () => ({
          skip: () => ({
            limit: () => ({
              exec: async () => mockLogs,
            }),
          }),
        }),
      } as any);

      vi.spyOn(AuditLog, 'countDocuments').mockReturnValue({
        exec: async () => 1,
      } as any);

      const res = await request(app)
        .get('/api/admin/audit-logs?action=SUSPEND_USER&page=1&limit=20')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.logs).toHaveLength(1);
      expect(res.body.data.logs[0].action).toBe('SUSPEND_USER');
    });
  });

  describe('8. System Health & Operational Diagnostics', () => {
    it('should return operational health report without exposing secrets or env vars', async () => {
      const res = await request(app)
        .get('/api/admin/system-health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.server).toBeDefined();
      expect(res.body.data.server.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(res.body.data.aiProvider).toBeDefined();
      expect(res.body.data.notifications).toBeDefined();
      expect(res.body.data.sanitizedDiagnostics).toBeInstanceOf(Array);

      // Verify no sensitive keys are leaked
      const stringified = JSON.stringify(res.body.data);
      expect(stringified).not.toContain('JWT_SECRET');
      expect(stringified).not.toContain('API_KEY');
      expect(stringified).not.toContain('passwordHash');
    });
  });
});
