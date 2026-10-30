import { Router } from 'express';
import {
  requestLinkingCode,
  verifyLinkingCode,
  unlinkAccount,
  getStatus,
  updatePreferences,
  handleWebhookVerification,
  handleWebhookEvent,
  getAdminStatus,
  getAdminAnalytics,
  getAdminEvents,
  sendTestMessage,
} from '../controllers/whatsapp.controller.js';
import { authenticate, authorizeRole } from '../middlewares/auth.js';

const router = Router();

// ==========================================
// 1. META WEBHOOK ENDPOINTS (Public / Handshake)
// ==========================================
router.get('/webhook', handleWebhookVerification);
router.post('/webhook', handleWebhookEvent);

// ==========================================
// 2. STUDENT ACCOUNT LINKING & PREFERENCES
// ==========================================
router.post('/link/request', authenticate, authorizeRole('STUDENT'), requestLinkingCode);
router.post('/link/verify', authenticate, authorizeRole('STUDENT'), verifyLinkingCode);
router.delete('/link', authenticate, authorizeRole('STUDENT'), unlinkAccount);
router.get('/status', authenticate, authorizeRole('STUDENT'), getStatus);
router.patch('/preferences', authenticate, authorizeRole('STUDENT'), updatePreferences);

// ==========================================
// 3. ADMIN MANAGEMENT & MONITORING
// ==========================================
router.use('/admin', authenticate, authorizeRole('ADMIN'));
router.get('/admin/status', getAdminStatus);
router.get('/admin/analytics', getAdminAnalytics);
router.get('/admin/events', getAdminEvents);
router.post('/admin/test-message', sendTestMessage);

export default router;
