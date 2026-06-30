import { Schema } from 'mongoose';
import { PrivateMessageStatus, PrivateMessageType } from '../../libs/enums/chat.enum';

const PrivateMessageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'PrivateConversation',
      required: true,
    },

    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    messageType: {
      type: String,
      enum: PrivateMessageType,
      default: PrivateMessageType.TEXT,
    },

    messageContent: {
      type: String,
      default: null,
      trim: true,
    },

    messageImages: {
      type: [String],
      default: [],
    },

    messageStatus: {
      type: String,
      enum: PrivateMessageStatus,
      default: PrivateMessageStatus.SENT,
    },

    readAt: {
      type: Date,
      default: null,
    },

    messageDeletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'privateMessages',
  },
);

PrivateMessageSchema.index({ conversationId: 1, createdAt: -1 });
PrivateMessageSchema.index({ senderId: 1 });
PrivateMessageSchema.index({ receiverId: 1 });

export default PrivateMessageSchema;
