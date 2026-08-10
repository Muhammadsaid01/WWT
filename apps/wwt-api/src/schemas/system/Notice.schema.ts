import { Schema } from 'mongoose';

const NoticeSchema = new Schema(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    noticeTitle: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },

    noticeContent: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
    },

    noticeImages: {
      type: [String],
      default: [],
    },

    noticeViewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    noticePinned: {
      type: Boolean,
      default: false,
    },

    expireAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'notices',
  },
);

NoticeSchema.index({
  noticePinned: -1,
  createdAt: -1,
});

NoticeSchema.index({
  adminId: 1,
});

/*
 * expireAt kelganda MongoDB hard delete qiladi
 */
NoticeSchema.index(
  {
    expireAt: 1,
  },
  {
    expireAfterSeconds: 0,
  },
);

export default NoticeSchema;
