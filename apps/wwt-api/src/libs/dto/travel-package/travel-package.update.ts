import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import {
  PackageCategory,
  PackageLevel,
  PackageStatus,
  PackageType,
  TransportType,
} from '../../enums/package.enum';

@InputType()
export class TravelPackageUpdate {
  @IsNotEmpty()
  @Field(() => String)
  _id: ObjectId;

  @IsOptional()
  @IsString()
  @Length(3, 100)
  @Field(() => String, { nullable: true })
  packageTitle?: string;

  @IsOptional()
  @IsString()
  @Length(10, 3000)
  @Field(() => String, { nullable: true })
  packageDesc?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  packageShortDesc?: string;

  @IsOptional()
  @IsEnum(PackageType)
  @Field(() => PackageType, { nullable: true })
  packageType?: PackageType;

  @IsOptional()
  @IsEnum(PackageCategory)
  @Field(() => PackageCategory, { nullable: true })
  packageCategory?: PackageCategory;

  @IsOptional()
  @IsEnum(PackageStatus)
  @Field(() => PackageStatus, { nullable: true })
  packageStatus?: PackageStatus;

  @IsOptional()
  @IsEnum(PackageLevel)
  @Field(() => PackageLevel, { nullable: true })
  packageLevel?: PackageLevel;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  destinationCountry?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  destinationCity?: string;

  @IsOptional()
  @Min(1)
  @Field(() => Int, { nullable: true })
  packageDays?: number;

  @IsOptional()
  @Min(0)
  @Field(() => Int, { nullable: true })
  packageNights?: number;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  meetingPoint?: string;

  @IsOptional()
  @Field(() => Float, { nullable: true })
  latitude?: number;

  @IsOptional()
  @Field(() => Float, { nullable: true })
  longitude?: number;

  @IsOptional()
  @Min(0)
  @Field(() => Float, { nullable: true })
  packagePrice?: number;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  currency?: string;

  @IsOptional()
  @Min(1)
  @Field(() => Int, { nullable: true })
  minPeople?: number;

  @IsOptional()
  @Min(1)
  @Field(() => Int, { nullable: true })
  maxPeople?: number;

  @IsOptional()
  @IsEnum(TransportType)
  @Field(() => TransportType, { nullable: true })
  transportType?: TransportType;

  @IsOptional()
  @Field(() => [String], { nullable: true })
  packageImages?: string[];

  soldAt?: Date;

  deletedAt?: Date;
}

@InputType()
export class DeleteTravelPackageInput {
  @IsNotEmpty()
  @Field(() => String)
  _id: ObjectId;
}
