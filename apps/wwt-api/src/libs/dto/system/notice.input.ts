import { Field, InputType, Int } from '@nestjs/graphql';

import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';

import { Direction } from '../../enums/common.enum';

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
  @Field(() => [String], {
    nullable: true,
  })
  noticeImages?: string[];

  @IsOptional()
  @IsBoolean()
  @Field(() => Boolean, {
    nullable: true,
  })
  noticePinned?: boolean;
}

@InputType()
class NoticeSearch {
  @IsOptional()
  @Field(() => Boolean, {
    nullable: true,
  })
  noticePinned?: boolean;

  @IsOptional()
  @IsString()
  @Field(() => String, {
    nullable: true,
  })
  text?: string;
}

@InputType()
export class NoticesInquiry {
  @Min(1)
  @Field(() => Int)
  page: number;

  @Min(1)
  @Field(() => Int)
  limit: number;

  @IsOptional()
  @Field(() => String, {
    nullable: true,
  })
  sort?: string;

  @IsOptional()
  @Field(() => Direction, {
    nullable: true,
  })
  direction?: Direction;

  @IsOptional()
  @Field(() => NoticeSearch, {
    nullable: true,
  })
  search?: NoticeSearch;
}
