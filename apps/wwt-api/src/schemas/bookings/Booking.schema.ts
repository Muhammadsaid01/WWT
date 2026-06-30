import { Schema } from 'mongoose';
import { BookingStatus } from '../../libs/enums/booking.enum';

const BookingSchema = new Schema(
  {
    bookingCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'TravelPackage',
      required: true,
    },

    scheduleId: {
      type: Schema.Types.ObjectId,
      ref: 'PackageSchedule',
      required: true,
    },

    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
      required: true,
    },

    bookingStatus: {
      type: String,
      enum: BookingStatus,
      default: BookingStatus.PENDING,
    },

    adultCount: {
      type: Number,
      default: 1,
      min: 0,
    },

    childCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    infantCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    peopleCount: {
      type: Number,
      required: true,
      min: 1,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    finalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },

    couponId: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null,
    },

    contactName: {
      type: String,
      required: true,
      trim: true,
    },

    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },

    contactEmail: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
    },

    specialRequest: {
      type: String,
      default: null,
      trim: true,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    bookingDeletedAt: {
      type: Date,
    },
  },
  { timestamps: true, collection: 'bookings' },
);

BookingSchema.index({ bookingCode: 1 });
BookingSchema.index({ memberId: 1 });
BookingSchema.index({ packageId: 1 });
BookingSchema.index({ agentId: 1 });
BookingSchema.index({ bookingStatus: 1 });
BookingSchema.index({ createdAt: -1 });
BookingSchema.index({ scheduleId: 1 });

// Compound Index
BookingSchema.index({ agentId: 1, bookingStatus: 1 });
BookingSchema.index({ memberId: 1, bookingStatus: 1 });

export default BookingSchema;
