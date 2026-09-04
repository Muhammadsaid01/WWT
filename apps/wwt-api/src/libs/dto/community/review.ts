import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { ReviewStatus } from '../../enums/community.enum';
import { Booking } from '../booking/booking';
import { Member, TotalCounter } from '../member/member';
import { TravelPackage } from '../travel-package/travel-package';
import { MeLiked } from './like';

@ObjectType()
export class Review {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  bookingId: ObjectId;

  @Field(() => String)
  packageId: ObjectId;

  @Field(() => String)
  memberId: ObjectId;

  @Field(() => String)
  agentId: ObjectId;

  @Field(() => String, { nullable: true })
  reviewTitle?: string;

  @Field(() => String)
  reviewContent: string;

  @Field(() => Float)
  reviewRating: number;

  @Field(() => [String])
  reviewImages: string[];

  @Field(() => Int)
  reviewLikes: number;

  @Field(() => ReviewStatus)
  reviewStatus: ReviewStatus;

  @Field(() => Date, { nullable: true })
  reviewDeletedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Member, { nullable: true })
  memberData?: Member;

  @Field(() => TravelPackage, { nullable: true })
  packageData?: TravelPackage;

  @Field(() => Booking, { nullable: true })
  bookingData?: Booking;

  @Field(() => [MeLiked], { nullable: true })
  meLiked?: MeLiked[];
}

@ObjectType()
export class Reviews {
  @Field(() => [Review])
  list: Review[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
