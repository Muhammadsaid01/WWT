import { Schema } from 'mongoose';
import { LikeTargetType } from '../libs/enums/community.enum';

const LikeSchema = new Schema(
  {
    memberId: {
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
      enum: LikeTargetType,
      required: true,
    },

    likeDeletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'likes',
  },
);

// Bir user bitta obyektga faqat bir marta like bosishi mumkin
LikeSchema.index(
  {
    memberId: 1,
    targetId: 1,
    targetType: 1,
  },
  {
    unique: true,
  },
);

// Target bo'yicha like larni tez topish
LikeSchema.index({
  targetId: 1,
  targetType: 1,
});

// Userning barcha like larini topish
LikeSchema.index({
  memberId: 1,
});

export default LikeSchema;
