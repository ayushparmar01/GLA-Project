import mongoose from 'mongoose';
import { Notification, INotification } from '../../models/notification.model.js';
import { getDbStatus } from '../../config/db.js';
import {
  NotificationData,
  NotificationType,
  RelatedEntityType,
} from '../../types/index.js';
import { IExternalNotificationProvider } from './notificationProvider.interface.js';
import { ConsoleFallbackNotificationProvider } from './consoleFallbackProvider.js';
import { RealtimeBrokerService } from './realtimeBroker.service.js';

interface CreateNotificationParams {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: string;
  deduplicationWindowSeconds?: number;
}

export class NotificationService {
  private static instance: NotificationService;
  private externalProvider: IExternalNotificationProvider;
  private realtimeBroker: RealtimeBrokerService;

  // In-memory cache for offline resilience and tests
  private inMemoryNotifications: Map<string, NotificationData> = new Map();
  // Deduplication cache: key -> timestamp
  private recentDeduplicationKeys: Map<string, number> = new Map();

  private constructor() {
    this.externalProvider = new ConsoleFallbackNotificationProvider();
    this.realtimeBroker = RealtimeBrokerService.getInstance();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public setExternalProvider(provider: IExternalNotificationProvider): void {
    this.externalProvider = provider;
  }

  public getExternalProviderName(): string {
    return this.externalProvider.providerName;
  }

  public isExternalProviderConfigured(): boolean {
    return this.externalProvider.isConfigured();
  }

  /**
   * Creates an in-app notification from a verified application event.
   * Handles deduplication, real-time dispatch, and non-blocking external notification attempt.
   */
  public async createNotification(
    params: CreateNotificationParams
  ): Promise<NotificationData | null> {
    const {
      recipientId,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
      deduplicationWindowSeconds = 30,
    } = params;

    // Deduplication check
    const dedupKey = `${recipientId}:${type}:${relatedEntityId || 'none'}`;
    const now = Date.now();
    const lastSent = this.recentDeduplicationKeys.get(dedupKey);

    if (lastSent && now - lastSent < deduplicationWindowSeconds * 1000) {
      // Duplicate notification within the window suppressed
      return null;
    }
    this.recentDeduplicationKeys.set(dedupKey, now);

    let createdSafeData: NotificationData;

    const dbStatus = getDbStatus();
    if (dbStatus.status === 'connected') {
      try {
        const notifDoc = new Notification({
          recipientId: new mongoose.Types.ObjectId(recipientId),
          type,
          title,
          message,
          relatedEntityType,
          relatedEntityId,
          readAt: null,
          createdAt: new Date(),
        });
        await notifDoc.save();
        createdSafeData = notifDoc.toSafeObject();
      } catch (err) {
        // Fall back to in-memory store
        createdSafeData = this.saveInMemory(params);
      }
    } else {
      createdSafeData = this.saveInMemory(params);
    }

    // 1. Dispatch real-time update to the user's private channel
    this.realtimeBroker.sendToUser(recipientId, 'new_notification', {
      notification: createdSafeData,
    });

    // 2. Refresh unread count in real-time
    this.getUnreadCount(recipientId).then((unreadCount) => {
      this.realtimeBroker.sendToUser(recipientId, 'unread_count', { unreadCount });
    });

    // 3. Optional external notification delivery (non-blocking)
    this.externalProvider
      .sendNotification({
        recipientId,
        title,
        message,
        type,
        metadata: { relatedEntityType, relatedEntityId },
      })
      .catch((err) => {
        // External failures are strictly non-blocking and do not throw
        console.warn(`[NotificationService] External delivery skipped or failed: ${err.message}`);
      });

    return createdSafeData;
  }

  /**
   * Retrieves notifications for a specific user with pagination and optional read filter.
   */
  public async getNotifications(
    userId: string,
    filter?: { isRead?: boolean; limit?: number; skip?: number }
  ): Promise<{ notifications: NotificationData[]; total: number; unreadCount: number }> {
    const limit = Math.min(filter?.limit || 50, 100);
    const skip = filter?.skip || 0;

    const dbStatus = getDbStatus();
    if (dbStatus.status === 'connected') {
      try {
        const query: any = { recipientId: new mongoose.Types.ObjectId(userId) };
        if (filter?.isRead === true) {
          query.readAt = { $ne: null };
        } else if (filter?.isRead === false) {
          query.readAt = null;
        }

        const [docs, total, unreadCount] = await Promise.all([
          Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
          Notification.countDocuments(query),
          Notification.countDocuments({
            recipientId: new mongoose.Types.ObjectId(userId),
            readAt: null,
          }),
        ]);

        return {
          notifications: docs.map((d) => d.toSafeObject()),
          total,
          unreadCount,
        };
      } catch {
        return this.getNotificationsFromMemory(userId, filter);
      }
    }

    return this.getNotificationsFromMemory(userId, filter);
  }

  /**
   * Counts unread notifications for a user.
   */
  public async getUnreadCount(userId: string): Promise<number> {
    const dbStatus = getDbStatus();
    if (dbStatus.status === 'connected') {
      try {
        return await Notification.countDocuments({
          recipientId: new mongoose.Types.ObjectId(userId),
          readAt: null,
        });
      } catch {
        return this.getUnreadCountFromMemory(userId);
      }
    }
    return this.getUnreadCountFromMemory(userId);
  }

  /**
   * Marks a single notification as read if owned by the user.
   */
  public async markAsRead(notificationId: string, userId: string): Promise<NotificationData | null> {
    const dbStatus = getDbStatus();
    if (dbStatus.status === 'connected') {
      try {
        const doc = await Notification.findOne({
          _id: notificationId,
          recipientId: userId,
        });
        if (!doc) return null;

        if (!doc.readAt) {
          doc.readAt = new Date();
          await doc.save();
        }

        const safeObj = doc.toSafeObject();
        this.getUnreadCount(userId).then((count) => {
          this.realtimeBroker.sendToUser(userId, 'unread_count', { unreadCount: count });
        });
        return safeObj;
      } catch {
        return this.markAsReadInMemory(notificationId, userId);
      }
    }
    return this.markAsReadInMemory(notificationId, userId);
  }

  /**
   * Marks all unread notifications for a user as read.
   */
  public async markAllAsRead(userId: string): Promise<number> {
    const dbStatus = getDbStatus();
    if (dbStatus.status === 'connected') {
      try {
        const result = await Notification.updateMany(
          { recipientId: userId, readAt: null },
          { $set: { readAt: new Date() } }
        );
        this.realtimeBroker.sendToUser(userId, 'unread_count', { unreadCount: 0 });
        return result.modifiedCount || 0;
      } catch {
        return this.markAllAsReadInMemory(userId);
      }
    }
    return this.markAllAsReadInMemory(userId);
  }

  /**
   * Deletes a notification after validating ownership.
   */
  public async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const dbStatus = getDbStatus();
    if (dbStatus.status === 'connected') {
      try {
        const result = await Notification.findOneAndDelete({
          _id: notificationId,
          recipientId: userId,
        });
        if (result) {
          this.getUnreadCount(userId).then((count) => {
            this.realtimeBroker.sendToUser(userId, 'unread_count', { unreadCount: count });
          });
          return true;
        }
        return false;
      } catch {
        return this.deleteFromMemory(notificationId, userId);
      }
    }
    return this.deleteFromMemory(notificationId, userId);
  }

