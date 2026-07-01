import { Field, Float, InputType } from '@nestjs/graphql';
import { IsNotEmpty, Min } from 'class-validator';

@InputType()
export class CouponUsageInput {
  @IsNotEmpty()
  @Field(() => String)
  couponId: string;

  @IsNotEmpty()
  @Field(() => String)
  bookingId: string;

  @IsNotEmpty()
  @Min(0)
  @Field(() => Float)
  discountAmount: number;
}
