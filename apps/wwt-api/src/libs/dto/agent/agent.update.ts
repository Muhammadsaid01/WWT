import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

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
