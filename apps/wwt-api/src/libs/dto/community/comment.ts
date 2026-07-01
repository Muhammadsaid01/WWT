import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { CommentStatus } from '../../enums/community.enum';

@ObjectType()
export class Comment {
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
}
