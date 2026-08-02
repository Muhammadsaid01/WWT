import { Field, Float, InputType, Int } from '@nestjs/graphql';
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { CouponStatus, CouponType } from '../../enums/coupon.enum';

@InputType()
export class CouponUpdate {
  @IsMongoId()
  @Field(() => String)
  couponId: string;

  @IsOptional()
  @IsString()
  @Length(3, 100)
  @Field(() => String, { nullable: true })
  couponTitle?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  couponDesc?: string;

  @IsOptional()
  @IsEnum(CouponType)
  @Field(() => CouponType, { nullable: true })
  couponType?: CouponType;

  @IsOptional()
  @Min(0.01)
  @Field(() => Float, { nullable: true })
  couponValue?: number;

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

  @IsOptional()
  @Min(1)
  @Field(() => Int, { nullable: true })
  perUserLimit?: number;

  @IsOptional()
  @IsDateString()
  @Field(() => String, { nullable: true })
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  @Field(() => String, { nullable: true })
  validUntil?: string;

  @IsOptional()
  @IsEnum(CouponStatus)
  @Field(() => CouponStatus, { nullable: true })
  couponStatus?: CouponStatus;
}
