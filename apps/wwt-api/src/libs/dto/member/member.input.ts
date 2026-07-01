import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';
import { MemberAuthType, MemberLanguage, MemberStatus, MemberType } from '../../enums/member.enum';

@InputType()
export class MemberInput {
  @IsNotEmpty()
  @Length(3, 20)
  @Field(() => String)
  memberNick: string;

  @IsNotEmpty()
  @Length(2, 50)
  @Field(() => String)
  memberFullName: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  memberPhone?: string;

  @IsOptional()
  @IsEmail()
  @Field(() => String, { nullable: true })
  memberEmail?: string;

  @IsNotEmpty()
  @Length(6, 20)
  @Field(() => String)
  memberPassword: string;

  @IsOptional()
  @IsEnum(MemberAuthType)
  @Field(() => MemberAuthType, { nullable: true })
  memberAuthType?: MemberAuthType;

  @IsOptional()
  @IsEnum(MemberLanguage)
  @Field(() => MemberLanguage, { nullable: true })
  memberLanguage?: MemberLanguage;
}

@InputType()
export class LoginInput {
  @IsNotEmpty()
  @Field(() => String)
  memberNick: string;

  @IsNotEmpty()
  @Field(() => String)
  memberPassword: string;
}

@InputType()
class MISearch {
  @IsOptional()
  @Field(() => MemberStatus, { nullable: true })
  memberStatus?: MemberStatus;

  @IsOptional()
  @Field(() => MemberType, { nullable: true })
  memberType?: MemberType;

  @IsOptional()
  @Field(() => String, { nullable: true })
  text?: string;
}

@InputType()
export class MembersInquiry {
  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  page: number;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  limit: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  sort?: string;

  @IsOptional()
  @Field(() => Direction, { nullable: true })
  direction?: Direction;

  @IsOptional()
  @Field(() => MISearch, { nullable: true })
  search?: MISearch;
}

// Input type for updating member status by admin
@InputType()
export class UpdateMemberStatusInput {
  @IsNotEmpty()
  @Field(() => String)
  memberId: string;

  @IsNotEmpty()
  @IsEnum(MemberStatus)
  @Field(() => MemberStatus)
  memberStatus: MemberStatus;
}

@InputType()
export class UpdateMemberTypeInput {
  @IsNotEmpty()
  @Field(() => String)
  memberId: string;

  @IsNotEmpty()
  @IsEnum(MemberType)
  @Field(() => MemberType)
  memberType: MemberType;
}
