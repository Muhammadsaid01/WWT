// eslint-disable-next-line prettier/prettier
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { BoardArticle, BoardArticles } from '../../libs/dto/community/board-acticle';
// eslint-disable-next-line prettier/prettier
import {
  AllBoardArticlesInquiry,
  BoardArticleInput,
  BoardArticlesInquiry,
} from '../../libs/dto/community/board-acticle.input';
import { BoardArticleUpdate } from '../../libs/dto/community/board-acticle.update';
import { LikeInput } from '../../libs/dto/community/like.input';
import { ViewInput } from '../../libs/dto/community/view.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ArticleStatus, LikeTargetType, ViewTargetType } from '../../libs/enums/community.enum';
import { StatisticModifier } from '../../libs/types/common';
import { LikesService } from '../likes/likes.service';
import { MemberService } from '../member/member.service';
import { ViewService } from '../view/view.service';

@Injectable()
export class BoardArticleService {
  constructor(
    @InjectModel('BoardArticle') private readonly boardArticleModel: Model<BoardArticle>,
    private memberService: MemberService,
    private viewService: ViewService,
    private likeService: LikesService,
  ) {}

  public async createBoardArticle(
    memberId: ObjectId,
    input: BoardArticleInput,
  ): Promise<BoardArticle> {
    const result = await this.boardArticleModel.create({
      ...input,
      memberId,
    });

    try {
      await this.memberService.memberStatsEditor({
        _id: memberId,
        targetKey: 'memberArticles',
        modifier: 1,
      });

      return result;
    } catch (error) {
      await this.boardArticleModel.findByIdAndDelete(result._id);

      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async getBoardArticle(
    memberId: ObjectId | null,
    articleId: ObjectId,
  ): Promise<BoardArticle> {
    const targetBoardArticle = await this.boardArticleModel.findOne({
      _id: articleId,
      articleStatus: ArticleStatus.ACTIVE,
      articleDeletedAt: null,
    });

    if (!targetBoardArticle) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    if (memberId) {
      const viewInput: ViewInput = {
        viewerId: memberId,
        targetId: articleId,
        targetType: ViewTargetType.ARTICLE,
      };

      const newView = await this.viewService.recordView(viewInput);

      if (newView) {
        await this.boardArticleStatsEditor({
          _id: articleId,
          targetKey: 'articleViewCount',
          modifier: 1,
        });

        targetBoardArticle.articleViewCount++;
      }

      const likeInput: LikeInput = {
        memberId,
        targetId: articleId,
        targetType: LikeTargetType.ARTICLE,
      };

      targetBoardArticle.meLiked = await this.likeService.checkLikeExistence(likeInput);
    }

    targetBoardArticle.memberData = await this.memberService.getMember(
      null,
      targetBoardArticle.memberId,
    );

    return targetBoardArticle;
  }

  public async likeTargetBoardArticle(
    memberId: ObjectId,
    targetId: ObjectId,
  ): Promise<BoardArticle> {
    const target = await this.boardArticleModel
      .findOne({
        _id: targetId,
        articleStatus: ArticleStatus.ACTIVE,
        articleDeletedAt: null,
      })
      .exec();

    if (!target) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const input: LikeInput = {
      memberId,
      targetId,
      targetType: LikeTargetType.ARTICLE,
    };

    const modifier = await this.likeService.toggleLike(input);

    const result = await this.boardArticleStatsEditor({
      _id: targetId,
      targetKey: 'articleLikeCount',
      modifier,
    });

    if (!result) {
      throw new BadRequestException(Message.UPDATE_FAILED);
    }

    return result;
  }

  public async updateBoardArticle(
    memberId: ObjectId,
    input: BoardArticleUpdate,
  ): Promise<BoardArticle> {
    const { _id, articleStatus, ...updateFields } = input;

    const targetArticle = await this.boardArticleModel.findOne({
      _id,
      memberId,
      articleDeletedAt: null,
    });

    if (!targetArticle) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    if (targetArticle.articleStatus === ArticleStatus.BLOCKED) {
      throw new ForbiddenException('Blocked article cannot be updated.');
    }

    const allowedStatuses: ArticleStatus[] = [
      ArticleStatus.DRAFT,
      ArticleStatus.ACTIVE,
      ArticleStatus.HIDDEN,
    ];

    if (articleStatus && !allowedStatuses.includes(articleStatus)) {
      throw new BadRequestException('You can only set article status to DRAFT, ACTIVE, or HIDDEN.');
    }

    const updateData: Record<string, unknown> = {
      ...updateFields,
    };

    if (articleStatus) {
      updateData.articleStatus = articleStatus;
    }

    const result = await this.boardArticleModel.findOneAndUpdate(
      {
        _id,
        memberId,
        articleDeletedAt: null,
        articleStatus: {
          $ne: ArticleStatus.BLOCKED,
        },
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!result) {
      throw new BadRequestException(Message.UPDATE_FAILED);
    }

    return result;
  }
  public async boardArticleStatsEditor(input: StatisticModifier): Promise<BoardArticle> {
    const { _id, targetKey, modifier } = input;
    const result = await this.boardArticleModel
      .findByIdAndUpdate(
        _id,
        {
          $inc: { [targetKey]: modifier },
        },
        { new: true },
      )
      .exec();
    if (!result) {
      throw new InternalServerErrorException(Message.UPDATE_FAILED);
    }

    return result;
  }
  public async getBoardArticles(
    memberId: ObjectId | null,
    input: BoardArticlesInquiry,
  ): Promise<BoardArticles> {
    const search = input.search ?? {};

    const { articleCategory, text, memberId: searchMemberId } = search;

    const match: Record<string, any> = {
      articleStatus: ArticleStatus.ACTIVE,
      articleDeletedAt: null,
    };

    if (articleCategory) {
      match.articleCategory = articleCategory;
    }

    if (searchMemberId) {
      match.memberId = shapeIntoMongoObjectId(searchMemberId);
    }

    if (text?.trim()) {
      const escapedText = text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      match.$or = [
        {
          articleTitle: {
            $regex: escapedText,
            $options: 'i',
          },
        },
        {
          articleContent: {
            $regex: escapedText,
            $options: 'i',
          },
        },
      ];
    }

    const availableBoardArticleSorts = [
      'createdAt',
      'updatedAt',
      'articleViewCount',
      'articleLikeCount',
      'articleCommentCount',
    ];

    const sortField =
      input.sort && availableBoardArticleSorts.includes(input.sort) ? input.sort : 'createdAt';

    const sortDirection = input.direction === Direction.ASC ? 1 : -1;

    console.log('match:', match);

    const listPipeline: any[] = [
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
    ];

    /*
     * Like moduli tayyor bo‘lgach qo‘shamiz:
     *
     * if (memberId) {
     *   listPipeline.splice(
     *     3,
     *     0,
     *     lookupAuthMemberLiked(memberId),
     *   );
     * }
     */

    const result = await this.boardArticleModel
      .aggregate([
        {
          $match: match,
        },
        {
          $facet: {
            list: listPipeline,

            metaCounter: [
              {
                $count: 'total',
              },
            ],
          },
        },
      ])
      .exec();

    return {
      list: result[0]?.list ?? [],
      metaCounter: result[0]?.metaCounter ?? [],
    };
  }

  public async getMyBoardArticles(
    memberId: ObjectId,
    input: BoardArticlesInquiry,
  ): Promise<BoardArticles> {
    const search = input.search ?? {};

    const match: Record<string, any> = {
      memberId,
      articleDeletedAt: null,
    };

    if (search.articleCategory) {
      match.articleCategory = search.articleCategory;
    }

    if (search.articleStatus) {
      match.articleStatus = search.articleStatus;
    }

    if (search.text?.trim()) {
      const escapedText = search.text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      match.$or = [
        {
          articleTitle: {
            $regex: escapedText,
            $options: 'i',
          },
        },
        {
          articleContent: {
            $regex: escapedText,
            $options: 'i',
          },
        },
      ];
    }

    const allowedSorts = [
      'createdAt',
      'updatedAt',
      'articleViewCount',
      'articleLikeCount',
      'articleCommentCount',
    ];

    const sortField = input.sort && allowedSorts.includes(input.sort) ? input.sort : 'createdAt';

    const sortDirection = input.direction === Direction.ASC ? 1 : -1;

    const result = await this.boardArticleModel.aggregate([
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

  public async deleteBoardArticle(memberId: ObjectId, articleId: ObjectId): Promise<BoardArticle> {
    const targetArticle = await this.boardArticleModel.findOne({
      _id: articleId,
      memberId,
      articleDeletedAt: null,
    });

    if (!targetArticle) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    if (targetArticle.articleStatus === ArticleStatus.BLOCKED) {
      throw new ForbiddenException('Blocked article cannot be deleted by the member.');
    }

    const deletedArticle = await this.boardArticleModel.findOneAndUpdate(
      {
        _id: articleId,
        memberId,
        articleDeletedAt: null,
        articleStatus: {
          $ne: ArticleStatus.BLOCKED,
        },
      },
      {
        $set: {
          articleDeletedAt: new Date(),
          articleStatus: ArticleStatus.DELETED,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!deletedArticle) {
      throw new BadRequestException(Message.DELETE_FAILED);
    }

    await this.memberService.memberStatsEditor({
      _id: memberId,
      targetKey: 'memberArticles',
      modifier: -1,
    });

    return deletedArticle;
  }

  public async getAllBoardArticlesByAdmin(input: AllBoardArticlesInquiry): Promise<BoardArticles> {
    const search = input.search ?? {};

    const { articleCategory, articleStatus } = search;

    const match: Record<string, any> = {};

    if (articleStatus) {
      match.articleStatus = articleStatus;
    }

    if (articleCategory) {
      match.articleCategory = articleCategory;
    }

    const allowedSorts = [
      'createdAt',
      'updatedAt',
      'articleViewCount',
      'articleLikeCount',
      'articleCommentCount',
    ];

    const sortField = input.sort && allowedSorts.includes(input.sort) ? input.sort : 'createdAt';

    const sortDirection = input.direction === Direction.ASC ? 1 : -1;

    const result = await this.boardArticleModel
      .aggregate([
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
            ],

            metaCounter: [
              {
                $count: 'total',
              },
            ],
          },
        },
      ])
      .exec();

    return {
      list: result[0]?.list ?? [],
      metaCounter: result[0]?.metaCounter ?? [],
    };
  }
  public async getBoardArticleByAdmin(articleId: ObjectId): Promise<BoardArticle> {
    const result = await this.boardArticleModel.aggregate([
      {
        $match: {
          _id: articleId,
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

  public async updateBoardArticleByAdmin(input: BoardArticleUpdate): Promise<BoardArticle> {
    const { _id, articleStatus, ...updateFields } = input;

    const targetArticle = await this.boardArticleModel.findOne({
      _id,
      articleDeletedAt: null,
    });

    if (!targetArticle) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const allowedStatuses: ArticleStatus[] = [
      ArticleStatus.ACTIVE,
      ArticleStatus.DRAFT,
      ArticleStatus.HIDDEN,
      ArticleStatus.BLOCKED,
    ];

    if (articleStatus && !allowedStatuses.includes(articleStatus)) {
      throw new BadRequestException(
        'Admin can only set article status to ACTIVE, DRAFT, HIDDEN, or BLOCKED.',
      );
    }

    const updateData: Record<string, unknown> = {
      ...updateFields,
    };

    if (articleStatus) {
      updateData.articleStatus = articleStatus;
    }

    const result = await this.boardArticleModel.findOneAndUpdate(
      {
        _id,
        articleDeletedAt: null,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!result) {
      throw new BadRequestException(Message.UPDATE_FAILED);
    }

    return result;
  }

  public async deleteBoardArticleByAdmin(articleId: ObjectId): Promise<BoardArticle> {
    const targetArticle = await this.boardArticleModel.findOne({
      _id: articleId,
      articleDeletedAt: null,
    });

    if (!targetArticle) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const deletedArticle = await this.boardArticleModel.findOneAndUpdate(
      {
        _id: articleId,
        articleDeletedAt: null,
      },
      {
        $set: {
          articleDeletedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!deletedArticle) {
      throw new BadRequestException(Message.DELETE_FAILED);
    }

    await this.memberService.memberStatsEditor({
      _id: targetArticle.memberId,
      targetKey: 'memberArticles',
      modifier: -1,
    });

    return deletedArticle;
  }

  public async findActiveArticleById(articleId: ObjectId): Promise<BoardArticle> {
    const article = await this.boardArticleModel.findOne({
      _id: articleId,
      articleStatus: ArticleStatus.ACTIVE,
      articleDeletedAt: null,
    });

    if (!article) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return article;
  }
}
