import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  Min,
} from 'class-validator';
import { ScheduleStatus } from '../../enums/package.enum';

@InputType()
export class PackageScheduleInput {
  @IsNotEmpty()
  @IsMongoId()
  @Field(() => String)
  packageId: string;

  @IsNotEmpty()
  @IsDateString()
  @Field(() => String)
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  @Field(() => String)
  endDate: string;

  @IsInt()
  @Min(0)
  @Field(() => Int)
  availableSeats: number;

  @IsOptional()
  @IsEnum(ScheduleStatus)
  @Field(() => ScheduleStatus, { nullable: true })
  scheduleStatus?: ScheduleStatus;
}
