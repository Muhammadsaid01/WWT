import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsDateString, IsEnum, IsOptional, IsString, Length, Min } from 'class-validator';
import { CouponType } from '../../enums/coupon.enum';

@InputType()
export class CouponUpdate {
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
  @Min(0)
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
  @IsDateString()
  @Field(() => String, { nullable: true })
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  @Field(() => String, { nullable: true })
  validUntil?: string;
}
