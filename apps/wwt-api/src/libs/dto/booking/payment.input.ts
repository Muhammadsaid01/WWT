import { Field, Float, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../../enums/payment.enum';

@InputType()
export class PaymentInput {
  @IsNotEmpty()
  @Field(() => String)
  bookingId: string;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  @Field(() => PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsNotEmpty()
  @Min(0)
  @Field(() => Float)
  paymentAmount: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  currency?: string;
}

@InputType()
export class UpdatePaymentStatusInput {
  @IsNotEmpty()
  @Field(() => String)
  paymentId: string;

  @IsNotEmpty()
  @IsEnum(PaymentStatus)
  @Field(() => PaymentStatus)
  paymentStatus: PaymentStatus;
}

@InputType()
export class RefundPaymentInput {
  @IsNotEmpty()
  @Field(() => String)
  paymentId: string;

  @IsNotEmpty()
  @Min(0)
  @Field(() => Float)
  refundAmount: number;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  refundReason?: string;
}
