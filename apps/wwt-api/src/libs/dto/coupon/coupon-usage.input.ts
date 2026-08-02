import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';

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

@InputType()
export class CouponUsageInquiry {
  @Field(() => Int)
  @Min(1)
  page: number;

  @Field(() => Int)
  @Min(1)
  limit: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  sort?: string;

  @IsOptional()
  @Field(() => Direction, { nullable: true })
  direction?: Direction;
}
