import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { WhatsAppAccountData, WhatsAppAccountStatus } from '../types/index.js';

export interface IWhatsAppAccount extends Document {
  userId: Types.ObjectId;
  phoneNumber: string;
  verified: boolean;
  linkedAt: Date;
  notificationsEnabled: boolean;
  jobAlertsEnabled: boolean;
  applicationUpdatesEnabled: boolean;
  interviewAlertsEnabled: boolean;
  careerTipsEnabled: boolean;
  consentAt: Date;
  consentSource: string;
  optOutAt?: Date;
  status: WhatsAppAccountStatus;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): WhatsAppAccountData;
}

const WhatsAppAccountSchema = new Schema<IWhatsAppAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for WhatsApp account'],
      unique: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    verified: {
      type: Boolean,
      default: true,
      index: true,
    },
    linkedAt: {
      type: Date,
      default: Date.now,
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    jobAlertsEnabled: {
      type: Boolean,
      default: true,
    },
    applicationUpdatesEnabled: {
      type: Boolean,
      default: true,
    },
    interviewAlertsEnabled: {
      type: Boolean,
      default: true,
    },
    careerTipsEnabled: {
      type: Boolean,
      default: true,
    },
    consentAt: {
      type: Date,
      default: Date.now,
    },
    consentSource: {
      type: String,
      default: 'WEB_PORTAL',
      trim: true,
    },
    optOutAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'OPTED_OUT', 'UNLINKED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

WhatsAppAccountSchema.methods.toSafeObject = function (this: IWhatsAppAccount): WhatsAppAccountData {
  return {
    id: (this._id as Types.ObjectId).toString(),
    userId: this.userId.toString(),
    phoneNumber: this.phoneNumber,
    verified: this.verified,
    linkedAt: this.linkedAt ? this.linkedAt.toISOString() : new Date().toISOString(),
    notificationsEnabled: this.notificationsEnabled,
    jobAlertsEnabled: this.jobAlertsEnabled,
    applicationUpdatesEnabled: this.applicationUpdatesEnabled,
    interviewAlertsEnabled: this.interviewAlertsEnabled,
    careerTipsEnabled: this.careerTipsEnabled,
    consentAt: this.consentAt ? this.consentAt.toISOString() : undefined,
    consentSource: this.consentSource,
    optOutAt: this.optOutAt ? this.optOutAt.toISOString() : undefined,
    status: this.status,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const WhatsAppAccount: Model<IWhatsAppAccount> = mongoose.model<IWhatsAppAccount>(
  'WhatsAppAccount',
  WhatsAppAccountSchema
);
