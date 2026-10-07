import { BadRequestException } from '@nestjs/common';
import { Model, ObjectId, Types, mongo } from 'mongoose';
import { ReportService } from './report.service';
import { ReportEntity } from '../../libs/dto/system/report';
import { ReportStatus, ReportTargetType, ReportType } from '../../libs/enums/report.enum';
import { Direction } from '../../libs/enums/common.enum';

function objectId(): ObjectId {
  return new Types.ObjectId() as unknown as ObjectId;
}

function queryResult<T>(value: T) {
  return {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(value),
  };
}

function makeService() {
  const reportModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    aggregate: jest.fn(),
    findOneAndDelete: jest.fn(),
  };
  const targetModels = Array.from({ length: 5 }, () => ({ findById: jest.fn() }));
  const service = new ReportService(
    reportModel as unknown as Model<ReportEntity>,
    targetModels[0] as unknown as Model<{ _id: ObjectId }>,
    targetModels[1] as unknown as Model<{ _id: ObjectId }>,
    targetModels[2] as unknown as Model<{ _id: ObjectId }>,
    targetModels[3] as unknown as Model<{ _id: ObjectId }>,
    targetModels[4] as unknown as Model<{ _id: ObjectId }>,
  );

  return { service, reportModel, targetModels };
}

function setupExistingTargets(targetModels: Array<{ findById: jest.Mock }>, targetId: ObjectId) {
  targetModels.forEach((model) => {
    model.findById.mockReturnValue(queryResult({ _id: targetId }));
  });
}

