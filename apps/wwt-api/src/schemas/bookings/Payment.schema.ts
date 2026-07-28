import { Schema } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../../libs/enums/payment.enum';

const PaymentSchema = new Schema(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },

    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    agentId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Agent',
    },

    paymentMethod: {
      type: String,
      enum: PaymentMethod,
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: PaymentStatus,
      default: PaymentStatus.PENDING,
    },

    paymentAmount: {
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

    transactionId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    paymentDate: {
      type: Date,
      default: null,
    },

    refundAmount: {
      type: Number,
      default: 0,
    },

    refundReason: {
      type: String,
      default: null,
      trim: true,
    },

    refundedAt: {
      type: Date,
    },

    paymentDeletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'payments',
  },
);

PaymentSchema.index({ bookingId: 1 });
PaymentSchema.index({ memberId: 1 });
PaymentSchema.index({ paymentStatus: 1 });
PaymentSchema.index({ transactionId: 1 });

export default PaymentSchema;
