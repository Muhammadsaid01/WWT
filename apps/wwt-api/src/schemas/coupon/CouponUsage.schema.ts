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
    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'couponUsages',
  },
);

CouponUsageSchema.index(
  {
    couponId: 1,
    memberId: 1,
    bookingId: 1,
  },
  {
    unique: true,
  },
);

export default CouponUsageSchema;
