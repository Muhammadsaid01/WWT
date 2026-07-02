import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';
import { NoticeStatus } from '../../enums/notice.enum';

@InputType()
export class NoticeInput {
  @IsNotEmpty()
  @IsString()
  @Length(3, 300)
  @Field(() => String)
  noticeTitle: string;

  @IsNotEmpty()
  @IsString()
  @Length(10, 10000)
  @Field(() => String)
  noticeContent: string;

  @IsOptional()
  @Field(() => [String], { nullable: true })
  noticeImages?: string[];

  @IsOptional()
  @IsBoolean()
  @Field(() => Boolean, { nullable: true })
  noticePinned?: boolean;
}

@InputType()
class NoticeSearch {
  @IsOptional()
  @IsEnum(NoticeStatus)
  @Field(() => NoticeStatus, { nullable: true })
  noticeStatus?: NoticeStatus;

  @IsOptional()
  @Field(() => Boolean, { nullable: true })
  noticePinned?: boolean;

  @IsOptional()
  @Field(() => String, { nullable: true })
  text?: string;
}

@InputType()
export class NoticesInquiry {
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
  @Field(() => NoticeSearch, { nullable: true })
  search?: NoticeSearch;
}

@InputType()
export class UpdateNoticeStatusInput {
  @IsNotEmpty()
  @Field(() => String)
  noticeId: string;

  @IsNotEmpty()
  @IsEnum(NoticeStatus)
  @Field(() => NoticeStatus)
  noticeStatus: NoticeStatus;
}
