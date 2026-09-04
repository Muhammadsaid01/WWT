import { Field, Float, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../../enums/payment.enum';

@ObjectType()
export class Payment {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  bookingId: ObjectId;

  @Field(() => String)
  memberId: ObjectId;

  @Field(() => String)
  agentId: ObjectId;

  @Field(() => PaymentMethod)
  paymentMethod: PaymentMethod;

  @Field(() => PaymentStatus)
  paymentStatus: PaymentStatus;

  @Field(() => Float)
  paymentAmount: number;

  @Field(() => String)
  currency: string;

  @Field(() => String, { nullable: true })
  transactionId?: string;

  @Field(() => Date, { nullable: true })
  paymentDate?: Date;

  @Field(() => Float)
  refundAmount: number;

  @Field(() => String, { nullable: true })
  refundReason?: string;

  @Field(() => Date, { nullable: true })
  refundedAt?: Date;

  @Field(() => Date, { nullable: true })
  paymentDeletedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
