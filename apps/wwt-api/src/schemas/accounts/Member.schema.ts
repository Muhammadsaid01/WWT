import { Schema } from 'mongoose';
import {
  MemberAuthType,
  MemberLanguage,
  MemberRank,
  MemberStatus,
  MemberType,
} from '../../libs/enums/member.enum';

const MemberSchema = new Schema(
  {
    memberType: {
      type: String,
      enum: MemberType,
      default: MemberType.USER,
    },

    memberStatus: {
      type: String,
      enum: MemberStatus,
      default: MemberStatus.ACTIVE,
    },

    memberAuthType: {
      type: String,
      enum: MemberAuthType,
      default: MemberAuthType.PHONE,
    },

    memberNick: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    memberFullName: {
      type: String,
      required: true,
      trim: true,
    },

    memberAddress: {
      type: String,
      default: null,
    },

    memberCountry: {
      type: String,
      default: null,
    },

    memberCity: {
      type: String,
      default: null,
    },

    memberDesc: {
      type: String,
      default: null,
    },

    memberBirthDate: {
      type: Date,
      default: null,
    },

    memberPhone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      default: null,
    },

    memberPassword: {
      type: String,
      select: false,
      default: null,
    },

    memberEmail: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
      default: null,
    },

    memberImage: {
      type: String,
      default: null,
    },

    memberLanguage: {
      type: String,
      enum: MemberLanguage,
      default: MemberLanguage.ENGLISH,
    },

    memberPoint: {
      type: Number,
      default: 0,
    },

    memberRank: {
      type: String,
      enum: MemberRank,
      default: MemberRank.BRONZE,
    },

    memberViewCount: {
      type: Number,
      default: 0,
    },

    memberLikeCount: {
      type: Number,
      default: 0,
    },

    memberCommentCount: {
      type: Number,
      default: 0,
    },

    memberReviewCount: {
      type: Number,
      default: 0,
    },

    memberBookingCount: {
      type: Number,
      default: 0,
    },

    memberFollowerCount: {
      type: Number,
      default: 0,
    },

    memberFollowingCount: {
      type: Number,
      default: 0,
    },

    memberOnline: {
      type: Boolean,
      default: false,
    },

    memberLastLogin: {
      type: Date,
      default: null,
    },
    memberDeletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'members',
  },
);

// Indexes
MemberSchema.index({ memberType: 1 });
MemberSchema.index({ memberStatus: 1 });
MemberSchema.index({ memberRank: 1 });

export default MemberSchema;
