import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import {
  PackageCategory,
  PackageLevel,
  PackageStatus,
  PackageType,
  TransportType,
} from '../../enums/package.enum';
import { Agent } from '../agent/agent';
import { MeLiked } from '../community/like';
import { TotalCounter } from '../member/member';

@ObjectType()
export class TravelPackage {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  agentId: ObjectId;

  @Field(() => String)
  packageTitle: string;

  @Field(() => String)
  packageSlug: string;

  @Field(() => String)
  packageDesc: string;

  @Field(() => String, { nullable: true })
  packageShortDesc?: string;

  @Field(() => PackageType)
  packageType: PackageType;

  @Field(() => PackageCategory)
  packageCategory: PackageCategory;

  @Field(() => PackageLevel)
  packageLevel: PackageLevel;

  @Field(() => String)
  destinationCountry: string;

  @Field(() => String)
  destinationCity: string;

  @Field(() => Int)
  packageDays: number;

  @Field(() => Int)
  packageNights: number;

  @Field(() => String, { nullable: true })
  meetingPoint?: string;

  @Field(() => Float, { nullable: true })
  latitude?: number;

  @Field(() => Float, { nullable: true })
  longitude?: number;

  @Field(() => Float)
  packagePrice: number;

  @Field(() => String)
  currency: string;

  @Field(() => Int)
  minPeople: number;

  @Field(() => Int)
  maxPeople: number;

  @Field(() => TransportType)
  transportType: TransportType;

  @Field(() => PackageStatus)
  packageStatus: PackageStatus;

  @Field(() => [String])
  packageImages: string[];

  @Field(() => Int)
  packageViewCount: number;

  @Field(() => Int)
  packageLikeCount: number;

  @Field(() => Int)
  packageBookingCount: number;

  @Field(() => Float)
  packageRating: number;

  @Field(() => Int)
  packageReviewCount: number;

  @Field(() => Float)
  packageRank: number;

  @Field(() => Date, { nullable: true })
  soldAt?: Date;

  @Field(() => Date, { nullable: true })
  deletedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  /** from aggregation **/
  @Field(() => Agent, { nullable: true })
  agentData?: Agent;
  @Field(() => [MeLiked], { nullable: true })
  meLiked?: MeLiked[];
}
@ObjectType()
export class TravelPackages {
  @Field(() => [TravelPackage])
  list: TravelPackage[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
