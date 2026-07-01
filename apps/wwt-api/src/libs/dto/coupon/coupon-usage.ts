import { Field, Float, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';

@ObjectType()
export class CouponUsage {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  couponId: ObjectId;

  @Field(() => String)
  memberId: ObjectId;

  @Field(() => String)
  bookingId: ObjectId;

  @Field(() => Float)
  discountAmount: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
