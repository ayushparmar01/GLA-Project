import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IWhatsAppLinkToken extends Document {
  userId: Types.ObjectId;
  codeHash: string;
  codeMasked?: string;
  expiresAt: Date;
  used: boolean;
  attempts: number;
  createdAt: Date;
}

const WhatsAppLinkTokenSchema = new Schema<IWhatsAppLinkToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for linking token'],
      index: true,
    },
    codeHash: {
      type: String,
      required: [true, 'Code hash is required'],
      index: true,
    },
    codeMasked: {
      type: String,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL Index automatically deletes expired tokens
    },
    used: {
      type: Boolean,
      default: false,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const WhatsAppLinkToken: Model<IWhatsAppLinkToken> = mongoose.model<IWhatsAppLinkToken>(
  'WhatsAppLinkToken',
  WhatsAppLinkTokenSchema
);
