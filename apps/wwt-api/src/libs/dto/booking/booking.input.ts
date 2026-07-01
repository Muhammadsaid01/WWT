import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { BookingStatus } from '../../enums/booking.enum';
import { Direction } from '../../enums/common.enum';

@InputType()
export class BookingInput {
  @IsNotEmpty()
  @Field(() => String)
  packageId: string;

  @IsNotEmpty()
  @Field(() => String)
  scheduleId: string;

  @IsNotEmpty()
  @Field(() => String)
  agentId: string;

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

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  peopleCount: number;

  @IsNotEmpty()
  @Min(0)
  @Field(() => Float)
  totalPrice: number;

  @IsOptional()
  @Min(0)
  @Field(() => Float, { nullable: true })
  discountAmount?: number;

  @IsNotEmpty()
  @Min(0)
  @Field(() => Float)
  finalPrice: number;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  currency?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  couponId?: string;

  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  contactName: string;

  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  contactPhone: string;

  @IsOptional()
  @IsEmail()
  @Field(() => String, { nullable: true })
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  specialRequest?: string;
}

@InputType()
class BISearch {
  @IsOptional()
  @IsEnum(BookingStatus)
  @Field(() => BookingStatus, { nullable: true })
  bookingStatus?: BookingStatus;

  @IsOptional()
  @Field(() => String, { nullable: true })
  memberId?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  agentId?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  packageId?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  text?: string;
}

@InputType()
export class BookingsInquiry {
  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  page: number;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  limit: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  sort?: string;

  @IsOptional()
  @Field(() => Direction, { nullable: true })
  direction?: Direction;

  @IsOptional()
  @Field(() => BISearch, { nullable: true })
  search?: BISearch;
}

@InputType()
export class UpdateBookingStatusInput {
  @IsNotEmpty()
  @Field(() => String)
  bookingId: string;

  @IsNotEmpty()
  @IsEnum(BookingStatus)
  @Field(() => BookingStatus)
  bookingStatus: BookingStatus;
}

@InputType()
export class CancelBookingInput {
  @IsNotEmpty()
  @Field(() => String)
  bookingId: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  reason?: string;
}
