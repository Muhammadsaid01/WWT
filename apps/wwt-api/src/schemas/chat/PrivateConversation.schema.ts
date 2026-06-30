import { Schema } from 'mongoose';

const PrivateConversationSchema = new Schema(
  {
    memberOneId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    memberTwoId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    lastMessage: {
      type: String,
      default: null,
      trim: true,
    },

    lastMessageAt: {
      type: Date,
      default: null,
    },

    conversationDeletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'privateConversations',
  },
);

PrivateConversationSchema.index({ memberOneId: 1, memberTwoId: 1 }, { unique: true });

PrivateConversationSchema.index({ memberOneId: 1 });
PrivateConversationSchema.index({ memberTwoId: 1 });
PrivateConversationSchema.index({ lastMessageAt: -1 });

export default PrivateConversationSchema;
