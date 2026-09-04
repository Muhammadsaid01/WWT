/* eslint-disable prettier/prettier */
import { Field, Float, InputType, Int } from '@nestjs/graphql';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { Direction } from '../../enums/common.enum';
import { CouponStatus, CouponType } from '../../enums/coupon.enum';

@InputType()
export class CouponInput {
  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  couponCode: string;

  @IsNotEmpty()
  @IsString()
  @Length(3, 100)
  @Field(() => String)
  couponTitle: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  couponDesc?: string;

  @IsNotEmpty()
  @IsEnum(CouponType)
  @Field(() => CouponType)
  couponType: CouponType;

  @IsNotEmpty()
  @Min(0)
  @Field(() => Float)
  couponValue: number;

  @IsOptional()
  @Min(0)
  @Field(() => Float, { nullable: true })
  minAmount?: number;

  @IsOptional()
  @Min(0)
  @Field(() => Float, { nullable: true })
  maxDiscount?: number;

  @IsOptional()
  @Min(0)
  @Field(() => Int, { nullable: true })
  usageLimit?: number;

  @Field(() => Int)
  @Min(1)
  perUserLimit: number;

  @IsNotEmpty()
  @IsDateString()
  @Field(() => String)
  validFrom: string;

  @IsNotEmpty()
  @IsDateString()
  @Field(() => String)
  validUntil: string;
}

@InputType()
export class CouponSearch {
  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  text?: string;

  @IsOptional()
  @IsEnum(CouponType)
  @Field(() => CouponType, { nullable: true })
  couponType?: CouponType;

  @IsOptional()
  @IsEnum(CouponStatus)
  @Field(() => CouponStatus, { nullable: true })
  couponStatus?: CouponStatus;
}

@InputType()
export class CouponInquiry {
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

  @IsOptional()
  @Field(() => CouponSearch, { nullable: true })
  search?: CouponSearch;
}

@InputType()
export class UpdateCouponStatusInput {
  @IsNotEmpty()
  @Field(() => String)
  couponId: string;

  @IsNotEmpty()
  @IsEnum(CouponStatus)
  @Field(() => CouponStatus)
  couponStatus: CouponStatus;
}

@InputType()
export class ValidateCouponInput {
  @Field(() => String)
  couponCode: string;

  @Field(() => Float)
  bookingAmount: number;
}
