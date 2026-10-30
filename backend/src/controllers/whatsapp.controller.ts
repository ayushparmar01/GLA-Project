import { Request, Response } from 'express';
import { WhatsAppAccountLinkingService } from '../services/whatsapp/whatsappAccountLinking.service.js';
import { WhatsAppWebhookVerificationService } from '../services/whatsapp/whatsappWebhookVerification.service.js';
import { WhatsAppMessageParser } from '../services/whatsapp/whatsappMessageParser.service.js';
import { WhatsAppConversationService } from '../services/whatsapp/whatsappConversation.service.js';
import { WhatsAppService } from '../services/whatsapp/whatsapp.service.js';
import { WhatsAppRateLimiter } from '../services/whatsapp/whatsappRateLimiter.js';
import { WhatsAppAccount } from '../models/whatsAppAccount.model.js';
import { WhatsAppMessage } from '../models/whatsAppMessage.model.js';
import { WhatsAppWebhookEvent } from '../models/whatsAppWebhookEvent.model.js';

// ==========================================
// STUDENT ACTIONS
// ==========================================

export const requestLinkingCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    if (!WhatsAppRateLimiter.isLinkRequestAllowed(userId)) {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many link requests. Please wait a few minutes before requesting another code.',
        },
      });
      return;
    }

    const result = await WhatsAppAccountLinkingService.requestLinkingCode(userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('[WhatsAppController] Request linking code failed:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err?.message || 'Failed to generate WhatsApp linking code.' },
    });
  }
};

export const verifyLinkingCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { code, phoneNumber } = req.body;

    if (!code || !phoneNumber) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Linking code and phone number are required.' },
      });
      return;
    }

    const result = await WhatsAppAccountLinkingService.verifyAndLinkAccount({
      rawCode: String(code),
      phoneNumber: String(phoneNumber),
      userId,
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: { code: 'LINK_FAILED', message: result.message },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        message: result.message,
        accountId: result.accountId,
      },
    });
  } catch (err: any) {
    console.error('[WhatsAppController] Verify linking code failed:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to verify WhatsApp linking code.' },
    });
  }
};

export const unlinkAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    await WhatsAppAccountLinkingService.unlinkAccount(userId);

    res.json({
      success: true,
      data: {
        message: 'WhatsApp account unlinked successfully.',
      },
    });
  } catch (err: any) {
    console.error('[WhatsAppController] Unlink account failed:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to unlink WhatsApp account.' },
    });
  }
};

export const getStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const status = await WhatsAppAccountLinkingService.getAccountStatus(userId);

    res.json({
      success: true,
      data: status,
    });
  } catch (err: any) {
    console.error('[WhatsAppController] Get status failed:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve WhatsApp account status.' },
    });
  }
};

export const updatePreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const prefs = req.body;

    const updated = await WhatsAppAccountLinkingService.updatePreferences(userId, prefs);

    if (!updated) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No active WhatsApp account found to update.' },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        preferences: updated,
        message: 'WhatsApp notification preferences saved successfully.',
      },
    });
  } catch (err: any) {
    console.error('[WhatsAppController] Update preferences failed:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update WhatsApp preferences.' },
    });
  }
};

// ==========================================
// WEBHOOK HANDLERS
// ==========================================

export const handleWebhookVerification = (req: Request, res: Response): void => {
  const result = WhatsAppWebhookVerificationService.verifySubscriptionChallenge(req.query);

  if (!result.valid) {
    res.status(result.statusCode).send(result.error);
    return;
  }

  // Meta expects the plain challenge token string
  res.status(200).send(result.challenge);
};

