/* eslint-disable @typescript-eslint/no-var-requires */
jest.mock('../../libs/config', () => ({
  shapeIntoMongoObjectId: (value: unknown) =>
    typeof value === 'string' ? new (require('mongoose').Types.ObjectId)(value) : value,
}));

import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { Direction } from '../../libs/enums/common.enum';
import { FaqCategory, FaqStatus } from '../../libs/enums/faq.enum';
import { FaqService } from './faq.service';

describe('FaqService', () => {
  const faqModel = {
    aggregate: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };
  let service: FaqService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FaqService(faqModel as any);
    faqModel.aggregate.mockResolvedValue([{ list: [], metaCounter: [] }]);
  });

  it('keeps drafts private and applies stable display ordering to public FAQs', async () => {
    await service.getFaqs({
      page: 1,
      limit: 10,
      sort: 'createdAt',
      direction: Direction.DESC,
    });

    const pipeline = faqModel.aggregate.mock.calls[0][0];
    expect(pipeline[0]).toEqual({
      $match: {
        $and: [
          {
            $or: [{ faqStatus: FaqStatus.PUBLISHED }, { faqStatus: { $exists: false } }],
          },
        ],
      },
    });
    expect(pipeline[2]).toEqual({
      $sort: { faqOrder: 1, createdAt: Direction.DESC, _id: 1 },
    });
  });

  it('combines category, status and escaped text search for admin pagination', async () => {
    await service.getAllFaqsByAdmin({
      page: 2,
      limit: 5,
      sort: 'faqOrder',
      direction: Direction.ASC,
      search: {
        faqCategory: FaqCategory.BOOKING,
        faqStatus: FaqStatus.DRAFT,
        text: 'change.*date',
      },
    });

    const pipeline = faqModel.aggregate.mock.calls[0][0];
    const clauses = pipeline[0].$match.$and;
    expect(clauses).toContainEqual({ faqStatus: FaqStatus.DRAFT });
    expect(clauses).toContainEqual({ faqCategory: FaqCategory.BOOKING });
    const textClause = clauses.find((clause: any) => clause.$or?.[0]?.faqQuestion);
    expect(textClause.$or[0].faqQuestion.$regex.source).toBe('change\\.\\*date');
    expect(pipeline[2]).toEqual({ $sort: { faqOrder: Direction.ASC, _id: Direction.ASC } });
    expect(pipeline[3].$facet.list).toEqual([{ $skip: 5 }, { $limit: 5 }]);
  });

  it('defaults new FAQs to DRAFT and trims stored text', async () => {
    const adminId = new Types.ObjectId();
    faqModel.create.mockImplementation(async (payload) => payload);

    const result = await service.createFaq(adminId as any, {
      faqCategory: FaqCategory.GENERAL,
      faqQuestion: '  How does WWT work?  ',
      faqAnswer: '  Browse real travel packages.  ',
    });

    expect(faqModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId,
        faqQuestion: 'How does WWT work?',
        faqAnswer: 'Browse real travel packages.',
        faqStatus: FaqStatus.DRAFT,
        faqOrder: 0,
      }),
    );
    expect(result.faqStatus).toBe(FaqStatus.DRAFT);
  });

  it('rejects whitespace-only content before reaching MongoDB', async () => {
    await expect(
      service.createFaq(new Types.ObjectId() as any, {
        faqCategory: FaqCategory.GENERAL,
        faqQuestion: '   ',
        faqAnswer: 'valid answer',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(faqModel.create).not.toHaveBeenCalled();
  });

  it('updates only validated editable fields', async () => {
    const id = new Types.ObjectId().toString();
    faqModel.findByIdAndUpdate.mockResolvedValue({ _id: id, faqStatus: FaqStatus.PUBLISHED });

    await service.updateFaq({
      _id: id,
      faqStatus: FaqStatus.PUBLISHED,
      faqQuestion: '  Updated question  ',
    });

    expect(faqModel.findByIdAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      { $set: { faqStatus: FaqStatus.PUBLISHED, faqQuestion: 'Updated question' } },
      { new: true, runValidators: true },
    );
  });

  it.each(['invalid-id', ''])('rejects invalid FAQ IDs: %s', async (id) => {
    await expect(service.getFaq(id)).rejects.toThrow('Invalid FAQ ID.');
    await expect(service.getFaqByAdmin(id)).rejects.toThrow('Invalid FAQ ID.');
    await expect(service.deleteFaq(id)).rejects.toThrow('Invalid FAQ ID.');
  });

  it('preserves the existing hard-delete convention for ADMIN deletion', async () => {
    const id = new Types.ObjectId().toString();
    faqModel.findByIdAndDelete.mockResolvedValue({ _id: id });
    await expect(service.deleteFaq(id)).resolves.toEqual({
      _id: id,
      faqStatus: FaqStatus.PUBLISHED,
    });
    expect(faqModel.findByIdAndDelete).toHaveBeenCalledWith(expect.anything());
  });
});
