import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { lookupCommentArticle, lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { CommentEntity, Comments } from '../../libs/dto/community/comment';
import { CommentInput, CommentsInquiry } from '../../libs/dto/community/comment.input';
import { LikeInput } from '../../libs/dto/community/like.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CommentStatus, LikeTargetType } from '../../libs/enums/community.enum';
import { T } from '../../libs/types/common';
import { BoardArticleService } from '../board-article/board-article.service';
import { LikesService } from '../likes/likes.service';
import { MemberService } from '../member/member.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel('Comment')
    private readonly commentModel: Model<CommentEntity>,

    private readonly memberService: MemberService,

    private readonly boardArticleService: BoardArticleService,
    private readonly likeService: LikesService,
  ) {}

  public async createComment(memberId: ObjectId, input: CommentInput): Promise<CommentEntity> {
    const articleId = shapeIntoMongoObjectId(input.articleId);

    const targetArticle = await this.boardArticleService.findActiveArticleById(articleId);

    let parentCommentId: ObjectId | null = null;

    if (input.parentCommentId) {
      parentCommentId = shapeIntoMongoObjectId(input.parentCommentId);

      const parentComment = await this.commentModel.findOne({
        _id: parentCommentId,
        articleId,
        commentStatus: CommentStatus.ACTIVE,
        commentDeletedAt: null,
      });

      if (!parentComment) {
        throw new BadRequestException('Parent comment not found.');
      }
    }

    const result = await this.commentModel.create({
      articleId,
      memberId,
      parentCommentId,
      commentContent: input.commentContent.trim(),
    });

    await this.boardArticleService.boardArticleStatsEditor({
      _id: targetArticle._id,
      targetKey: 'articleCommentCount',
      modifier: 1,
    });

    await this.memberService.memberStatsEditor({
      _id: memberId,
      targetKey: 'memberComments',
      modifier: 1,
    });

    return result;
  }

  public async getCommentsByArticle(input: CommentsInquiry): Promise<Comments> {
    const search = input.search ?? {};

    const match: T = {
      commentStatus: CommentStatus.ACTIVE,
    };

    if (search.articleId) {
      match.articleId = search.articleId;
    }

    if (search.parentCommentId) {
      match.parentCommentId = search.parentCommentId;
    } else {
      match.parentCommentId = null;
    }

    const sort: T = {
      [input.sort ?? 'createdAt']: input.direction === Direction.ASC ? 1 : -1,
    };

    const result = await this.commentModel.aggregate([
      {
        $match: match,
      },
      {
        $sort: sort,
      },
      {
        $facet: {
          list: [
            {
              $skip: (input.page - 1) * input.limit,
            },
            {
              $limit: input.limit,
            },

            lookupMember,

            {
              $unwind: {
                path: '$memberData',
                preserveNullAndEmptyArrays: true,
              },
            },
          ],

          metaCounter: [
            {
              $count: 'total',
            },
          ],
        },
      },
    ]);

    return {
      list: result[0]?.list ?? [],
      metaCounter: result[0]?.metaCounter ?? [],
    };
  }

  public async getComment(commentId: ObjectId): Promise<CommentEntity> {
    const result = await this.commentModel.aggregate([
      {
        $match: {
          _id: commentId,
          commentStatus: CommentStatus.ACTIVE,
        },
      },

      lookupMember,

      {
        $unwind: {
          path: '$memberData',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    if (!result.length) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return result[0];
  }

  public async likeTargetComment(memberId: ObjectId, targetId: ObjectId): Promise<CommentEntity> {
    const target = await this.commentModel
      .findOne({
        _id: targetId,
        commentStatus: CommentStatus.ACTIVE,
      })
      .exec();

    if (!target) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const input: LikeInput = {
      memberId,
      targetId,
      targetType: LikeTargetType.COMMENT,
    };

    const modifier = await this.likeService.toggleLike(input);

    const result = await this.commentStatsEditor({
      _id: targetId,
      targetKey: 'commentLikeCount',
      modifier,
    });

    if (!result) {
      throw new BadRequestException(Message.UPDATE_FAILED);
    }

    return result;
  }

  public async getMyComments(memberId: ObjectId, input: CommentsInquiry): Promise<Comments> {
    const search = input.search ?? {};

    const match: Record<string, any> = {
      memberId,
      commentStatus: CommentStatus.ACTIVE,
    };

    if (search.articleId) {
      match.articleId = shapeIntoMongoObjectId(search.articleId);
    }

    if (search.parentCommentId) {
      match.parentCommentId = shapeIntoMongoObjectId(search.parentCommentId);
    }

    const allowedSorts = ['createdAt', 'updatedAt', 'commentLikeCount'];

    const sortField = input.sort && allowedSorts.includes(input.sort) ? input.sort : 'createdAt';

    const sortDirection = input.direction === Direction.ASC ? 1 : -1;

    const result = await this.commentModel.aggregate([
      {
        $match: match,
      },
      {
        $facet: {
          list: [
            {
              $sort: {
                [sortField]: sortDirection,
              },
            },
            {
              $skip: (input.page - 1) * input.limit,
            },
            {
              $limit: input.limit,
            },

            lookupMember,

            {
              $unwind: {
                path: '$memberData',
                preserveNullAndEmptyArrays: true,
              },
            },

            lookupCommentArticle,

            {
              $unwind: {
                path: '$articleData',
                preserveNullAndEmptyArrays: true,
              },
            },
          ],

          metaCounter: [
            {
              $count: 'total',
            },
          ],
        },
      },
    ]);

    return {
      list: result[0]?.list ?? [],
      metaCounter: result[0]?.metaCounter ?? [],
    };
  }

  public async deleteComment(memberId: ObjectId, commentId: ObjectId): Promise<CommentEntity> {
    const targetComment = await this.commentModel.findOne({
      _id: commentId,
      memberId,
    });

    if (!targetComment) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const deletedComment = await this.commentModel.findByIdAndDelete(commentId);

    if (!deletedComment) {
      throw new BadRequestException(Message.DELETE_FAILED);
    }

    await this.boardArticleService.boardArticleStatsEditor({
      _id: targetComment.articleId,
      targetKey: 'articleCommentCount',
      modifier: -1,
    });

    await this.memberService.memberStatsEditor({
      _id: memberId,
      targetKey: 'memberComments',
      modifier: -1,
    });

    return deletedComment;
  }

  public async deleteCommentByAdmin(commentId: ObjectId): Promise<CommentEntity> {
    const targetComment = await this.commentModel.findById(commentId);

    if (!targetComment) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const deletedComment = await this.commentModel.findByIdAndDelete(commentId);

    if (!deletedComment) {
      throw new BadRequestException(Message.DELETE_FAILED);
    }

    await this.boardArticleService.boardArticleStatsEditor({
      _id: targetComment.articleId,
      targetKey: 'articleCommentCount',
      modifier: -1,
    });

    await this.memberService.memberStatsEditor({
      _id: targetComment.memberId,
      targetKey: 'memberComments',
      modifier: -1,
    });

    return deletedComment;
  }

  public async commentStatsEditor(input: {
    _id: ObjectId;
    targetKey: string;
    modifier: number;
  }): Promise<CommentEntity> {
    const result = await this.commentModel.findByIdAndUpdate(
      input._id,
      {
        $inc: {
          [input.targetKey]: input.modifier,
        },
      },
      {
        new: true,
      },
    );

    if (!result) {
      throw new BadRequestException(Message.UPDATE_FAILED);
    }

    return result;
  }
}
