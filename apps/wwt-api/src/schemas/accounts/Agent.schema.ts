import { Schema } from 'mongoose';
import { AgentStatus, AgentVerificationStatus } from '../../libs/enums/agent.enum';

const AgentSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      unique: true,
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
      unique: true,
    },

    licenseNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    officeAddress: {
      type: String,
      default: null,
    },

    companyPhone: {
      type: String,
      default: null,
      trim: true,
    },

    companyEmail: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
    },

    agentDesc: {
      type: String,
      default: null,
      trim: true,
    },

    agentStatus: {
      type: String,
      enum: AgentStatus,
      default: AgentStatus.ACTIVE,
    },

    verificationStatus: {
      type: String,
      enum: AgentVerificationStatus,
      default: AgentVerificationStatus.APPROVED,
    },

    agentRating: {
      type: Number,
      default: 0,
    },

    agentReviewCount: {
      type: Number,
      default: 0,
    },

    agentFollowerCount: {
      type: Number,
      default: 0,
    },

    agentPackageCount: {
      type: Number,
      default: 0,
    },

    agentBookingCount: {
      type: Number,
      default: 0,
    },

    agentTotalSales: {
      type: Number,
      default: 0,
    },

    agentRank: {
      type: Number,
      default: 0,
    },

    agentApprovedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, collection: 'agents' },
);

AgentSchema.index({ memberId: 1 });
AgentSchema.index({ agentStatus: 1 });
AgentSchema.index({ verificationStatus: 1 });
AgentSchema.index({ agentRank: -1 });

export default AgentSchema;
