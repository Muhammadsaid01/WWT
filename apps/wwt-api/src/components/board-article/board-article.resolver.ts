import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { BoardArticle, BoardArticles } from '../../libs/dto/community/board-acticle';
// eslint-disable-next-line prettier/prettier
import {
  AllBoardArticlesInquiry,
  BoardArticleInput,
  BoardArticlesInquiry,
} from '../../libs/dto/community/board-acticle.input';
import { BoardArticleUpdate } from '../../libs/dto/community/board-acticle.update';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { BoardArticleService } from './board-article.service';

@Resolver()
export class BoardArticleResolver {
  constructor(private readonly boardArticleService: BoardArticleService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => BoardArticle)
  public async createBoardArticle(
    @Args('input') input: BoardArticleInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<BoardArticle> {
    console.log('Mutation: createBoardArticle');
    return await this.boardArticleService.createBoardArticle(memberId, input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => BoardArticle)
  public async getBoardArticle(
    @Args('articleId') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<BoardArticle> {
    console.log('Query: getBoardArticle');
    const articleId = shapeIntoMongoObjectId(input);
    return await this.boardArticleService.getBoardArticle(memberId, articleId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => BoardArticle)
  public async likeTargetBoardArticle(
    @Args('articleId', { type: () => String })
    articleId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<BoardArticle> {
    console.log('Mutation: likeTargetBoardArticle');

    const targetArticleId = shapeIntoMongoObjectId(articleId);

    return this.boardArticleService.likeTargetBoardArticle(memberId, targetArticleId);
  }

  @UseGuards(WithoutGuard)
  @Query(() => BoardArticles)
  public async getBoardArticles(
    @Args('input') input: BoardArticlesInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<BoardArticles> {
    console.log('Query: getBoardArticles');
    return await this.boardArticleService.getBoardArticles(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => BoardArticle)
  public async updateBoardArticle(
    @Args('input') input: BoardArticleUpdate,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<BoardArticle> {
    console.log('Mutation: updateBoardArticle');
    input._id = shapeIntoMongoObjectId(input._id);
    return await this.boardArticleService.updateBoardArticle(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Query(() => BoardArticles)
  public async getMyBoardArticles(
    @AuthMember('_id') memberId: ObjectId,
    @Args('input') input: BoardArticlesInquiry,
  ): Promise<BoardArticles> {
    console.log('Query: getMyBoardArticles');

    return this.boardArticleService.getMyBoardArticles(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => BoardArticle)
  public async deleteBoardArticle(
    @Args('articleId', { type: () => String })
    articleId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<BoardArticle> {
    console.log('Mutation: deleteBoardArticle');

    const targetArticleId = shapeIntoMongoObjectId(articleId);

    return this.boardArticleService.deleteBoardArticle(memberId, targetArticleId);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => BoardArticles)
  public async getAllBoardArticlesByAdmin(
    @Args('input') input: AllBoardArticlesInquiry,
  ): Promise<BoardArticles> {
    console.log('Query: getAllBoardArticlesByAdmin');
    return await this.boardArticleService.getAllBoardArticlesByAdmin(input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => BoardArticle)
  public async getBoardArticleByAdmin(
    @Args('articleId', { type: () => String })
    articleId: string,
  ): Promise<BoardArticle> {
    console.log('Query: getBoardArticleByAdmin');

    const targetArticleId = shapeIntoMongoObjectId(articleId);

    return this.boardArticleService.getBoardArticleByAdmin(targetArticleId);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => BoardArticle)
  public async updateBoardArticleByAdmin(
    @Args('input') input: BoardArticleUpdate,
  ): Promise<BoardArticle> {
    console.log('Mutation: updateBoardArticleByAdmin');

    input._id = shapeIntoMongoObjectId(input._id);

    return this.boardArticleService.updateBoardArticleByAdmin(input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => BoardArticle)
  public async deleteBoardArticleByAdmin(
    @Args('articleId', { type: () => String })
    articleId: string,
  ): Promise<BoardArticle> {
    console.log('Mutation: deleteBoardArticleByAdmin');

    const targetArticleId = shapeIntoMongoObjectId(articleId);

    return this.boardArticleService.deleteBoardArticleByAdmin(targetArticleId);
  }
}
