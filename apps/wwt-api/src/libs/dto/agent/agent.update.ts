import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { AgentStatus, AgentVerificationStatus } from '../../enums/agent.enum';

@InputType()
export class AgentUpdate {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  @Field(() => String, { nullable: true })
  companyName?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  officeAddress?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  companyPhone?: string;

  @IsOptional()
  @IsEmail()
  @Field(() => String, { nullable: true })
  companyEmail?: string;

  @IsOptional()
  @IsString()
  @Length(10, 1000)
  @Field(() => String, { nullable: true })
  agentDesc?: string;
}

@InputType()
export class UpdateAgentByAdmin {
  @IsNotEmpty()
  @Field(() => String)
  agentId: string;

  @IsOptional()
  @IsEnum(AgentStatus)
  @Field(() => AgentStatus, { nullable: true })
  agentStatus?: AgentStatus;

  @IsOptional()
  @IsEnum(AgentVerificationStatus)
  @Field(() => AgentVerificationStatus, { nullable: true })
  verificationStatus?: AgentVerificationStatus;
}
