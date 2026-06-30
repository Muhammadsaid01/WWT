import { Schema } from 'mongoose';
import { CommentStatus } from '../../libs/enums/community.enum';

const CommentSchema = new Schema(
  {
    articleId: {
      type: Schema.Types.ObjectId,
      ref: 'BoardArticle',
      required: true,
    },

    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },

    commentContent: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },

    commentLikeCount: {
      type: Number,
      default: 0,
    },

    commentStatus: {
      type: String,
      enum: CommentStatus,
      default: CommentStatus.ACTIVE,
    },

    commentDeletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'comments',
  },
);

CommentSchema.index({ articleId: 1 });
CommentSchema.index({ memberId: 1 });
CommentSchema.index({ parentCommentId: 1 });
CommentSchema.index({ articleId: 1, commentStatus: 1 });
CommentSchema.index({ createdAt: -1 });

export default CommentSchema;
