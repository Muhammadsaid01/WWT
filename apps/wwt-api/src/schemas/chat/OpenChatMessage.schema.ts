import { Schema } from 'mongoose';

const OpenChatMessageSchema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },
    messageContent: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
    collection: 'openChatMessages',
  },
);

OpenChatMessageSchema.index({ createdAt: -1, _id: -1 });

export default OpenChatMessageSchema;
