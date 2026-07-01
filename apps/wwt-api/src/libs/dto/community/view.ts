import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { ViewTargetType } from '../../enums/community.enum';

@ObjectType()
export class View {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  viewerId: ObjectId;

  @Field(() => String)
  targetId: ObjectId;

  @Field(() => ViewTargetType)
  targetType: ViewTargetType;

  @Field(() => Date)
  viewedAt: Date;
}
