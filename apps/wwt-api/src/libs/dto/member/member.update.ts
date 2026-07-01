import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { MemberLanguage } from '../../enums/member.enum';

@InputType()
export class MemberUpdate {
  @IsOptional()
  @Length(2, 50)
  @Field(() => String, { nullable: true })
  memberFullName?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  memberAddress?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  memberCountry?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  memberCity?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  memberDesc?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  memberPhone?: string;

  @IsOptional()
  @IsEmail()
  @Field(() => String, { nullable: true })
  memberEmail?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  memberImage?: string;

  @IsOptional()
  @IsEnum(MemberLanguage)
  @Field(() => MemberLanguage, { nullable: true })
  memberLanguage?: MemberLanguage;
}
