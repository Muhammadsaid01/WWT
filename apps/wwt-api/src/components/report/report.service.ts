import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types, mongo } from 'mongoose';
import { ReportEntity, Reports } from '../../libs/dto/system/report';
import {
  ReportInput,
  ReportsInquiry,
  UpdateReportStatusInput,
} from '../../libs/dto/system/report.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { ReportStatus, ReportTargetType } from '../../libs/enums/report.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class ReportService {
  private readonly statusTransitions: Record<ReportStatus, readonly ReportStatus[]> = {
    [ReportStatus.PENDING]: [ReportStatus.REVIEWED, ReportStatus.REJECTED, ReportStatus.RESOLVED],
    [ReportStatus.REVIEWED]: [ReportStatus.RESOLVED, ReportStatus.REJECTED],
    [ReportStatus.REJECTED]: [],
    [ReportStatus.RESOLVED]: [],
  };

  private readonly reportSortFields = new Set([
    'createdAt',
    'updatedAt',
    'reviewedAt',
    'reportStatus',
    'targetType',
    'reportType',
  ]);

  constructor(
    @InjectModel('Report')
    private readonly reportModel: Model<ReportEntity>,

    @InjectModel('Member')
    private readonly memberModel: Model<{ _id: ObjectId }>,

    @InjectModel('BoardArticle')
    private readonly boardArticleModel: Model<{ _id: ObjectId }>,

    @InjectModel('Comment')
    private readonly commentModel: Model<{ _id: ObjectId }>,

    @InjectModel('Review')
    private readonly reviewModel: Model<{ _id: ObjectId }>,

    @InjectModel('TravelMatePost')
    private readonly travelMatePostModel: Model<{ _id: ObjectId }>,
  ) {}

  public async createReport(memberId: ObjectId, input: ReportInput): Promise<ReportEntity> {
    try {
      const targetId = this.parseObjectId(input.targetId, 'Target ID');

      // Member o'zini report qila olmaydi
      if (
        input.targetType === ReportTargetType.MEMBER &&
        memberId.toString() === targetId.toString()
      ) {
        throw new BadRequestException('You cannot report yourself.');
      }

      await this.assertTargetExists(targetId, input.targetType);

      // Oldin shu targetni report qilganmi?
      const existingReport = await this.reportModel.findOne({
        reporterId: memberId,
        targetId,
        targetType: input.targetType,
      });

      if (existingReport) {
        throw new BadRequestException('You have already reported this target.');
      }

      const result = await this.reportModel.create({
        reporterId: memberId,

        targetId,
        targetType: input.targetType,

        reportType: input.reportType,
        reportDesc: input.reportDesc ?? null,

        reportStatus: ReportStatus.PENDING,
      });

      return result;
    } catch (error) {
      console.log('Error, Service createReport:', error);

      if (error instanceof mongo.MongoServerError && error.code === 11000) {
        throw new BadRequestException('You have already reported this target.');
      }

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(Message.CREATE_FAILED);
    }
  }

  public async getReports(input: ReportsInquiry): Promise<Reports> {
    const { match, sort } = this.filterReports(input);

    const result = await this.reportModel.aggregate([
      { $match: match },
      { $sort: sort },

      {
        $facet: {
          list: [
            {
              $skip: (input.page - 1) * input.limit,
            },
            {
              $limit: input.limit,
            },
          ],

          metaCounter: [
            {
              $count: 'total',
            },
          ],
        },
      },
    ]);

    return {
      list: result[0]?.list ?? [],
      metaCounter: result[0]?.metaCounter ?? [],
    };
  }

  public async getReport(
    memberId: ObjectId,
    memberType: MemberType,
    reportId: ObjectId,
  ): Promise<ReportEntity> {
    const match: T = {
      _id: reportId,
    };

    if (memberType !== MemberType.ADMIN) {
      match.reporterId = memberId;
    }

    const result = await this.reportModel.findOne(match).exec();

    if (!result) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return result;
  }

  public async getMyReports(memberId: ObjectId, input: ReportsInquiry): Promise<Reports> {
    const { match, sort } = this.filterReports(input);

    // Faqat shu userning reportlari
    match.reporterId = memberId;

    const result = await this.reportModel.aggregate([
      {
        $match: match,
      },
      {
        $sort: sort,
      },
      {
        $facet: {
          list: [
            {
              $skip: (input.page - 1) * input.limit,
            },
            {
              $limit: input.limit,
            },
          ],

          metaCounter: [
            {
              $count: 'total',
            },
          ],
        },
      },
    ]);

    return {
      list: result[0]?.list ?? [],
      metaCounter: result[0]?.metaCounter ?? [],
    };
  }

  public async updateReportStatusByAdmin(
    adminId: ObjectId,
    input: UpdateReportStatusInput,
  ): Promise<ReportEntity> {
    const reportId = this.parseObjectId(input.reportId, 'Report ID');

    const targetReport = await this.reportModel.findById(reportId);

    if (!targetReport) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    if (targetReport.reportStatus === input.reportStatus) {
      throw new BadRequestException(`Report status is already ${input.reportStatus}.`);
    }

    if (!this.statusTransitions[targetReport.reportStatus]?.includes(input.reportStatus)) {
      throw new BadRequestException(
        `Invalid report transition: ${targetReport.reportStatus} -> ${input.reportStatus}.`,
      );
    }

    targetReport.reportStatus = input.reportStatus;

    targetReport.reviewedBy = adminId;
    targetReport.reviewedAt = new Date();

    if (input.adminNote !== undefined) {
      targetReport.adminNote = input.adminNote;
    }

    return await targetReport.save();
  }

  public async deleteReportByAdmin(reportId: ObjectId): Promise<ReportEntity> {
    const result = await this.reportModel.findOneAndDelete({
      _id: reportId,
    });

    if (!result) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return result;
  }

  private filterReports(input: ReportsInquiry): { match: T; sort: T } {
    const search = input.search ?? {};

    const match: T = {};

    if (search.reporterId) {
      match.reporterId = this.parseObjectId(search.reporterId, 'Reporter ID');
    }

    if (search.targetId) {
      match.targetId = this.parseObjectId(search.targetId, 'Target ID');
    }

    if (search.targetType) {
      match.targetType = search.targetType;
    }

    if (search.reportStatus) {
      match.reportStatus = search.reportStatus;
    }

    const requestedSort = input.sort ?? 'createdAt';
    const sortField = this.reportSortFields.has(requestedSort) ? requestedSort : 'createdAt';
    const sort: T = {
      [sortField]: input.direction ?? Direction.DESC,
    };

    return {
      match,
      sort,
    };
  }

  private parseObjectId(value: string, label: string): ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`${label} must be a valid ObjectId.`);
    }

    return new Types.ObjectId(value) as unknown as ObjectId;
  }

  private async assertTargetExists(
    targetId: ObjectId,
    targetType: ReportTargetType,
  ): Promise<void> {
    const targetModels: Record<ReportTargetType, Model<{ _id: ObjectId }>> = {
      [ReportTargetType.MEMBER]: this.memberModel,
      [ReportTargetType.ARTICLE]: this.boardArticleModel,
      [ReportTargetType.COMMENT]: this.commentModel,
      [ReportTargetType.REVIEW]: this.reviewModel,
      [ReportTargetType.TRAVEL_MATE_POST]: this.travelMatePostModel,
    };

    const target = await targetModels[targetType].findById(targetId).select('_id').lean().exec();
    if (!target) {
      throw new BadRequestException('The reported target does not exist.');
    }
  }
}
