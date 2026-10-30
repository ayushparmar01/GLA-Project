import { Request, Response } from 'express';
import { NotificationService } from '../services/notification/notification.service.js';
import { RealtimeBrokerService } from '../services/notification/realtimeBroker.service.js';

export async function getNotifications(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { isRead, limit, skip } = req.query;
    const filter: { isRead?: boolean; limit?: number; skip?: number } = {};

    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }
    if (limit) {
      filter.limit = parseInt(limit as string, 10);
    }
    if (skip) {
      filter.skip = parseInt(skip as string, 10);
    }

    const service = NotificationService.getInstance();
    const result = await service.getNotifications(userId, filter);

    res.status(200).json({
      success: true,
      data: result.notifications,
      total: result.total,
      unreadCount: result.unreadCount,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications',
      error: error.message,
    });
  }
}

export async function getUnreadCount(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const service = NotificationService.getInstance();
    const count = await service.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to count unread notifications',
      error: error.message,
    });
  }
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    const { notificationId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const service = NotificationService.getInstance();
    const updated = await service.markAsRead(notificationId, userId);

    if (!updated) {
      res.status(404).json({
        success: false,
        message: 'Notification not found or access denied',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message,
    });
  }
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const service = NotificationService.getInstance();
    const modifiedCount = await service.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: `Marked ${modifiedCount} notifications as read`,
      data: { modifiedCount },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message,
    });
  }
}

export async function deleteNotification(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    const { notificationId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const service = NotificationService.getInstance();
    const deleted = await service.deleteNotification(notificationId, userId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Notification not found or access denied',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message,
    });
  }
}

export async function subscribeNotificationStream(req: Request, res: Response): Promise<void> {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const broker = RealtimeBrokerService.getInstance();
  broker.registerClient(userId, res);
}
