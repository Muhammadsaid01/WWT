import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';

@InputType()
export class FollowInput {
  @IsNotEmpty()
  @Field(() => String)
  followingId: string;
}

@InputType()
class FISearch {
  @IsOptional()
  @Field(() => String, { nullable: true })
  followerId?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  followingId?: string;
}

@InputType()
export class FollowsInquiry {
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
  @Field(() => FISearch, { nullable: true })
  search?: FISearch;
}
