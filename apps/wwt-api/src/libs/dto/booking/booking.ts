import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { BookingStatus } from '../../enums/booking.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class Booking {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  bookingCode: string;

  @Field(() => String)
  memberId: ObjectId;

  @Field(() => String)
  packageId: ObjectId;

  @Field(() => String)
  scheduleId: ObjectId;

  @Field(() => String)
  agentId: ObjectId;

  @Field(() => BookingStatus)
  bookingStatus: BookingStatus;

  @Field(() => Int)
  adultCount: number;

  @Field(() => Int)
  childCount: number;

  @Field(() => Int)
  infantCount: number;

  @Field(() => Int)
  peopleCount: number;

  @Field(() => Float)
  totalPrice: number;

  @Field(() => Float)
  discountAmount: number;

  @Field(() => Float)
  finalPrice: number;

  @Field(() => String)
  currency: string;

  @Field(() => String, { nullable: true })
  couponId?: ObjectId;

  @Field(() => String)
  contactName: string;

  @Field(() => String)
  contactPhone: string;

  @Field(() => String, { nullable: true })
  contactEmail?: string;

  @Field(() => String, { nullable: true })
  specialRequest?: string;

  @Field(() => Date, { nullable: true })
  cancelledAt?: Date;

  @Field(() => Date, { nullable: true })
  bookingDeletedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class Bookings {
  @Field(() => [Booking])
  list: Booking[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
