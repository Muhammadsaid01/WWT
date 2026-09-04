import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';
import { TravelMateJoinStatus } from '../../enums/community.enum';

@InputType()
export class TravelMateJoinInput {
  @IsNotEmpty()
  @Field(() => String)
  travelMatePostId: string;

  @IsOptional()
  @IsString()
  @Length(2, 500)
  @Field(() => String, { nullable: true })
  message?: string;
}

@InputType()
class TMJSearch {
  @IsOptional()
  @Field(() => String, { nullable: true })
  travelMatePostId?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  memberId?: string;

  @IsOptional()
  @IsEnum(TravelMateJoinStatus)
  @Field(() => TravelMateJoinStatus, { nullable: true })
  joinStatus?: TravelMateJoinStatus;
}

@InputType()
export class TravelMateJoinsInquiry {
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
  @Field(() => TMJSearch, { nullable: true })
  search?: TMJSearch;
}

@InputType()
export class UpdateTravelMateJoinStatusInput {
  @IsNotEmpty()
  @Field(() => String)
  joinId: string;

  @IsNotEmpty()
  @IsEnum(TravelMateJoinStatus)
  @Field(() => TravelMateJoinStatus)
  joinStatus: TravelMateJoinStatus;
}
