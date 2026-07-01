import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';

@ObjectType()
export class PackagePolicy {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  packageId: ObjectId;

  @Field(() => String)
  cancelPolicy: string;

  @Field(() => String)
  refundPolicy: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