export const handleWebhookEvent = async (req: Request, res: Response): Promise<void> => {
  // 1. Verify HMAC SHA-256 signature
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const rawPayload = (req as any).rawBody || JSON.stringify(req.body);

  const isSignatureValid = WhatsAppWebhookVerificationService.verifyPayloadSignature(
    signature,
    rawPayload
  );

  if (!isSignatureValid) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_SIGNATURE', message: 'X-Hub-Signature-256 verification failed.' },
    });
    return;
  }

  WhatsAppService.getInstance().recordWebhookReceived();

  // 2. Parse incoming messages and statuses
  const { messages, statuses } = WhatsAppMessageParser.parseWebhookBody(req.body);

  // Return HTTP 200 immediately to Meta as required by Graph API specifications
  res.status(200).json({ success: true, received: true });

  // 3. Process events asynchronously with duplicate event protection
  for (const msg of messages) {
    try {
      // Idempotency check: prevent duplicate event processing
      const existing = await WhatsAppWebhookEvent.findOne({ eventId: msg.messageId });
      if (existing) {
        continue;
      }

      await WhatsAppWebhookEvent.create({
        eventId: msg.messageId,
        eventType: 'messages',
        status: 'RECEIVED',
        payload: { from: msg.from, type: msg.type, command: msg.command },
      });

      // Rate limit protection against flooding from a single phone
      if (!WhatsAppRateLimiter.isInboundMessageAllowed(msg.from)) {
        continue;
      }

      // Record inbound message
      await WhatsAppMessage.create({
        waMessageId: msg.messageId,
        phoneNumber: msg.from,
        direction: 'INBOUND',
        messageType: msg.type,
        content: msg.rawText?.substring(0, 2000) || '',
        status: 'received',
      });

      // Dispatch conversation flow
      await WhatsAppConversationService.handleInboundMessage(msg);

      await WhatsAppWebhookEvent.updateOne(
        { eventId: msg.messageId },
        { $set: { status: 'PROCESSED', processedAt: new Date() } }
      );
    } catch (err: any) {
      console.error('[WhatsAppController] Error processing inbound message:', err);
      await WhatsAppWebhookEvent.updateOne(
        { eventId: msg.messageId },
        { $set: { status: 'FAILED', errorMessage: err?.message } }
      );
    }
  }

  // Process delivery status updates (sent, delivered, read, failed)
  for (const st of statuses) {
    try {
      await WhatsAppMessage.updateOne(
        { waMessageId: st.messageId },
        { $set: { status: st.status, errorMessage: st.error } }
      );
    } catch {
      // Non-blocking
    }
  }
};

// ==========================================
// ADMIN ACTIONS
// ==========================================

export const getAdminStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const statusReport = WhatsAppService.getInstance().getIntegrationStatus();
    res.json({
      success: true,
      data: statusReport,
    });
  } catch (err: any) {
    console.error('[WhatsAppController] Admin status failed:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve WhatsApp integration status.' },
    });
  }
};

export const getAdminAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalLinkedAccounts,
      totalOptedIn,
      totalOptedOut,
      messagesSent,
      messagesDelivered,
      messagesFailed,
      recentWebhookEventCount,
      recentDeliveryFailureCount,
    ] = await Promise.all([
      WhatsAppAccount.countDocuments({ status: 'ACTIVE' }).exec(),
      WhatsAppAccount.countDocuments({ status: 'ACTIVE', notificationsEnabled: true }).exec(),
      WhatsAppAccount.countDocuments({ status: 'OPTED_OUT' }).exec(),
      WhatsAppMessage.countDocuments({ direction: 'OUTBOUND', status: 'sent' }).exec(),
      WhatsAppMessage.countDocuments({
        direction: 'OUTBOUND',
        status: { $in: ['delivered', 'read'] },
      }).exec(),
      WhatsAppMessage.countDocuments({ direction: 'OUTBOUND', status: 'failed' }).exec(),
      WhatsAppWebhookEvent.countDocuments().exec(),
      WhatsAppMessage.countDocuments({ status: 'failed' }).exec(),
    ]);

    res.json({
      success: true,
      data: {
        totalLinkedAccounts,
        totalOptedIn,
        totalOptedOut,
        messagesSent,
        messagesDelivered,
        messagesFailed,
        recentWebhookEventCount,
        recentDeliveryFailureCount,
      },
    });
  } catch (err: any) {
    console.error('[WhatsAppController] Admin analytics failed:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to compile WhatsApp analytics.' },
    });
  }
};

export const getAdminEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      WhatsAppWebhookEvent.find().sort({ processedAt: -1 }).skip(skip).limit(limit).exec(),
      WhatsAppWebhookEvent.countDocuments().exec(),
    ]);

    res.json({
      success: true,
      data: {
        events: events.map((e) => e.toSafeObject()),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err: any) {
    console.error('[WhatsAppController] Admin events failed:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to list WhatsApp webhook events.' },
    });
  }
};

export const sendTestMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Recipient phoneNumber and message are required.' },
      });
      return;
    }

    const result = await WhatsAppService.getInstance().sendTextMessage(phoneNumber, message);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: { code: 'DELIVERY_FAILED', message: result.error || 'Failed to dispatch test message.' },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        messageId: result.messageId,
        isMockDelivery: result.isMockDelivery || false,
        message: result.isMockDelivery
          ? 'WhatsApp simulated delivery logged (Live Meta credentials not configured).'
          : 'Live WhatsApp message dispatched successfully.',
      },
    });
  } catch (err: any) {
    console.error('[WhatsAppController] Send test message failed:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to execute test message send.' },
    });
  }
};
