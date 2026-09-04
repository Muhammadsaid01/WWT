import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';

@ObjectType()
export class PackageTag {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  packageId: ObjectId;

  @Field(() => String)
  tagName: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
