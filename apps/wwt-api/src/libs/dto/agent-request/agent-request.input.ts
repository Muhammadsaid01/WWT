import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { AgentRequestStatus } from '../../enums/agent-request.enum';
import { Direction } from '../../enums/common.enum';

@InputType()
export class AgentRequestInput {
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  @Field(() => String)
  companyName: string;

  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  businessNumber: string;

  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  licenseNumber: string;

  @IsNotEmpty()
  @IsString()
  @Length(10, 1000)
  @Field(() => String)
  agentDescription: string;
}

@InputType()
class ARSearch {
  @IsOptional()
  @IsEnum(AgentRequestStatus)
  @Field(() => AgentRequestStatus, { nullable: true })
  requestStatus?: AgentRequestStatus;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  text?: string;
}

@InputType()
export class AgentRequestRejectInput {
  @IsNotEmpty()
  @IsString()
  @Length(2, 500)
  @Field(() => String)
  rejectReason: string;
}

@InputType()
export class AgentRequestsInquiry {
  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  page: number;

  @IsNotEmpty()
  @Min(1)
  @Max(100)
  @Field(() => Int)
  limit: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  sort?: string;

  @IsOptional()
  @Field(() => Direction, { nullable: true })
  direction?: Direction;

  @IsOptional()
  @Field(() => ARSearch, { nullable: true })
  search?: ARSearch;
}
