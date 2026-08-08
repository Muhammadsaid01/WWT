import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { CommentStatus } from '../../enums/community.enum';
import { Member, TotalCounter } from '../member/member';
import { BoardArticle } from './board-acticle';
import { MeLiked } from './like';

@ObjectType()
export class CommentEntity {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  articleId: ObjectId;

  @Field(() => String)
  memberId: ObjectId;

  @Field(() => String, { nullable: true })
  parentCommentId?: ObjectId;

  @Field(() => String)
  commentContent: string;

  @Field(() => Int)
  commentLikeCount: number;

  @Field(() => CommentStatus)
  commentStatus: CommentStatus;

  @Field(() => Date, { nullable: true })
  commentDeletedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Member, { nullable: true })
  memberData?: Member;

  @Field(() => BoardArticle, { nullable: true })
  articleData?: BoardArticle;

  @Field(() => [MeLiked], { nullable: true })
  meLiked?: MeLiked[];
}
@ObjectType()
export class Comments {
  @Field(() => [CommentEntity])
  list: CommentEntity[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
