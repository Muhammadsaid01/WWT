import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';

import { ReportStatus, ReportTargetType, ReportType } from '../../enums/report.enum';

import { TotalCounter } from '../member/member';

@ObjectType()
export class ReportEntity {
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

  @Field(() => String, { nullable: true })
  reviewedBy?: ObjectId;

  @Field(() => Date, { nullable: true })
  reviewedAt?: Date;

  @Field(() => String, { nullable: true })
  adminNote?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class Reports {
  @Field(() => [ReportEntity])
  list: ReportEntity[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
