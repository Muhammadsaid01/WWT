import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { CommentEntity, Comments } from '../../libs/dto/community/comment';
import { CommentInput, CommentsInquiry } from '../../libs/dto/community/comment.input';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { CommentsService } from './comments.service';

@Resolver()
export class CommentsResolver {
  constructor(private readonly commentService: CommentsService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => CommentEntity)
  public async createComment(
    @Args('input') input: CommentInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<CommentEntity> {
    console.log('Mutation: createComment');

    return this.commentService.createComment(memberId, input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Comments)
  public async getCommentsByArticle(@Args('input') input: CommentsInquiry): Promise<Comments> {
    console.log('Query: getCommentsByArticle');

    if (input.search?.articleId) {
      input.search.articleId = shapeIntoMongoObjectId(input.search.articleId);
    }

    if (input.search?.parentCommentId) {
      input.search.parentCommentId = shapeIntoMongoObjectId(input.search.parentCommentId);
    }

    return await this.commentService.getCommentsByArticle(input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => CommentEntity)
  public async getComment(
    @Args('commentId', { type: () => String })
    commentId: string,
  ): Promise<CommentEntity> {
    console.log('Query: getComment');

    const targetCommentId = shapeIntoMongoObjectId(commentId);

    return this.commentService.getComment(targetCommentId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => CommentEntity)
  public async likeTargetComment(
    @Args('commentId', { type: () => String })
    commentId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<CommentEntity> {
    console.log('Mutation: likeTargetComment');

    const targetCommentId = shapeIntoMongoObjectId(commentId);

    return this.commentService.likeTargetComment(memberId, targetCommentId);
  }

  @UseGuards(AuthGuard)
  @Query(() => Comments)
  public async getMyComments(
    @Args('input') input: CommentsInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Comments> {
    console.log('Query: getMyComments');

    return this.commentService.getMyComments(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => CommentEntity)
  public async deleteComment(
    @Args('commentId', { type: () => String })
    commentId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<CommentEntity> {
    console.log('Mutation: deleteComment');

    return this.commentService.deleteComment(memberId, shapeIntoMongoObjectId(commentId));
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => CommentEntity)
  public async deleteCommentByAdmin(
    @Args('commentId', { type: () => String })
    commentId: string,
  ): Promise<CommentEntity> {
    console.log('Mutation: deleteCommentByAdmin');

    return this.commentService.deleteCommentByAdmin(shapeIntoMongoObjectId(commentId));
  }
}