describe('ReportService', () => {
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('rejects reporting yourself as a member', async () => {
    const { service } = makeService();
    const memberId = objectId();

    await expect(
      service.createReport(memberId, {
        targetId: memberId.toString(),
        targetType: ReportTargetType.MEMBER,
        reportType: ReportType.SPAM,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each([
    [ReportTargetType.MEMBER, 0],
    [ReportTargetType.ARTICLE, 1],
    [ReportTargetType.COMMENT, 2],
    [ReportTargetType.REVIEW, 3],
    [ReportTargetType.TRAVEL_MATE_POST, 4],
  ])('rejects a nonexistent %s target', async (targetType, modelIndex) => {
    const { service, targetModels } = makeService();
    const targetId = objectId();
    setupExistingTargets(targetModels, targetId);
    targetModels[modelIndex].findById.mockReturnValue(queryResult(null));

    await expect(
      service.createReport(objectId(), {
        targetId: targetId.toString(),
        targetType,
        reportType: ReportType.OTHER,
      }),
    ).rejects.toThrow('The reported target does not exist.');
  });

  it('rejects malformed target IDs before querying', async () => {
    const { service, targetModels } = makeService();

    await expect(
      service.createReport(objectId(), {
        targetId: 'not-an-object-id',
        targetType: ReportTargetType.ARTICLE,
        reportType: ReportType.OTHER,
      }),
    ).rejects.toThrow('Target ID must be a valid ObjectId.');
    expect(targetModels[1].findById).not.toHaveBeenCalled();
  });

  it('creates a pending report when the target exists', async () => {
    const { service, reportModel, targetModels } = makeService();
    const targetId = objectId();
    setupExistingTargets(targetModels, targetId);
    reportModel.findOne.mockResolvedValue(null);
    const created = { _id: objectId(), reportStatus: ReportStatus.PENDING };
    reportModel.create.mockResolvedValue(created);

    await expect(
      service.createReport(objectId(), {
        targetId: targetId.toString(),
        targetType: ReportTargetType.COMMENT,
        reportType: ReportType.OTHER,
      }),
    ).resolves.toBe(created);
    expect(reportModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        targetId,
        targetType: ReportTargetType.COMMENT,
        reportStatus: ReportStatus.PENDING,
      }),
    );
  });

  it('keeps the duplicate pre-check and surfaces duplicate-key races', async () => {
    const { service, reportModel, targetModels } = makeService();
    const targetId = objectId();
    setupExistingTargets(targetModels, targetId);
    reportModel.findOne.mockResolvedValue({ _id: objectId() });

    await expect(
      service.createReport(objectId(), {
        targetId: targetId.toString(),
        targetType: ReportTargetType.ARTICLE,
        reportType: ReportType.SPAM,
      }),
    ).rejects.toThrow('You have already reported this target.');

    reportModel.findOne.mockResolvedValue(null);
    const duplicateError = Object.assign(new Error('duplicate key'), { code: 11000 });
    reportModel.create.mockRejectedValue(duplicateError);
    Object.setPrototypeOf(duplicateError, mongo.MongoServerError.prototype);

    await expect(
      service.createReport(objectId(), {
        targetId: targetId.toString(),
        targetType: ReportTargetType.ARTICLE,
        reportType: ReportType.SPAM,
      }),
    ).rejects.toThrow('You have already reported this target.');
  });

  it.each([
    [ReportStatus.PENDING, ReportStatus.REVIEWED],
    [ReportStatus.PENDING, ReportStatus.REJECTED],
    [ReportStatus.PENDING, ReportStatus.RESOLVED],
    [ReportStatus.REVIEWED, ReportStatus.RESOLVED],
    [ReportStatus.REVIEWED, ReportStatus.REJECTED],
  ])('allows %s -> %s moderation transitions', async (currentStatus, nextStatus) => {
    const { service, reportModel } = makeService();
    const report: {
      reportStatus: ReportStatus;
      reviewedBy?: ObjectId;
      reviewedAt?: Date;
      adminNote?: string;
      save: jest.Mock;
    } = {
      reportStatus: currentStatus,
      save: jest.fn().mockResolvedValue(undefined),
    };
    reportModel.findById.mockResolvedValue(report);
    const adminId = objectId();

    await service.updateReportStatusByAdmin(adminId, {
      reportId: objectId().toString(),
      reportStatus: nextStatus,
      adminNote: 'Reviewed by admin',
    });

    expect(report.reportStatus).toBe(nextStatus);
    expect(report.reviewedBy).toBe(adminId);
    expect(report.reviewedAt).toBeInstanceOf(Date);
    expect(report.adminNote).toBe('Reviewed by admin');
    expect(report.save).toHaveBeenCalled();
  });

  it.each([
    [ReportStatus.PENDING, ReportStatus.PENDING],
    [ReportStatus.REJECTED, ReportStatus.PENDING],
    [ReportStatus.REJECTED, ReportStatus.REVIEWED],
    [ReportStatus.REJECTED, ReportStatus.RESOLVED],
    [ReportStatus.RESOLVED, ReportStatus.PENDING],
    [ReportStatus.RESOLVED, ReportStatus.REVIEWED],
    [ReportStatus.RESOLVED, ReportStatus.REJECTED],
  ])('rejects invalid %s -> %s moderation transitions', async (currentStatus, nextStatus) => {
    const { service, reportModel } = makeService();
    const report = { reportStatus: currentStatus, save: jest.fn() };
    reportModel.findById.mockResolvedValue(report);

    await expect(
      service.updateReportStatusByAdmin(objectId(), {
        reportId: objectId().toString(),
        reportStatus: nextStatus,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(report.save).not.toHaveBeenCalled();
  });

  it('falls back to createdAt for an unknown sort field and validates search IDs', async () => {
    const { service, reportModel } = makeService();
    reportModel.aggregate.mockResolvedValue([{ list: [], metaCounter: [] }]);

    await service.getReports({
      page: 1,
      limit: 10,
      sort: 'notAReportField',
      direction: Direction.ASC,
    });

    expect(reportModel.aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([{ $sort: { createdAt: Direction.ASC } }]),
    );

    await expect(
      service.getReports({ page: 1, limit: 10, search: { reporterId: 'bad-id' } }),
    ).rejects.toThrow('Reporter ID must be a valid ObjectId.');
  });

  it('preserves intentional hard delete behavior', async () => {
    const { service, reportModel } = makeService();
    const deleted = { _id: objectId() };
    reportModel.findOneAndDelete.mockResolvedValue(deleted);

    await expect(service.deleteReportByAdmin(deleted._id)).resolves.toBe(deleted);
    expect(reportModel.findOneAndDelete).toHaveBeenCalledWith({ _id: deleted._id });

    reportModel.findOneAndDelete.mockResolvedValue(null);
    await expect(service.deleteReportByAdmin(objectId())).rejects.toThrow('No data found');
  });
});
