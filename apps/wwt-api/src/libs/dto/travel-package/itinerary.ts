import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';

@ObjectType()
export class Itinerary {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  packageId: ObjectId;

  @Field(() => Int)
  dayNumber: number;

  @Field(() => String)
  title: string;

  @Field(() => String)
  description: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
