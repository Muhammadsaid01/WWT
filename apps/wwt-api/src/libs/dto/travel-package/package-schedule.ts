import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { ScheduleStatus } from '../../enums/package.enum';

@ObjectType()
export class PackageSchedule {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  packageId: ObjectId;

  @Field(() => Date)
  startDate: Date;

  @Field(() => Date)
  endDate: Date;

  @Field(() => Int)
  availableSeats: number;

  @Field(() => ScheduleStatus)
  scheduleStatus: ScheduleStatus;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
