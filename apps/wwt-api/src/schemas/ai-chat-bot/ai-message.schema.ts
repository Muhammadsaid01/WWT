import { Schema } from 'mongoose';
import { AIMessageRole } from '../../libs/enums/ai.enum';

const AIMessageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'AIConversation',
      required: true,
      index: true,
    },

    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },

    messageRole: {
      type: String,
      enum: AIMessageRole,
      required: true,
    },

    messageContent: {
      type: String,
      required: true,
      trim: true,
    },

    aiModel: {
      type: String,
      default: null,
    },

    inputTokens: {
      type: Number,
      default: 0,
    },

    outputTokens: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'aiMessages',
  },
);

AIMessageSchema.index({
  conversationId: 1,
  createdAt: 1,
});

export default AIMessageSchema;
