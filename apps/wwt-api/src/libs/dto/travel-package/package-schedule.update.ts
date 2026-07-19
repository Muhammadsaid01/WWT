import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDateString, IsEnum, IsInt, IsMongoId, IsOptional, Min } from 'class-validator';
import { ScheduleStatus } from '../../enums/package.enum';

@InputType()
export class PackageScheduleUpdate {
  @IsMongoId()
  @Field(() => String)
  _id: string;

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
