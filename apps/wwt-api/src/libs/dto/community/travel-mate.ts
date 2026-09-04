import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { TravelMatePostStatus } from '../../enums/community.enum';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class TravelMatePost {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  memberId: ObjectId;

  @Field(() => String, { nullable: true })
  departureCountry?: string;

  @Field(() => String, { nullable: true })
  departureCity?: string;

  @Field(() => String)
  destinationCountry: string;

  @Field(() => String)
  destinationCity: string;

  @Field(() => Date)
  travelDate: Date;

  @Field(() => Int)
  maxMembers: number;

  @Field(() => Int)
  currentMembers: number;

  @Field(() => String)
  matePostTitle: string;

  @Field(() => String)
  matePostContent: string;

  @Field(() => TravelMatePostStatus)
  matePostStatus: TravelMatePostStatus;

  @Field(() => Date, { nullable: true })
  matePostDeletedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Int, { nullable: true })
  matePostViewCount?: number;

  /** from aggregation */
  @Field(() => Member, { nullable: true })
  memberData?: Member;
}

@ObjectType()
export class TravelMatePosts {
  @Field(() => [TravelMatePost])
  list: TravelMatePost[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
