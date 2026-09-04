import { Schema } from 'mongoose';

const FollowSchema = new Schema(
  {
    followerId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    followingId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    followDeletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'follows',
  },
);

// Bir user bir userni faqat bir marta follow qiladi
FollowSchema.index(
  {
    followerId: 1,
    followingId: 1,
  },
  {
    unique: true,
  },
);

// Men kimlarni follow qilganman
FollowSchema.index({
  followerId: 1,
});

// Meni kim follow qilgan
FollowSchema.index({
  followingId: 1,
});

export default FollowSchema;
