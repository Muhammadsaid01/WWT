import { Schema } from 'mongoose';
import {
  PackageCategory,
  PackageLevel,
  PackageStatus,
  PackageType,
  TransportType,
} from '../../libs/enums/package.enum';

const PackageSchema = new Schema(
  {
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
      required: true,
    },
    packageTitle: {
      type: String,
      required: true,
      trim: true,
    },
    packageSlug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    packageDesc: {
      type: String,
      required: true,
      trim: true,
    },

    packageShortDesc: {
      type: String,
      default: null,
      trim: true,
    },
    packageType: {
      type: String,
      enum: PackageType,
      default: PackageType.TOUR,
    },

    packageCategory: {
      type: String,
      enum: PackageCategory,
      default: PackageCategory.FAMILY,
      required: true,
    },

    packageLevel: {
      type: String,
      enum: PackageLevel,
      default: PackageLevel.STANDARD,
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

    packageDays: {
      type: Number,
      required: true,
      min: 1,
    },

    packageNights: {
      type: Number,
      required: true,
      min: 0,
    },

    meetingPoint: {
      type: String,
      default: null,
      trim: true,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    packagePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: 'USD',
      trim: true,
      uppercase: true,
    },

    minPeople: {
      type: Number,
      default: 1,
      min: 1,
    },

    maxPeople: {
      type: Number,
      required: true,
      min: 1,
    },

    transportType: {
      type: String,
      enum: TransportType,
      default: TransportType.MIXED,
    },

    packageStatus: {
      type: String,
      enum: PackageStatus,
      default: PackageStatus.ACTIVE,
    },

    packageImages: {
      type: [String],
      required: true,
    },

    packageViewCount: {
      type: Number,
      default: 0,
    },

    packageLikeCount: {
      type: Number,
      default: 0,
    },

    packageBookingCount: {
      type: Number,
      default: 0,
    },

    packageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    packageReviewCount: {
      type: Number,
      default: 0,
    },

    packageDeletedAt: {
      type: Date,
    },
  },
  { timestamps: true, collection: 'packages' },
);

PackageSchema.index({ agentId: 1 });
PackageSchema.index({ packageSlug: 1 });
PackageSchema.index({ packageStatus: 1 });
PackageSchema.index({ packageCategory: 1 });
PackageSchema.index({ destinationCountry: 1, destinationCity: 1 });
PackageSchema.index({ packagePrice: 1 });
PackageSchema.index({ packageRating: -1 });

export default PackageSchema;
