export interface NotificationPayload {
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationDeliveryResult {
  success: boolean;
  provider: string;
  deliveryId?: string;
  isMockOrFallback: boolean;
  error?: string;
}

export interface IExternalNotificationProvider {
  readonly providerName: string;
  isConfigured(): boolean;
  sendNotification(payload: NotificationPayload): Promise<NotificationDeliveryResult>;
}
