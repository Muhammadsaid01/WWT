/* eslint-disable prettier/prettier */
import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';
import { ReviewStatus } from '../../enums/community.enum';

@InputType()
export class ReviewInput {
  @IsNotEmpty()
  @Field(() => String)
  bookingId: string;

  @Min(1)
  @Max(5)
  @Field(() => Float)
  reviewRating: number;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  reviewTitle?: string;

  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  reviewContent: string;
}

@InputType()
class RISearch {
  @IsOptional()
  @IsEnum(ReviewStatus)
  @Field(() => ReviewStatus, { nullable: true })
  reviewStatus?: ReviewStatus;

  @IsOptional()
  @Field(() => String, { nullable: true })
  packageId?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  agentId?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  memberId?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  text?: string;
  reviewRating: any;
}

@InputType()
export class ReviewsInquiry {
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
  @Field(() => RISearch, { nullable: true })
  search?: RISearch;
}

@InputType()
export class UpdateReviewStatusInput {
  @IsNotEmpty()
  @Field(() => String)
  reviewId: string;

  @IsNotEmpty()
  @IsEnum(ReviewStatus)
  @Field(() => ReviewStatus)
  reviewStatus: ReviewStatus;
}
