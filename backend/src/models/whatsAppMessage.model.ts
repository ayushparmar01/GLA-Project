import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IWhatsAppMessage extends Document {
  waMessageId?: string;
  userId?: Types.ObjectId;
  phoneNumber: string;
  direction: 'INBOUND' | 'OUTBOUND';
  messageType: 'text' | 'interactive' | 'template' | 'button' | 'system';
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'received';
  errorMessage?: string;
  createdAt: Date;
}

const WhatsAppMessageSchema = new Schema<IWhatsAppMessage>(
  {
    waMessageId: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ['INBOUND', 'OUTBOUND'],
      required: true,
      index: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'interactive', 'template', 'button', 'system'],
      default: 'text',
    },
    content: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'failed', 'received'],
      default: 'sent',
      index: true,
    },
    errorMessage: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const WhatsAppMessage: Model<IWhatsAppMessage> = mongoose.model<IWhatsAppMessage>(
  'WhatsAppMessage',
  WhatsAppMessageSchema
);
