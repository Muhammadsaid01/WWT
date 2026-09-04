import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { AgentRequestStatus } from '../../enums/agent-request.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class AgentRequest {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  memberId: ObjectId;

  @Field(() => String)
  companyName: string;

  @Field(() => String)
  businessNumber: string;

  @Field(() => String)
  licenseNumber: string;

  @Field(() => String)
  agentDescription: string;

  @Field(() => AgentRequestStatus)
  requestStatus: AgentRequestStatus;

  @Field(() => String, { nullable: true })
  rejectReason?: string;

  @Field(() => String, { nullable: true })
  reviewedBy?: ObjectId;

  @Field(() => Date, { nullable: true })
  reviewedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class AgentRequests {
  @Field(() => [AgentRequest])
  list: AgentRequest[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
