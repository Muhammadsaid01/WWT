import { Schema } from 'mongoose';
import { ViewTargetType } from '../libs/enums/community.enum';

const ViewSchema = new Schema(
  {
    viewerId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    targetType: {
      type: String,
      enum: ViewTargetType,
      required: true,
    },

    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    collection: 'views',
  },
);

ViewSchema.index({ viewerId: 1, targetId: 1, targetType: 1 }, { unique: true });
ViewSchema.index({ targetId: 1, targetType: 1 });
ViewSchema.index({ viewedAt: -1 });

export default ViewSchema;
