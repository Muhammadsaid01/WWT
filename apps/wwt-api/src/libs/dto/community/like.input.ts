import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ObjectId } from 'mongoose';
import { LikeTargetType } from '../../enums/community.enum';

@InputType()
export class LikeInput {
  @IsNotEmpty()
  @Field(() => String)
  memberId: ObjectId;

  @IsNotEmpty()
  @Field(() => String)
  targetId: ObjectId;

  @IsNotEmpty()
  @IsEnum(LikeTargetType)
  @Field(() => LikeTargetType)
  targetType: LikeTargetType;
}
