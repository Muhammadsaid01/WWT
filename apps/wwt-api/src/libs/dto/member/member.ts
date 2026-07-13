import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import {
  MemberAuthType,
  MemberLanguage,
  MemberRank,
  MemberStatus,
  MemberType,
} from '../../enums/member.enum';
import { AgentProfileData } from '../agent/agent';

@ObjectType()
export class Member {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => MemberType)
  memberType: MemberType;

  @Field(() => MemberStatus)
  memberStatus: MemberStatus;

  @Field(() => MemberAuthType)
  memberAuthType: MemberAuthType;

  @Field(() => String)
  memberNick: string;

  @Field(() => String, { nullable: true })
  memberFullName?: string;

  @Field(() => String, { nullable: true })
  memberPhone?: string;

  memberPassword?: string;

  @Field(() => String, { nullable: true })
  memberEmail?: string;

  @Field(() => String, { nullable: true })
  memberImage?: string;

  @Field(() => String, { nullable: true })
  memberAddress?: string;

  @Field(() => String, { nullable: true })
  memberCountry?: string;

  @Field(() => String, { nullable: true })
  memberCity?: string;

  @Field(() => String, { nullable: true })
  memberDesc?: string;

  @Field(() => Date, { nullable: true })
  memberBirthDate?: Date;

  @Field(() => MemberLanguage)
  memberLanguage: MemberLanguage;

  @Field(() => Int)
  memberPoint: number;

  @Field(() => MemberRank)
  memberRank: MemberRank;

  @Field(() => Int)
  memberViewCount: number;

  @Field(() => Int)
  memberLikeCount: number;

  @Field(() => Int)
  memberCommentCount: number;

  @Field(() => Int)
  memberReviewCount: number;

  @Field(() => Int)
  memberBookingCount: number;

  @Field(() => Int)
  memberFollowerCount: number;

  @Field(() => Int)
  memberFollowingCount: number;

  @Field(() => Date, { nullable: true })
  memberDeletedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  accessToken?: string;

  @Field(() => AgentProfileData, { nullable: true })
  agentData?: AgentProfileData;
}

@ObjectType()
export class TotalCounter {
  @Field(() => Int, { nullable: true })
  total?: number;
}

@ObjectType()
export class Members {
  @Field(() => [Member])
  list: Member[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter: TotalCounter[];
}