  // --- In-Memory Fallback Helpers ---

  private saveInMemory(params: CreateNotificationParams): NotificationData {
    const id = 'notif-mem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const data: NotificationData = {
      id,
      recipientId: params.recipientId,
      type: params.type,
      title: params.title,
      message: params.message,
      relatedEntityType: params.relatedEntityType,
      relatedEntityId: params.relatedEntityId,
      readAt: null,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    this.inMemoryNotifications.set(id, data);
    return data;
  }

  private getNotificationsFromMemory(
    userId: string,
    filter?: { isRead?: boolean; limit?: number; skip?: number }
  ): { notifications: NotificationData[]; total: number; unreadCount: number } {
    let list = Array.from(this.inMemoryNotifications.values()).filter(
      (n) => n.recipientId === userId
    );

    const unreadCount = list.filter((n) => !n.readAt).length;

    if (filter?.isRead === true) {
      list = list.filter((n) => Boolean(n.readAt));
    } else if (filter?.isRead === false) {
      list = list.filter((n) => !n.readAt);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const skip = filter?.skip || 0;
    const limit = filter?.limit || 50;
    const paginated = list.slice(skip, skip + limit);

    return {
      notifications: paginated,
      total: list.length,
      unreadCount,
    };
  }

  private getUnreadCountFromMemory(userId: string): number {
    return Array.from(this.inMemoryNotifications.values()).filter(
      (n) => n.recipientId === userId && !n.readAt
    ).length;
  }

  private markAsReadInMemory(notificationId: string, userId: string): NotificationData | null {
    const n = this.inMemoryNotifications.get(notificationId);
    if (!n || n.recipientId !== userId) return null;
    n.readAt = new Date().toISOString();
    n.isRead = true;
    return n;
  }

  private markAllAsReadInMemory(userId: string): number {
    let count = 0;
    for (const n of this.inMemoryNotifications.values()) {
      if (n.recipientId === userId && !n.readAt) {
        n.readAt = new Date().toISOString();
        n.isRead = true;
        count++;
      }
    }
    return count;
  }

  private deleteFromMemory(notificationId: string, userId: string): boolean {
    const n = this.inMemoryNotifications.get(notificationId);
    if (!n || n.recipientId !== userId) return false;
    return this.inMemoryNotifications.delete(notificationId);
  }

  public clearMemory(): void {
    this.inMemoryNotifications.clear();
    this.recentDeduplicationKeys.clear();
  }
}
