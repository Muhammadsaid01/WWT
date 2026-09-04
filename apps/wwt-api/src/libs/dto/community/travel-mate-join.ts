import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { TravelMateJoinStatus } from '../../enums/community.enum';
import { Member, TotalCounter } from '../member/member';
import { TravelMatePost } from './travel-mate';

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

  @Field(() => Member, { nullable: true })
  memberData?: Member;

  @Field(() => String, { nullable: true })
  message?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => TravelMatePost, { nullable: true })
  travelMatePostData?: TravelMatePost;
}

@ObjectType()
export class TravelMateJoins {
  @Field(() => [TravelMateJoin])
  list: TravelMateJoin[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
