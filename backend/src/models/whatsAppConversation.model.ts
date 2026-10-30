import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type WhatsAppMenuState =
  | 'MAIN_MENU'
  | 'JOBS'
  | 'APPLICATIONS'
  | 'INTERVIEWS'
  | 'PROFILE'
  | 'SKILLS'
  | 'GUIDANCE'
  | 'LINKING';

export interface IWhatsAppConversation extends Document {
  phoneNumber: string;
  userId?: Types.ObjectId;
  currentMenu: WhatsAppMenuState;
  conversationContext: Record<string, unknown>;
  lastInteractionAt: Date;
  active: boolean;
}

const WhatsAppConversationSchema = new Schema<IWhatsAppConversation>(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    currentMenu: {
      type: String,
      enum: [
        'MAIN_MENU',
        'JOBS',
        'APPLICATIONS',
        'INTERVIEWS',
        'PROFILE',
        'SKILLS',
        'GUIDANCE',
        'LINKING',
      ],
      default: 'MAIN_MENU',
    },
    conversationContext: {
      type: Schema.Types.Mixed,
      default: {},
    },
    lastInteractionAt: {
      type: Date,
      default: Date.now,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const WhatsAppConversation: Model<IWhatsAppConversation> = mongoose.model<IWhatsAppConversation>(
  'WhatsAppConversation',
  WhatsAppConversationSchema
);
