import { Schema } from 'mongoose';
import { AgentRequestStatus } from '../../libs/enums/agent-request.enum';

const AgentRequestSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    businessNumber: {
      type: String,
      required: true,
      trim: true,
    },

    licenseNumber: {
      type: String,
      required: true,
      trim: true,
    },

    agentDescription: {
      type: String,
      required: true,
      trim: true,
    },

    requestStatus: {
      type: String,
      enum: AgentRequestStatus,
      default: AgentRequestStatus.PENDING,
    },

    rejectReason: {
      type: String,
      default: null,
    },

    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, collection: 'agentRequests' },
);

AgentRequestSchema.index({ memberId: 1 });
AgentRequestSchema.index({ requestStatus: 1 });
AgentRequestSchema.index({ reviewedBy: 1 });

export default AgentRequestSchema;
