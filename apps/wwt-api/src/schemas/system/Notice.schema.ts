import { Schema } from 'mongoose';
import { NoticeStatus } from '../../libs/enums/notice.enum';

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
    },

    noticePinned: {
      type: Boolean,
      default: false,
    },

    noticeStatus: {
      type: String,
      enum: NoticeStatus,
      default: NoticeStatus.ACTIVE,
    },

    noticeDeletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'notices',
  },
);

NoticeSchema.index({ noticeStatus: 1, noticePinned: -1, createdAt: -1 });
NoticeSchema.index({ adminId: 1 });

export default NoticeSchema;
