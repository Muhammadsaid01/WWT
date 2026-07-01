/* eslint-disable prettier/prettier */
import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { Direction } from '../../enums/common.enum';
import { TravelMatePostStatus } from '../../enums/community.enum';

@InputType()
export class TravelMatePostInput {
  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  departureCountry?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  departureCity?: string;

  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  destinationCountry: string;

  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  destinationCity: string;

  @IsNotEmpty()
  @IsDateString()
  @Field(() => String)
  travelDate: string;

  @IsNotEmpty()
  @Min(2)
  @Field(() => Int)
  maxMembers: number;

  @IsNotEmpty()
  @IsString()
  @Length(3, 200)
  @Field(() => String)
  matePostTitle: string;

  @IsNotEmpty()
  @IsString()
  @Length(10, 5000)
  @Field(() => String)
  matePostContent: string;
}

@InputType()
class TMPSearch {
  @IsOptional()
  @Field(() => String, { nullable: true })
  destinationCountry?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  destinationCity?: string;

  @IsOptional()
  @IsEnum(TravelMatePostStatus)
  @Field(() => TravelMatePostStatus, { nullable: true })
  matePostStatus?: TravelMatePostStatus;

  @IsOptional()
  @Field(() => String, { nullable: true })
  memberId?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  text?: string;
}

@InputType()
export class TravelMatePostsInquiry {
  @Field(() => Int)
  @Min(1)
  page: number;

  @Field(() => Int)
  @Min(1)
  limit: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  sort?: string;

  @IsOptional()
  @Field(() => Direction, { nullable: true })
  direction?: Direction;

  @IsOptional()
  @Field(() => TMPSearch, { nullable: true })
  search?: TMPSearch;
}

@InputType()
export class UpdateTravelMatePostStatusInput {
  @IsNotEmpty()
  @Field(() => String)
  postId: string;

  @IsNotEmpty()
  @IsEnum(TravelMatePostStatus)
  @Field(() => TravelMatePostStatus)
  matePostStatus: TravelMatePostStatus;
}
