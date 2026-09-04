import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';

@ObjectType()
export class PackageExclude {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  packageId: ObjectId;

  @Field(() => String)
  title: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
