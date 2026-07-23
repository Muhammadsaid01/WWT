import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDateString, IsEnum, IsInt, IsMongoId, IsOptional, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { ScheduleStatus } from '../../enums/package.enum';

@InputType()
export class PackageScheduleUpdate {
  @IsMongoId()
  @Field(() => String)
  _id: ObjectId;

  @IsMongoId()
  @Field(() => String)
  packageId: ObjectId;

  @IsOptional()
  @IsDateString()
  @Field(() => String, { nullable: true })
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @Field(() => String, { nullable: true })
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Field(() => Int, { nullable: true })
  availableSeats?: number;

  @IsOptional()
  @IsEnum(ScheduleStatus)
  @Field(() => ScheduleStatus, { nullable: true })
  scheduleStatus?: ScheduleStatus;
}

@InputType()
export class PackageScheduleUpdateByAdmin {
  @Field(() => String, { nullable: true })
  @IsOptional()
  startDate?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  endDate?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  availableSeats?: number;

  @Field(() => ScheduleStatus, { nullable: true })
  @IsOptional()
  scheduleStatus?: ScheduleStatus;
}
