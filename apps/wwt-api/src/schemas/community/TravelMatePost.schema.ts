import { Schema } from 'mongoose';
import { TravelMatePostStatus } from '../../libs/enums/community.enum';

const TravelMatePostSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    departureCountry: {
      type: String,
      default: null,
      trim: true,
    },

    departureCity: {
      type: String,
      default: null,
      trim: true,
    },

    destinationCountry: {
      type: String,
      required: true,
      trim: true,
    },

    destinationCity: {
      type: String,
      required: true,
      trim: true,
    },

    travelDate: {
      type: Date,
      required: true,
    },

    maxMembers: {
      type: Number,
      required: true,
      min: 2,
    },

    currentMembers: {
      type: Number,
      default: 1,
      min: 1,
    },

    matePostTitle: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },

    matePostContent: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
    },

    matePostStatus: {
      type: String,
      enum: TravelMatePostStatus,
      default: TravelMatePostStatus.ACTIVE,
    },

    matePostDeletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'travelMatePosts',
  },
);

TravelMatePostSchema.index({ memberId: 1 });
TravelMatePostSchema.index({ destinationCountry: 1, destinationCity: 1 });
TravelMatePostSchema.index({ travelDate: 1 });
TravelMatePostSchema.index({ matePostStatus: 1 });
TravelMatePostSchema.index({ createdAt: -1 });

export default TravelMatePostSchema;
