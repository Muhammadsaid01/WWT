import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, Min } from 'class-validator';

@InputType()
export class BookingUpdate {
  @IsOptional()
  @Min(0)
  @Field(() => Int, { nullable: true })
  adultCount?: number;

  @IsOptional()
  @Min(0)
  @Field(() => Int, { nullable: true })
  childCount?: number;

  @IsOptional()
  @Min(0)
  @Field(() => Int, { nullable: true })
  infantCount?: number;

  @IsOptional()
  @Min(1)
  @Field(() => Int, { nullable: true })
  peopleCount?: number;

  @IsOptional()
  @Min(0)
  @Field(() => Float, { nullable: true })
  totalPrice?: number;

  @IsOptional()
  @Min(0)
  @Field(() => Float, { nullable: true })
  discountAmount?: number;

  @IsOptional()
  @Min(0)
  @Field(() => Float, { nullable: true })
  finalPrice?: number;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  currency?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  couponId?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  contactName?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  @Field(() => String, { nullable: true })
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  specialRequest?: string;
}
