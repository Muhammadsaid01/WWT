import { Schema } from 'mongoose';
import { FaqCategory, FaqStatus } from '../../libs/enums/faq.enum';

const FaqSchema = new Schema(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      immutable: true,
    },
    faqCategory: {
      type: String,
      enum: FaqCategory,
      required: true,
    },
    faqStatus: {
      type: String,
      enum: FaqStatus,
      default: FaqStatus.DRAFT,
      required: true,
    },
    faqQuestion: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 300,
    },
    faqAnswer: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 5000,
    },
    faqOrder: {
      type: Number,
      default: 0,
      min: 0,
      max: 100000,
    },
  },
  {
    timestamps: true,
    collection: 'faqs',
  },
);

FaqSchema.index({ faqStatus: 1, faqCategory: 1, faqOrder: 1, _id: 1 });
FaqSchema.index({ adminId: 1 });

export default FaqSchema;
