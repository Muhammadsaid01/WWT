import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { CouponStatus, CouponType } from '../../enums/coupon.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class Coupon {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  couponCode: string;

  @Field(() => String)
  couponTitle: string;

  @Field(() => String, { nullable: true })
  couponDesc?: string;

  @Field(() => CouponType)
  couponType: CouponType;

  @Field(() => Float)
  couponValue: number;

  @Field(() => Float)
  minAmount: number;

  @Field(() => Float, { nullable: true })
  maxDiscount?: number;

  @Field(() => Int)
  usageLimit: number;

  @Field(() => Int)
  usedCount: number;

  @Field(() => Date)
  validFrom: Date;

  @Field(() => Date)
  validUntil: Date;

  @Field(() => CouponStatus)
  couponStatus: CouponStatus;

  @Field(() => Date, { nullable: true })
  couponDeletedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class Coupons {
  @Field(() => [Coupon])
  list: Coupon[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
