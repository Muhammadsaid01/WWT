import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';
import { ReportStatus, ReportTargetType, ReportType } from '../../enums/report.enum';

@InputType()
export class ReportInput {
  @IsNotEmpty()
  @Field(() => String)
  targetId: string;

  @IsNotEmpty()
  @IsEnum(ReportTargetType)
  @Field(() => ReportTargetType)
  targetType: ReportTargetType;

  @IsNotEmpty()
  @IsEnum(ReportType)
  @Field(() => ReportType)
  reportType: ReportType;

  @IsOptional()
  @IsString()
  @Length(2, 1000)
  @Field(() => String, { nullable: true })
  reportDesc?: string;
}

@InputType()
class ReportSearch {
  @IsOptional()
  @Field(() => String, { nullable: true })
  reporterId?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  targetId?: string;

  @IsOptional()
  @IsEnum(ReportTargetType)
  @Field(() => ReportTargetType, { nullable: true })
  targetType?: ReportTargetType;

  @IsOptional()
  @IsEnum(ReportStatus)
  @Field(() => ReportStatus, { nullable: true })
  reportStatus?: ReportStatus;
}

@InputType()
export class ReportsInquiry {
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
  @Field(() => ReportSearch, { nullable: true })
  search?: ReportSearch;
}

@InputType()
export class UpdateReportStatusInput {
  @IsNotEmpty()
  @Field(() => String)
  reportId: string;

  @IsNotEmpty()
  @IsEnum(ReportStatus)
  @Field(() => ReportStatus)
  reportStatus: ReportStatus;
}
