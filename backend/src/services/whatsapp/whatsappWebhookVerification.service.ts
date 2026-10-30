import crypto from 'crypto';
import { config } from '../../config/env.js';
import { WhatsAppService } from './whatsapp.service.js';

export class WhatsAppWebhookVerificationService {
  /**
   * Validates Meta WhatsApp Webhook GET challenge verification.
   */
  static verifySubscriptionChallenge(query: Record<string, any>): {
    valid: boolean;
    challenge?: string;
    statusCode: number;
    error?: string;
  } {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (!mode || !token) {
      return {
        valid: false,
        statusCode: 400,
        error: 'Missing hub.mode or hub.verify_token parameters.',
      };
    }

    if (mode === 'subscribe' && token === config.whatsappVerifyToken) {
      WhatsAppService.getInstance().setWebhookVerified(true);
      return {
        valid: true,
        challenge: String(challenge),
        statusCode: 200,
      };
    }

    return {
      valid: false,
      statusCode: 403,
      error: 'Verify token mismatch or invalid subscription mode.',
    };
  }

  /**
   * Verifies the X-Hub-Signature-256 HMAC SHA-256 header from Meta POST webhook requests.
   * Protects against spoofing, forgery, and tampering.
   */
  static verifyPayloadSignature(
    signatureHeader: string | undefined,
    rawPayload: Buffer | string | undefined
  ): boolean {
    // If WhatsApp is disabled or app secret is not configured in local environment, allow pass-through
    if (!config.whatsappEnabled || !config.whatsappAppSecret) {
      return true;
    }

    if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
      return false;
    }

    if (!rawPayload) {
      return false;
    }

    const expectedSignature = signatureHeader.substring(7).trim();

    try {
      const hmac = crypto.createHmac('sha256', config.whatsappAppSecret);
      if (Buffer.isBuffer(rawPayload)) {
        hmac.update(rawPayload);
      } else {
        hmac.update(Buffer.from(rawPayload, 'utf-8'));
      }
      const calculatedSignature = hmac.digest('hex');

      // Use timingSafeEqual to defeat side-channel timing attacks
      const expectedBuf = Buffer.from(expectedSignature, 'hex');
      const calculatedBuf = Buffer.from(calculatedSignature, 'hex');

      if (expectedBuf.length !== calculatedBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuf, calculatedBuf);
    } catch {
      return false;
    }
  }
}
