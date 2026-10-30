import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { generateToken } from '../utils/auth.js';
import { sanitizeNoSqlInput, sanitizeXssInput, sanitizeXssString } from '../middlewares/sanitize.js';
import { validateRule, validateRequest, validatePagination } from '../middlewares/validate.js';
import { ensureStudentTenant, ensureCollegeTenant, ensureEmployerTenant, preventIdor } from '../middlewares/tenantGuard.js';
import { SecureStorageService } from '../services/secureStorage.service.js';
import { CacheService } from '../services/cache.service.js';
import { LoggerService, sanitizeLogData } from '../services/logger.service.js';
import { PlacementApplication } from '../models/placementApplication.model.js';
import { LearningEnrollment } from '../models/learningEnrollment.model.js';

describe('Phase 19: Advanced Security, Hardening & Tenant Isolation', () => {
  const app = createApp();

  const studentId1 = new mongoose.Types.ObjectId().toString();
  const studentId2 = new mongoose.Types.ObjectId().toString();
  const collegeId1 = new mongoose.Types.ObjectId().toString();
  const collegeId2 = new mongoose.Types.ObjectId().toString();
  const employerId1 = new mongoose.Types.ObjectId().toString();
  const employerId2 = new mongoose.Types.ObjectId().toString();
  const adminId = new mongoose.Types.ObjectId().toString();

  const studentToken1 = generateToken({ sub: studentId1, email: 'student1@district.edu', role: 'STUDENT' });
  const collegeToken1 = generateToken({ sub: collegeId1, email: 'placement@polytechnic.edu', role: 'COLLEGE' });
  const employerToken1 = generateToken({ sub: employerId1, email: 'recruiter@techcorp.in', role: 'EMPLOYER' });
  const adminToken = generateToken({ sub: adminId, email: 'admin@careerbridge.gov.in', role: 'ADMIN' });

  beforeEach(() => {
    CacheService.getInstance().clear();
  });

  // ==========================================
  // 1. INJECTION DEFENSE (NoSQL & XSS)
  // ==========================================
  describe('Injection Defense: NoSQL & XSS Sanitization', () => {
    it('should strip MongoDB operator keys starting with $ from input payloads', () => {
      const maliciousPayload = {
        username: 'student123',
        password: { $gt: '' },
        $where: 'this.password.length > 0',
        metadata: {
          $regex: '.*',
          validField: 'allowedValue',
        },
      };

      const cleaned = sanitizeNoSqlInput(maliciousPayload);

      expect(cleaned).toEqual({
        username: 'student123',
        password: {},
        metadata: {
          validField: 'allowedValue',
        },
      });
      expect(cleaned).not.toHaveProperty('$where');
      expect((cleaned as any).password).not.toHaveProperty('$gt');
    });

    it('should strip keys containing dot notation to prevent path traversal injection', () => {
      const payloadWithDot = {
        'profile.role': 'ADMIN',
        normalKey: 'safe',
      };

      const cleaned = sanitizeNoSqlInput(payloadWithDot);
      expect(cleaned).toEqual({ normalKey: 'safe' });
      expect(cleaned).not.toHaveProperty('profile.role');
    });

    it('should strip inline <script> tags and event handlers from XSS strings', () => {
      const xssString = '<script>alert("xss")</script>Hello <img src=x onerror="alert(1)" /> World';
      const cleaned = sanitizeXssString(xssString);

      expect(cleaned).not.toContain('<script>');
      expect(cleaned).not.toContain('</script>');
      expect(cleaned).not.toContain('onerror=');
      expect(cleaned).toContain('Hello');
      expect(cleaned).toContain('World');
    });

    it('should neutralize javascript: pseudo-protocol URIs', () => {
      const dangerousLink = 'javascript:stealCredentials()';
      const cleaned = sanitizeXssString(dangerousLink);

      expect(cleaned).not.toContain('javascript:');
      expect(cleaned).toContain('blocked:');
    });

    it('should recursively sanitize nested objects containing XSS payloads', () => {
      const nested = {
        title: 'Software Engineer',
        description: 'Great role <script>maliciousCode()</script>',
        tags: ['React', '<script>alert(1)</script>Node'],
      };

      const cleaned = sanitizeXssInput(nested);
      expect(cleaned.description).toBe('Great role ');
      expect(cleaned.tags[1]).toBe('Node');
    });

    it('should sanitize incoming API requests through global sanitizeMiddleware', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com<script>evil()</script>',
          password: { $ne: null },
        });

      // The controller will receive sanitized email without script tag and password without $ne
      expect(res.status).toBe(400); // Bad login credentials, not 500 or injected bypass
    });
  });

  // ==========================================
  // 2. TENANT ISOLATION & IDOR PREVENTION
  // ==========================================
  describe('Tenant Isolation & IDOR Protection', () => {
    it('should allow student to access their own resources', () => {
      const req: any = {
        user: { userId: studentId1, role: 'STUDENT' },
        params: { studentId: studentId1 },
      };
      let called = false;
      const next = () => { called = true; };
      const res: any = { status: () => ({ json: () => {} }) };

      ensureStudentTenant(req, res, next);
      expect(called).toBe(true);
    });

    it('should reject student attempting to access another student\'s resources (IDOR)', () => {
      const req: any = {
        user: { userId: studentId1, role: 'STUDENT' },
        params: { studentId: studentId2 },
      };
      let statusCode = 0;
      let responseBody: any = null;
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (body: any) => { responseBody = body; },
          };
        },
      };
      const next = () => {};

      ensureStudentTenant(req, res, next);
      expect(statusCode).toBe(403);
      expect(responseBody.error.code).toBe('TENANT_ISOLATION_VIOLATION');
    });

    it('should allow ADMIN to bypass student tenant restrictions', () => {
      const req: any = {
        user: { userId: adminId, role: 'ADMIN' },
        params: { studentId: studentId2 },
      };
      let called = false;
      const next = () => { called = true; };
      const res: any = {};

      ensureStudentTenant(req, res, next);
      expect(called).toBe(true);
    });

    it('should reject non-student role from entering student tenant route', () => {
      const req: any = {
        user: { userId: employerId1, role: 'EMPLOYER' },
        params: { studentId: employerId1 },
      };
      let statusCode = 0;
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return { json: () => {} };
        },
      };

      ensureStudentTenant(req, res, () => {});
      expect(statusCode).toBe(403);
    });

    it('should enforce college tenant boundaries against cross-college tampering', () => {
      const req: any = {
        user: { userId: collegeId1, role: 'COLLEGE' },
        params: { collegeId: collegeId2 },
      };
      let statusCode = 0;
      let responseBody: any = null;
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return { json: (b: any) => { responseBody = b; } };
        },
      };

      ensureCollegeTenant(req, res, () => {});
      expect(statusCode).toBe(403);
      expect(responseBody.error.code).toBe('TENANT_ISOLATION_VIOLATION');
    });

    it('should enforce employer tenant boundaries against cross-employer tampering', () => {
      const req: any = {
        user: { userId: employerId1, role: 'EMPLOYER' },
        params: { employerId: employerId2 },
      };
      let statusCode = 0;
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return { json: () => {} };
        },
      };

      ensureEmployerTenant(req, res, () => {});
      expect(statusCode).toBe(403);
    });

    it('preventIdor helper should block unauthorized resource manipulation', () => {
      const guard = preventIdor('targetUserId');
      const req: any = {
        user: { userId: studentId1, role: 'STUDENT' },
        params: { targetUserId: studentId2 },
      };
      let statusCode = 0;
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return { json: () => {} };
        },
      };

      guard(req, res, () => {});
      expect(statusCode).toBe(403);
    });
  });

  // ==========================================
  // 3. CENTRALIZED REQUEST VALIDATION
  // ==========================================
  describe('Centralized Request Validation & Pagination Clamping', () => {
    it('should validate 24-character hexadecimal ObjectId', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      expect(validateRule(validId, { field: 'id', type: 'objectId' })).toBeNull();

      const invalidId = 'not-an-object-id';
      expect(validateRule(invalidId, { field: 'id', type: 'objectId' })).toContain('valid 24-character hexadecimal ObjectId');
    });

    it('should enforce string length constraints and required fields', () => {
      expect(validateRule('', { field: 'title', required: true })).toContain('is required');
      expect(validateRule('ab', { field: 'title', type: 'string', minLength: 3 })).toContain('at least 3 characters');
      expect(validateRule('123456', { field: 'title', type: 'string', maxLength: 5 })).toContain('cannot exceed 5 characters');
    });

    it('should enforce numeric bounds and enums', () => {
      expect(validateRule(5, { field: 'count', type: 'number', min: 10 })).toContain('at least 10');
      expect(validateRule(50, { field: 'count', type: 'number', max: 20 })).toContain('cannot exceed 20');
      expect(validateRule('INVALID', { field: 'status', enum: ['ACTIVE', 'INACTIVE'] })).toContain('must be one of');
      expect(validateRule('ACTIVE', { field: 'status', enum: ['ACTIVE', 'INACTIVE'] })).toBeNull();
    });

    it('should clamp pagination limit to max 100 and default page to 1', () => {
      const req: any = { query: { page: '0', limit: '500' } };
      validatePagination(req, {} as any, () => {});

      expect(req.query.page).toBe('1');
      expect(req.query.limit).toBe('100');
    });
  });

  // ==========================================
  // 4. SECURE STORAGE & FILE SIGNATURE VERIFICATION
  // ==========================================
  describe('Secure Storage & Magic Byte Verification', () => {
    it('should detect authentic PDF magic bytes (%PDF-)', () => {
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
      const mime = SecureStorageService.detectMagicBytes(pdfBuffer);
      expect(mime).toBe('application/pdf');
    });

    it('should detect authentic DOCX magic bytes (PK\\x03\\x04)', () => {
      const docxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
      const mime = SecureStorageService.detectMagicBytes(docxBuffer);
      expect(mime).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });

    it('should detect authentic PNG magic bytes', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const mime = SecureStorageService.detectMagicBytes(pngBuffer);
      expect(mime).toBe('image/png');
    });

    it('should detect authentic JPEG magic bytes (0xff 0xd8 0xff)', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const mime = SecureStorageService.detectMagicBytes(jpegBuffer);
      expect(mime).toBe('image/jpeg');
    });

    it('should reject fake files whose extension claims PDF but signature is executable or text', () => {
      const fakePdfBuffer = Buffer.from('MZ...WindowsExecutablePayload');
      const result = SecureStorageService.validateFile(fakePdfBuffer, 'resume.pdf', 'resume');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('authentic file signatures');
    });

    it('should reject files exceeding max resume limit (5MB)', () => {
      const bigBuffer = Buffer.alloc(6 * 1024 * 1024);
      bigBuffer[0] = 0x25; bigBuffer[1] = 0x50; bigBuffer[2] = 0x44; bigBuffer[3] = 0x46; bigBuffer[4] = 0x2d;

      const result = SecureStorageService.validateFile(bigBuffer, 'resume.pdf', 'resume');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed limit of 5MB');
    });

    it('should neutralize path traversal attacks in filenames', () => {
      const maliciousName = '../../../../etc/passwd\0evil.pdf';
      const cleanName = SecureStorageService.sanitizeFileName(maliciousName);

      expect(cleanName).not.toContain('..');
      expect(cleanName).not.toContain('/');
      expect(cleanName).not.toContain('\\');
      expect(cleanName).not.toContain('\0');
      expect(cleanName).toMatch(/^[a-zA-Z0-9.\-_]+$/);
    });

    it('should generate collision-resistant, tenant-scoped storage paths', () => {
      const key = SecureStorageService.generateSecureStorageKey(studentId1, 'resume', 'my_cv.pdf');

      expect(key).toContain('storage/resume/');
      expect(key).toContain(studentId1);
      expect(key).toContain('my_cv.pdf');
    });
  });

  // ==========================================
  // 5. SAFE MULTI-TENANT CACHING
  // ==========================================
  describe('Safe Multi-Tenant Caching Layer', () => {
    it('should isolate cache keys between different tenants and scopes', () => {
      const cache = CacheService.getInstance();
      const student1Key = CacheService.buildTenantKey('student', studentId1, 'recommendations');
      const student2Key = CacheService.buildTenantKey('student', studentId2, 'recommendations');

      cache.set(student1Key, { matchedJobs: ['job1', 'job2'] });
      cache.set(student2Key, { matchedJobs: ['job3'] });

      expect(cache.get(student1Key)).toEqual({ matchedJobs: ['job1', 'job2'] });
      expect(cache.get(student2Key)).toEqual({ matchedJobs: ['job3'] });
      expect(cache.get(student1Key)).not.toEqual(cache.get(student2Key));
    });

    it('should expire entries after TTL elapsed', async () => {
      const cache = CacheService.getInstance();
      const testKey = 'test:ttl:key';

      // Set key with 1-second TTL (represented in seconds, simulate immediate expiry)
      cache.set(testKey, { data: 'ephemeral' }, -1); // already expired

      expect(cache.get(testKey)).toBeNull();
    });

    it('should invalidate all keys for a specific tenant scope without touching other tenants', () => {
      const cache = CacheService.getInstance();
      const keyA1 = CacheService.buildTenantKey('college', collegeId1, 'funnel');
      const keyA2 = CacheService.buildTenantKey('college', collegeId1, 'skill-gaps');
      const keyB1 = CacheService.buildTenantKey('college', collegeId2, 'funnel');

      cache.set(keyA1, { data: 'college1_funnel' });
      cache.set(keyA2, { data: 'college1_skills' });
      cache.set(keyB1, { data: 'college2_funnel' });

      const purged = cache.invalidateTenant('college', collegeId1);
      expect(purged).toBe(2);

      expect(cache.get(keyA1)).toBeNull();
      expect(cache.get(keyA2)).toBeNull();
      expect(cache.get(keyB1)).toEqual({ data: 'college2_funnel' }); // Untouched
    });

    it('should report accurate cache hit/miss statistics', () => {
      const cache = CacheService.getInstance();
      cache.set('stats:key', 'value');

      cache.get('stats:key'); // Hit 1
      cache.get('stats:key'); // Hit 2
      cache.get('nonexistent'); // Miss 1

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRatio).toBeCloseTo(0.667, 2);
    });
  });

  // ==========================================
  // 6. STRUCTURED LOGGING & SECRET MASKING
  // ==========================================
  describe('Structured Logging & Secret Masking', () => {
    it('should redact sensitive keys (password, token, apiKey, secret) from log metadata', () => {
      const sensitiveData = {
        email: 'user@example.com',
        password: 'PlainTextPassword123!',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        apiKey: 'secret_live_key_9999',
        authorization: 'Bearer token123',
        safeMetadata: {
          cohortName: 'Batch 2026',
          creditCard: '4111-2222-3333-4444',
        },
      };

      const sanitized = sanitizeLogData(sensitiveData);

      expect(sanitized.email).toBe('user@example.com');
      expect(sanitized.password).toBe('***REDACTED***');
      expect(sanitized.token).toBe('***REDACTED***');
      expect(sanitized.apiKey).toBe('***REDACTED***');
      expect(sanitized.authorization).toBe('***REDACTED***');
      expect((sanitized.safeMetadata as any).creditCard).toBe('***REDACTED***');
      expect((sanitized.safeMetadata as any).cohortName).toBe('Batch 2026');
    });

    it('should emit structured log payloads with required telemetry fields', () => {
      const log = LoggerService.info('User login successful', {
        userId: studentId1,
        userRole: 'STUDENT',
        path: '/api/auth/login',
        method: 'POST',
        statusCode: 200,
        durationMs: 42,
      });

      expect(log.level).toBe('INFO');
      expect(log.message).toBe('User login successful');
      expect(log.userId).toBe(studentId1);
      expect(log.userRole).toBe('STUDENT');
      expect(log.statusCode).toBe(200);
      expect(log.durationMs).toBe(42);
      expect(log.timestamp).toBeDefined();
    });
  });

  // ==========================================
  // 7. ENHANCED SYSTEM HEALTH PROBE
  // ==========================================
  describe('Enhanced Health Diagnostics Probe', () => {
    it('GET /api/health should return system status with cache & memory metrics without leaking secrets', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('services');
      expect(res.body.data.services).toHaveProperty('cache');
      expect(res.body.data.services.cache).toHaveProperty('status', 'in-memory-lru-active');
      expect(res.body.data.services).toHaveProperty('memory');
      expect(res.body.data.services.memory).toHaveProperty('heapUsedMb');
      expect(res.body.data.services).toHaveProperty('security');
      expect(res.body.data.services.security.noSqlSanitization).toBe(true);
      expect(res.body.data.services.security.tenantIsolation).toBe(true);

      // Verify zero leak of tokens, api keys or environment secrets
      const rawPayload = JSON.stringify(res.body);
      expect(rawPayload).not.toContain('ICAN_SANDBOX_API_KEY');
      expect(rawPayload).not.toContain('JWT_SECRET');
      expect(rawPayload).not.toContain('MONGODB_URI');
    });
  });

  // ==========================================
  // 8. DATABASE INDEXING DECLARATIONS
  // ==========================================
  describe('Database Compound Index Declarations', () => {
    it('PlacementApplication model should define compound indexes for student lookups and drive status', () => {
      const indexes = PlacementApplication.schema.indexes();
      const indexFields = indexes.map((idx: any) => Object.keys(idx[0]));

      // Verify compound unique index
      const hasDriveStudentUnique = indexes.some(
        (idx: any) => idx[0].driveId === 1 && idx[0].studentId === 1 && idx[1]?.unique === true
      );
      expect(hasDriveStudentUnique).toBe(true);

      // Verify compound index for student application sorting
      const hasStudentAppliedAt = indexes.some(
        (idx: any) => idx[0].studentId === 1 && idx[0].appliedAt === -1
      );
      expect(hasStudentAppliedAt).toBe(true);
    });

    it('LearningEnrollment model should define compound unique index for student and path', () => {
      const indexes = LearningEnrollment.schema.indexes();
      const hasUniqueStudentPath = indexes.some(
        (idx: any) => idx[0].studentId === 1 && idx[0].learningPathId === 1 && idx[1]?.unique === true
      );
      expect(hasUniqueStudentPath).toBe(true);
    });
  });
});
