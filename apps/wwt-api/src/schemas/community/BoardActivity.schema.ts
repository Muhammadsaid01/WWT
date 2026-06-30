import { Schema } from 'mongoose';
import { ArticleCategory, ArticleStatus } from '../libs/enums/community.enum';

const BoardArticleSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    articleCategory: {
      type: String,
      enum: ArticleCategory,
      required: true,
    },

    articleTitle: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },

    articleContent: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
    },

    articleImages: {
      type: [String],
      default: [],
    },

    articleStatus: {
      type: String,
      enum: ArticleStatus,
      default: ArticleStatus.ACTIVE,
    },

    articleViewCount: {
      type: Number,
      default: 0,
    },

    articleLikeCount: {
      type: Number,
      default: 0,
    },

    articleCommentCount: {
      type: Number,
      default: 0,
    },

    articleDeletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'boardArticles',
  },
);

BoardArticleSchema.index({ memberId: 1 });
BoardArticleSchema.index({ articleCategory: 1, articleStatus: 1 });
BoardArticleSchema.index({ createdAt: -1 });

export default BoardArticleSchema;
