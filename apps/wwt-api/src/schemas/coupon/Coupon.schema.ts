import { Schema } from 'mongoose';
import { CouponStatus, CouponType } from '../../libs/enums/coupon.enum';

const CouponSchema = new Schema(
  {
    couponCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    couponTitle: {
      type: String,
      required: true,
      trim: true,
    },

    couponDesc: {
      type: String,
      default: null,
      trim: true,
    },

    couponType: {
      type: String,
      enum: CouponType,
      required: true,
    },

    couponValue: {
      type: Number,
      required: true,
      min: 0,
    },

    minAmount: {
      type: Number,
      default: 0,
    },

    maxDiscount: {
      type: Number,
      default: null,
    },

    usageLimit: {
      type: Number,
      default: 0,
    },

    usedCount: {
      type: Number,
      default: 0,
    },

    perUserLimit: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },

    validFrom: {
      type: Date,
      required: true,
    },

    validUntil: {
      type: Date,
      required: true,
    },

    couponStatus: {
      type: String,
      enum: CouponStatus,
      default: CouponStatus.ACTIVE,
    },

    couponDeletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'coupons',
  },
);

CouponSchema.index({ couponCode: 1 });
CouponSchema.index({ couponStatus: 1 });
CouponSchema.index({ validFrom: 1, validUntil: 1 });

export default CouponSchema;
