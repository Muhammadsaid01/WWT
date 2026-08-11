import { Schema } from 'mongoose';
import { FaqCategory } from '../../libs/enums/faq.enum';

const FaqSchema = new Schema(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    faqCategory: {
      type: String,
      enum: FaqCategory,
      required: true,
    },

    faqQuestion: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },

    faqAnswer: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
    },

    faqOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'faqs',
  },
);

FaqSchema.index({
  faqCategory: 1,
  faqOrder: 1,
});
FaqSchema.index({ adminId: 1 });

export default FaqSchema;
