import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { MemberLanguage, MemberStatus, MemberType } from '../../enums/member.enum';

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
//ADMIN UPDATE
@InputType()
export class MemberUpdateByAdmin {
  @IsNotEmpty()
  @Field(() => String)
  memberId: string;

  @IsOptional()
  @IsEnum(MemberStatus)
  @Field(() => MemberStatus, { nullable: true })
  memberStatus?: MemberStatus;

  @IsOptional()
  @IsEnum(MemberType)
  @Field(() => MemberType, { nullable: true })
  memberType?: MemberType;

  @IsOptional()
  @Field(() => String, { nullable: true })
  memberNick?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  memberFullName?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  memberPhone?: string;

  @IsOptional()
  @IsEmail()
  @Field(() => String, { nullable: true })
  memberEmail?: string;
}
