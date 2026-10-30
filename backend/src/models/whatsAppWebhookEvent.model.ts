import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import {
  WhatsAppWebhookEventData,
  WhatsAppWebhookEventProcessingStatus,
} from '../types/index.js';

export interface IWhatsAppWebhookEvent extends Document {
  eventId: string;
  eventType: string;
  status: WhatsAppWebhookEventProcessingStatus;
  payload?: Record<string, unknown>;
  errorMessage?: string;
  processedAt: Date;
  createdAt: Date;
  toSafeObject(): WhatsAppWebhookEventData;
}

const WhatsAppWebhookEventSchema = new Schema<IWhatsAppWebhookEvent>(
  {
    eventId: {
      type: String,
      required: [true, 'Webhook event ID is required for idempotency'],
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      default: 'messages',
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['RECEIVED', 'PROCESSED', 'FAILED', 'DUPLICATE'],
      default: 'RECEIVED',
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
    },
    errorMessage: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

WhatsAppWebhookEventSchema.methods.toSafeObject = function (
  this: IWhatsAppWebhookEvent
): WhatsAppWebhookEventData {
  return {
    id: (this._id as Types.ObjectId).toString(),
    eventId: this.eventId,
    eventType: this.eventType,
    status: this.status,
    processedAt: this.processedAt ? this.processedAt.toISOString() : new Date().toISOString(),
  };
};

export const WhatsAppWebhookEvent: Model<IWhatsAppWebhookEvent> = mongoose.model<IWhatsAppWebhookEvent>(
  'WhatsAppWebhookEvent',
  WhatsAppWebhookEventSchema
);
