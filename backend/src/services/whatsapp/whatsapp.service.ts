import { config } from '../../config/env.js';
import { WhatsAppMessage } from '../../models/whatsAppMessage.model.js';
import { WhatsAppIntegrationStatusReport, WhatsAppIntegrationState } from '../../types/index.js';

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isMockDelivery?: boolean;
}

export class WhatsAppService {
  private static instance: WhatsAppService;
  private lastErrorMessage?: string;
  private lastWebhookReceivedAt?: Date;
  private webhookVerified: boolean = false;

  private constructor() {}

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  /**
   * Checks whether real Meta WhatsApp Business credentials are provided.
   */
  public isConfigured(): boolean {
    return Boolean(
      config.whatsappEnabled &&
        config.whatsappAccessToken &&
        config.whatsappPhoneNumberId &&
        config.whatsappAppSecret
    );
  }

  public getOfficialPhoneNumber(): string {
    return process.env.WHATSAPP_OFFICIAL_NUMBER || '+91 98765 43210';
  }

  public setWebhookVerified(verified: boolean): void {
    this.webhookVerified = verified;
  }

  public recordWebhookReceived(): void {
    this.lastWebhookReceivedAt = new Date();
  }

  public recordError(message: string): void {
    this.lastErrorMessage = message;
  }

  /**
   * Computes accurate integration status for admin monitoring.
   */
  public getIntegrationStatus(): WhatsAppIntegrationStatusReport {
    let status: WhatsAppIntegrationState = 'NOT_CONFIGURED';

    if (!config.whatsappEnabled) {
      status = 'NOT_CONFIGURED';
    } else if (this.isConfigured() && this.webhookVerified) {
      status = 'CONNECTED_VERIFIED';
    } else if (this.isConfigured()) {
      status = 'CONFIGURED';
    }

    if (this.lastErrorMessage) {
      status = 'ERROR';
    }

    return {
      status,
      enabled: config.whatsappEnabled,
      apiVersion: config.whatsappApiVersion,
      phoneNumberId: config.whatsappPhoneNumberId ? '***' + config.whatsappPhoneNumberId.slice(-4) : undefined,
      wabaId: config.whatsappBusinessAccountId ? '***' + config.whatsappBusinessAccountId.slice(-4) : undefined,
      webhookPath: config.whatsappWebhookPath,
      webhookVerified: this.webhookVerified,
      lastWebhookReceivedAt: this.lastWebhookReceivedAt?.toISOString(),
      lastErrorMessage: this.lastErrorMessage,
    };
  }

  /**
   * Sends a plain text message to a WhatsApp recipient using Graph API.
   */
  public async sendTextMessage(to: string, text: string): Promise<WhatsAppSendResult> {
    const cleanTo = to.replace(/[^0-9]/g, '');

    // If not configured, record in audit/message collection as simulated outbound
    if (!this.isConfigured()) {
      await this.recordOutboundLog({
        phoneNumber: cleanTo,
        content: text,
        messageType: 'text',
        status: 'sent',
      });
      return {
        success: true,
        messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        isMockDelivery: true,
      };
    }

    const url = `https://graph.facebook.com/${config.whatsappApiVersion}/${config.whatsappPhoneNumberId}/messages`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.whatsappAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanTo,
          type: 'text',
          text: {
            preview_url: false,
            body: text,
          },
        }),
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        const errorMsg = data?.error?.message || `WhatsApp Graph API error (${response.status})`;
        this.recordError(errorMsg);
        await this.recordOutboundLog({
          phoneNumber: cleanTo,
          content: text,
          messageType: 'text',
          status: 'failed',
          errorMessage: errorMsg,
        });
        return { success: false, error: errorMsg };
      }

      const waMessageId = data?.messages?.[0]?.id || `wamid_${Date.now()}`;
      await this.recordOutboundLog({
        waMessageId,
        phoneNumber: cleanTo,
        content: text,
        messageType: 'text',
        status: 'sent',
      });

      return { success: true, messageId: waMessageId };
    } catch (err: any) {
      const errText = err?.message || 'Network failure sending WhatsApp message';
      this.recordError(errText);
      await this.recordOutboundLog({
        phoneNumber: cleanTo,
        content: text,
        messageType: 'text',
        status: 'failed',
        errorMessage: errText,
      });
      return { success: false, error: errText };
    }
  }

  /**
   * Sends interactive button messages (up to 3 quick buttons) with fallback to text options.
   */
  public async sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<WhatsAppSendResult> {
    const cleanTo = to.replace(/[^0-9]/g, '');

    if (!this.isConfigured()) {
      // Format text fallback
      const buttonLines = buttons.map((b, idx) => `[${idx + 1}] ${b.title}`).join('\n');
      const fallbackText = `${bodyText}\n\n${buttonLines}`;

      await this.recordOutboundLog({
        phoneNumber: cleanTo,
        content: fallbackText,
        messageType: 'button',
        status: 'sent',
      });

      return {
        success: true,
        messageId: `sim_btn_${Date.now()}`,
        isMockDelivery: true,
      };
    }

    const url = `https://graph.facebook.com/${config.whatsappApiVersion}/${config.whatsappPhoneNumberId}/messages`;

    try {
      const formattedButtons = buttons.slice(0, 3).map((b) => ({
        type: 'reply',
        reply: {
          id: b.id,
          title: b.title.slice(0, 20),
        },
      }));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.whatsappAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanTo,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: bodyText },
            action: { buttons: formattedButtons },
          },
        }),
      });

      const data = (await response.json()) as any;
      if (!response.ok) {
        // Fall back to plain text if interactive button is rejected
        return await this.sendTextMessage(
          to,
          `${bodyText}\n\n${buttons.map((b, i) => `${i + 1}. ${b.title}`).join('\n')}`
        );
      }

      const waMessageId = data?.messages?.[0]?.id || `wamid_btn_${Date.now()}`;
      await this.recordOutboundLog({
        waMessageId,
        phoneNumber: cleanTo,
        content: bodyText,
        messageType: 'button',
        status: 'sent',
      });

      return { success: true, messageId: waMessageId };
    } catch {
      return await this.sendTextMessage(
        to,
        `${bodyText}\n\n${buttons.map((b, i) => `${i + 1}. ${b.title}`).join('\n')}`
      );
    }
  }

  /**
   * Helper to write outbound message record non-blockingly.
   */
  private async recordOutboundLog(params: {
    waMessageId?: string;
    phoneNumber: string;
    content: string;
    messageType: 'text' | 'interactive' | 'template' | 'button' | 'system';
    status: 'sent' | 'delivered' | 'read' | 'failed' | 'received';
    errorMessage?: string;
  }): Promise<void> {
    try {
      await WhatsAppMessage.create({
        waMessageId: params.waMessageId,
        phoneNumber: params.phoneNumber,
        direction: 'OUTBOUND',
        messageType: params.messageType,
        content: params.content.substring(0, 2000),
        status: params.status,
        errorMessage: params.errorMessage,
      });
    } catch {
      // Ignore database logging errors
    }
  }
}
