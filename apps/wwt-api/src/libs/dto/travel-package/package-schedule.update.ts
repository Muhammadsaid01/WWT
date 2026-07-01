import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDateString, IsEnum, IsOptional, Min } from 'class-validator';
import { ScheduleStatus } from '../../enums/package.enum';

@InputType()
export class PackageScheduleUpdate {
  @IsOptional()
  @IsDateString()
  @Field(() => String, { nullable: true })
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @Field(() => String, { nullable: true })
  endDate?: string;

  @IsOptional()
  @Min(0)
  @Field(() => Int, { nullable: true })
  availableSeats?: number;

  @IsOptional()
  @IsEnum(ScheduleStatus)
  @Field(() => ScheduleStatus, { nullable: true })
  scheduleStatus?: ScheduleStatus;
}
