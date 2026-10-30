import {
  IExternalNotificationProvider,
  NotificationPayload,
  NotificationDeliveryResult,
} from './notificationProvider.interface.js';
import { config } from '../../config/env.js';

export class ConsoleFallbackNotificationProvider implements IExternalNotificationProvider {
  public readonly providerName = 'CONSOLE_FALLBACK';

  public isConfigured(): boolean {
    return false; // Never claim external email/SMS is operational in fallback mode
  }

  public async sendNotification(
    payload: NotificationPayload
  ): Promise<NotificationDeliveryResult> {
    if (config.nodeEnv !== 'test') {
      console.log(
        `[NotificationProvider:Fallback] Simulated delivery to ${payload.recipientId} (${payload.recipientEmail || 'no-email'}): "${payload.title}"`
      );
    }

    return {
      success: true,
      provider: this.providerName,
      deliveryId: `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      isMockOrFallback: true,
    };
  }
}
