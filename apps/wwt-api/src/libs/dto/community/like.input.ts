import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';
import { LikeTargetType } from '../../enums/community.enum';

@InputType()
export class LikeInput {
  @IsNotEmpty()
  @Field(() => String)
  targetId: string;

  @IsNotEmpty()
  @IsEnum(LikeTargetType)
  @Field(() => LikeTargetType)
  targetType: LikeTargetType;
}

@InputType()
class LISearch {
  @IsOptional()
  @Field(() => String, { nullable: true })
  memberId?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  targetId?: string;

  @IsOptional()
  @IsEnum(LikeTargetType)
  @Field(() => LikeTargetType, { nullable: true })
  targetType?: LikeTargetType;
}

@InputType()
export class LikesInquiry {
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
  @Field(() => LISearch, { nullable: true })
  search?: LISearch;
}
