import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';
import {
  PackageCategory,
  PackageLevel,
  PackageStatus,
  PackageType,
  TransportType,
} from '../../enums/package.enum';
@InputType()
export class TravelPackageInput {
  @IsNotEmpty()
  @IsString()
  @Length(3, 100)
  @Field(() => String)
  packageTitle: string;

  @IsNotEmpty()
  @IsString()
  @Length(10, 3000)
  @Field(() => String)
  packageDesc: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  packageShortDesc?: string;

  @IsOptional()
  @IsEnum(PackageType)
  @Field(() => PackageType, { nullable: true })
  packageType?: PackageType;

  @IsNotEmpty()
  @IsEnum(PackageCategory)
  @Field(() => PackageCategory)
  packageCategory: PackageCategory;

  @IsOptional()
  @IsEnum(PackageLevel)
  @Field(() => PackageLevel, { nullable: true })
  packageLevel?: PackageLevel;

  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  destinationCountry: string;

  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  destinationCity: string;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  packageDays: number;

  @IsNotEmpty()
  @Min(0)
  @Field(() => Int)
  packageNights: number;

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

  @IsNotEmpty()
  @Min(0)
  @Field(() => Float)
  packagePrice: number;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  currency?: string;

  @IsOptional()
  @Min(1)
  @Field(() => Int, { nullable: true })
  minPeople?: number;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  maxPeople: number;

  @IsOptional()
  @IsEnum(TransportType)
  @Field(() => TransportType, { nullable: true })
  transportType?: TransportType;

  @IsNotEmpty()
  @Field(() => [String])
  packageImages: string[];
}

@InputType()
class TPISearch {
  @IsOptional()
  @IsEnum(PackageStatus)
  @Field(() => PackageStatus, { nullable: true })
  packageStatus?: PackageStatus;

  @IsOptional()
  @IsEnum(PackageCategory)
  @Field(() => PackageCategory, { nullable: true })
  packageCategory?: PackageCategory;

  @IsOptional()
  @Field(() => String, { nullable: true })
  destinationCountry?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  destinationCity?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  text?: string;
}

@InputType()
export class TravelPackagesInquiry {
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
  @Field(() => TPISearch, { nullable: true })
  search?: TPISearch;
}

@InputType()
export class UpdatePackageStatusInput {
  @IsNotEmpty()
  @Field(() => String)
  packageId: string;

  @IsNotEmpty()
  @IsEnum(PackageStatus)
  @Field(() => PackageStatus)
  packageStatus: PackageStatus;
}
