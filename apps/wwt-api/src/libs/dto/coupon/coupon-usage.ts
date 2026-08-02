import { Field, Float, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { Booking } from '../booking/booking';
import { Member, TotalCounter } from '../member/member';
import { Coupon } from './coupon';

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

  @Field(() => Date)
  usedAt: Date;

  @Field(() => Coupon, { nullable: true })
  couponData?: Coupon;

  @Field(() => Booking, { nullable: true })
  bookingData?: Booking;

  @Field(() => Member, { nullable: true })
  memberData?: Member;
}

@ObjectType()
export class CouponUsages {
  @Field(() => [CouponUsage])
  list: CouponUsage[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
