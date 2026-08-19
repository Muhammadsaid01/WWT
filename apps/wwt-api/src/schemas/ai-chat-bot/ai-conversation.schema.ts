import { Schema } from 'mongoose';

const AIConversationSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      unique: true,
      index: true,
    },

    lastMessage: {
      type: String,
      default: null,
    },

    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'aiConversations',
  },
);

export default AIConversationSchema;
