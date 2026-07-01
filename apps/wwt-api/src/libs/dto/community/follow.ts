import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';

@ObjectType()
export class Follow {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  followerId: ObjectId;

  @Field(() => String)
  followingId: ObjectId;

  @Field(() => Date, { nullable: true })
  followDeletedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
