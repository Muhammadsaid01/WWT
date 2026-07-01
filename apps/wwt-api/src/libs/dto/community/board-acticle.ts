import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { ArticleCategory, ArticleStatus } from '../../enums/community.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class BoardArticle {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  memberId: ObjectId;

  @Field(() => ArticleCategory)
  articleCategory: ArticleCategory;

  @Field(() => String)
  articleTitle: string;

  @Field(() => String)
  articleContent: string;

  @Field(() => [String])
  articleImages: string[];

  @Field(() => ArticleStatus)
  articleStatus: ArticleStatus;

  @Field(() => Int)
  articleViewCount: number;

  @Field(() => Int)
  articleLikeCount: number;

  @Field(() => Int)
  articleCommentCount: number;

  @Field(() => Date, { nullable: true })
  articleDeletedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class BoardArticles {
  @Field(() => [BoardArticle])
  list: BoardArticle[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
