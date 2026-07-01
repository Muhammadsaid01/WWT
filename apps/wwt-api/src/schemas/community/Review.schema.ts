import { Schema } from 'mongoose';
import { ReviewStatus } from '../../libs/enums/community.enum';
const ReviewSchema = new Schema(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },

    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'TravelPackage',
      required: true,
    },

    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
      required: true,
    },

    reviewTitle: {
      type: String,
      default: null,
      trim: true,
    },

    reviewContent: {
      type: String,
      required: true,
      trim: true,
    },

    reviewRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    reviewImages: {
      type: [String],
      default: [],
    },

    reviewLikes: {
      type: Number,
      default: 0,
    },

    reviewStatus: {
      type: String,
      enum: ReviewStatus,
      default: ReviewStatus.ACTIVE,
    },

    reviewDeletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'reviews',
  },
);

ReviewSchema.index({ bookingId: 1 }, { unique: true });

ReviewSchema.index({ packageId: 1 });

ReviewSchema.index({ memberId: 1 });

ReviewSchema.index({ agentId: 1 });

ReviewSchema.index({ reviewStatus: 1 });

ReviewSchema.index({ reviewRating: -1 });

export default ReviewSchema;
