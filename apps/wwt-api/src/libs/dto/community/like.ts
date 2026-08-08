import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { LikeTargetType } from '../../enums/community.enum';

@ObjectType()
export class Like {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  memberId: ObjectId;

  @Field(() => String)
  targetId: ObjectId;

  @Field(() => LikeTargetType)
  targetType: LikeTargetType;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class MeLiked {
  @Field(() => String)
  memberId: ObjectId;

  @Field(() => String)
  targetId: ObjectId;

  @Field(() => LikeTargetType)
  targetType: LikeTargetType;

  @Field(() => Boolean)
  meLiked: boolean;
}
