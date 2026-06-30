import { Schema } from 'mongoose';
import { TravelMateJoinStatus } from '../../libs/enums/community.enum';

const TravelMateJoinSchema = new Schema(
  {
    travelMatePostId: {
      type: Schema.Types.ObjectId,
      ref: 'TravelMatePost',
      required: true,
    },

    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    joinStatus: {
      type: String,
      enum: TravelMateJoinStatus,
      default: TravelMateJoinStatus.PENDING,
    },

    message: {
      type: String,
      default: null,
      trim: true,
    },

    joinDeletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'travelMateJoins',
  },
);

TravelMateJoinSchema.index(
  {
    travelMatePostId: 1,
    memberId: 1,
  },
  {
    unique: true,
  },
);

TravelMateJoinSchema.index({ memberId: 1 });

TravelMateJoinSchema.index({
  travelMatePostId: 1,
  joinStatus: 1,
});

TravelMateJoinSchema.index({ createdAt: -1 });

export default TravelMateJoinSchema;
