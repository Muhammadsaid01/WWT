import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { ReportEntity, Reports } from '../../libs/dto/system/report';
import {
  ReportInput,
  ReportsInquiry,
  UpdateReportStatusInput,
} from '../../libs/dto/system/report.input';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ReportService } from './report.service';

@Resolver()
export class ReportResolver {
  constructor(private readonly reportService: ReportService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => ReportEntity)
  public async createReport(
    @Args('input') input: ReportInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<ReportEntity> {
    console.log('Mutation: createReport');

    return this.reportService.createReport(memberId, input);
  }

  @UseGuards(RolesGuard)
  @Roles(MemberType.ADMIN)
  @Query(() => Reports)
  public async getReports(@Args('input') input: ReportsInquiry): Promise<Reports> {
    console.log('Query: getReports');

    return this.reportService.getReports(input);
  }

  @UseGuards(AuthGuard)
  @Query(() => ReportEntity)
  public async getReport(
    @Args('reportId', { type: () => String })
    reportId: string,

    @AuthMember('_id')
    memberId: ObjectId,

    @AuthMember('memberType')
    memberType: MemberType,
  ): Promise<ReportEntity> {
    console.log('Query: getReport');

    return this.reportService.getReport(memberId, memberType, shapeIntoMongoObjectId(reportId));
  }

  @UseGuards(AuthGuard)
  @Query(() => Reports)
  public async getMyReports(
    @Args('input') input: ReportsInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Reports> {
    console.log('Query: getMyReports');

    return this.reportService.getMyReports(memberId, input);
  }

  @UseGuards(RolesGuard)
  @Roles(MemberType.ADMIN)
  @Mutation(() => ReportEntity)
  public async updateReportStatusByAdmin(
    @Args('input') input: UpdateReportStatusInput,
    @AuthMember('_id') adminId: ObjectId,
  ): Promise<ReportEntity> {
    console.log('Mutation: updateReportStatusByAdmin');

    return this.reportService.updateReportStatusByAdmin(adminId, input);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberType.ADMIN)
  @Mutation(() => ReportEntity)
  public async deleteReportByAdmin(
    @Args('reportId', { type: () => String })
    reportId: string,
  ): Promise<ReportEntity> {
    console.log('Mutation: deleteReportByAdmin');

    return this.reportService.deleteReportByAdmin(shapeIntoMongoObjectId(reportId));
  }
}
