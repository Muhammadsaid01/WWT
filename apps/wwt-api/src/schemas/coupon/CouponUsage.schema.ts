import { Schema } from 'mongoose';

const CouponUsageSchema = new Schema(
  {
    couponId: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
      required: true,
    },

    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },

    discountAmount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'couponUsages',
  },
);

CouponUsageSchema.index({ couponId: 1, memberId: 1 }, { unique: true });
CouponUsageSchema.index({ bookingId: 1 });

export default CouponUsageSchema;
