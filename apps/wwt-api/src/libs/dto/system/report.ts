import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { ReportStatus, ReportTargetType, ReportType } from '../../enums/report.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class Report {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  reporterId: ObjectId;

  @Field(() => String)
  targetId: ObjectId;

  @Field(() => ReportTargetType)
  targetType: ReportTargetType;

  @Field(() => ReportType)
  reportType: ReportType;

  @Field(() => String, { nullable: true })
  reportDesc?: string;

  @Field(() => ReportStatus)
  reportStatus: ReportStatus;

  @Field(() => Date, { nullable: true })
  reportDeletedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class Reports {
  @Field(() => [Report])
  list: Report[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
