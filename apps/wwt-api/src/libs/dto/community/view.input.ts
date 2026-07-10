import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { ViewTargetType } from '../../enums/community.enum';

@InputType()
export class ViewInput {
  @IsNotEmpty()
  @Field(() => String)
  viewerId: ObjectId;

  @IsNotEmpty()
  @Field(() => String)
  targetId: ObjectId;

  @IsNotEmpty()
  @IsEnum(ViewTargetType)
  @Field(() => ViewTargetType)
  targetType: ViewTargetType;
}

@InputType()
class VISearch {
  @IsOptional()
  @Field(() => String, { nullable: true })
  viewerId?: ObjectId;

  @IsOptional()
  @Field(() => String, { nullable: true })
  targetId?: ObjectId;

  @IsOptional()
  @IsEnum(ViewTargetType)
  @Field(() => ViewTargetType, { nullable: true })
  targetType?: ViewTargetType;
}

@InputType()
export class ViewsInquiry {
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
  @Field(() => VISearch, { nullable: true })
  search?: VISearch;
}
