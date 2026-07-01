import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { TravelMateJoinStatus } from '../../enums/community.enum';

@ObjectType()
export class TravelMateJoin {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  travelMatePostId: ObjectId;

  @Field(() => String)
  memberId: ObjectId;

  @Field(() => TravelMateJoinStatus)
  joinStatus: TravelMateJoinStatus;

  @Field(() => String, { nullable: true })
  message?: string;

  @Field(() => Date, { nullable: true })
  joinDeletedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
