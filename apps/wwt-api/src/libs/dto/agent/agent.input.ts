import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { AgentStatus, AgentVerificationStatus } from '../../enums/agent.enum';
import { Direction } from '../../enums/common.enum';

@InputType()
class AISearch {
  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  text?: string;

  @IsOptional()
  @IsEnum(AgentStatus)
  @Field(() => AgentStatus, { nullable: true })
  agentStatus?: AgentStatus;

  @IsOptional()
  @IsEnum(AgentVerificationStatus)
  @Field(() => AgentVerificationStatus, { nullable: true })
  verificationStatus?: AgentVerificationStatus;
}

@InputType()
export class AgentsInquiry {
  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  page: number;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  limit: number;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  sort?: string;

  @IsOptional()
  @Field(() => Direction, { nullable: true })
  direction?: Direction;

  @IsOptional()
  @Field(() => AISearch, { nullable: true })
  search?: AISearch;
}

@InputType()
export class UpdateAgentStatusInput {
  @IsNotEmpty()
  @Field(() => String)
  agentId: string;

  @IsNotEmpty()
  @IsEnum(AgentStatus)
  @Field(() => AgentStatus)
  agentStatus: AgentStatus;
}

@InputType()
export class UpdateAgentVerificationInput {
  @IsNotEmpty()
  @Field(() => String)
  agentId: string;

  @IsNotEmpty()
  @IsEnum(AgentVerificationStatus)
  @Field(() => AgentVerificationStatus)
  verificationStatus: AgentVerificationStatus;
}
