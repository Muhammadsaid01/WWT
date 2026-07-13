import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { AgentStatus, AgentVerificationStatus } from '../../enums/agent.enum';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class Agent {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  memberId: ObjectId;

  @Field(() => Member, { nullable: true })
  memberData?: Member;

  @Field(() => String)
  companyName: string;

  @Field(() => String)
  businessNumber: string;

  @Field(() => String)
  licenseNumber: string;

  @Field(() => String, { nullable: true })
  officeAddress?: string;

  @Field(() => String, { nullable: true })
  companyPhone?: string;

  @Field(() => String, { nullable: true })
  companyEmail?: string;

  @Field(() => String, { nullable: true })
  agentDesc?: string;

  @Field(() => AgentStatus)
  agentStatus: AgentStatus;

  @Field(() => AgentVerificationStatus)
  verificationStatus: AgentVerificationStatus;

  @Field(() => Float)
  agentRating: number;

  @Field(() => Int)
  agentReviewCount: number;

  @Field(() => Int)
  agentFollowerCount: number;

  @Field(() => Int)
  agentPackageCount: number;

  @Field(() => Int)
  agentBookingCount: number;

  @Field(() => Float)
  agentTotalSales: number;

  @Field(() => Date)
  agentApprovedAt: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class Agents {
  @Field(() => [Agent])
  list: Agent[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
