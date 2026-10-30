import mongoose from 'mongoose';
import { AuditLog } from '../models/auditLog.model.js';
import { Role } from '../types/index.js';

export interface AuditLogParams {
  actorId: string | mongoose.Types.ObjectId;
  actorRole: Role;
  action: string;
  resourceType: string;
  resourceId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
}

export class AuditLoggerService {
  /**
   * Record an audit event into the append-only AuditLog collection.
   * Fails gracefully without throwing to prevent breaking primary transactions.
   */
  static async log(params: AuditLogParams): Promise<void> {
    try {
      await AuditLog.create({
        actorId: new mongoose.Types.ObjectId(params.actorId),
        actorRole: params.actorRole,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        reason: params.reason,
        metadata: params.metadata || {},
        requestId: params.requestId,
      });
    } catch (err) {
      console.error('[AuditLogger] Failed to write audit log entry:', err);
    }
  }
}
