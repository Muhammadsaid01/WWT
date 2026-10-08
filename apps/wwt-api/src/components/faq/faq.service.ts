import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Faq, Faqs } from '../../libs/dto/system/faq';
import { FaqInput, FaqsInquiry, FaqUpdate } from '../../libs/dto/system/faq.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { FaqCategory, FaqStatus } from '../../libs/enums/faq.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class FaqService {
  private readonly allowedSorts = new Set(['createdAt', 'updatedAt', 'faqOrder', 'faqQuestion']);

  constructor(
    @InjectModel('Faq')
    private readonly faqModel: Model<Faq>,
  ) {}

  public async createFaq(adminId: ObjectId, input: FaqInput): Promise<Faq> {
    const payload = this.normalizePayload(input, false);
    try {
      const result = await this.faqModel.create({
        ...payload,
        adminId,
        faqStatus: payload.faqStatus ?? FaqStatus.DRAFT,
        faqOrder: payload.faqOrder ?? 0,
      });
      if (!result) throw new BadRequestException(Message.CREATE_FAILED);
      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(Message.CREATE_FAILED);
    }
  }

  public async getFaqs(input: FaqsInquiry): Promise<Faqs> {
    return this.paginate(input, true);
  }

  public async getAllFaqsByAdmin(input: FaqsInquiry): Promise<Faqs> {
    return this.paginate(input, false);
  }

  public async getFaq(faqId: string): Promise<Faq> {
    const id = this.objectId(faqId);
    const result = await this.faqModel.findOne({
      _id: id,
      $or: [{ faqStatus: FaqStatus.PUBLISHED }, { faqStatus: { $exists: false } }],
    });
    if (!result) throw new BadRequestException(Message.NO_DATA_FOUND);
    if (!result.faqStatus) result.faqStatus = FaqStatus.PUBLISHED;
    return result;
  }

  public async getFaqByAdmin(faqId: string): Promise<Faq> {
    const result = await this.faqModel.findById(this.objectId(faqId));
    if (!result) throw new BadRequestException(Message.NO_DATA_FOUND);
    if (!result.faqStatus) result.faqStatus = FaqStatus.PUBLISHED;
    return result;
  }

  public async updateFaq(input: FaqUpdate): Promise<Faq> {
    const { _id, ...rawUpdate } = input;
    const update = this.normalizePayload(rawUpdate, true);
    if (Object.keys(update).length === 0) {
      throw new BadRequestException('At least one FAQ field must be updated.');
    }
    try {
      const result = await this.faqModel.findByIdAndUpdate(
        this.objectId(_id),
        { $set: update },
        { new: true, runValidators: true },
      );
      if (!result) throw new BadRequestException(Message.NO_DATA_FOUND);
      if (!result.faqStatus) result.faqStatus = FaqStatus.PUBLISHED;
      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(Message.UPDATE_FAILED);
    }
  }

  public async deleteFaq(faqId: string): Promise<Faq> {
    const result = await this.faqModel.findByIdAndDelete(this.objectId(faqId));
    if (!result) throw new BadRequestException(Message.NO_DATA_FOUND);
    if (!result.faqStatus) result.faqStatus = FaqStatus.PUBLISHED;
    return result;
  }

  private async paginate(input: FaqsInquiry, publicOnly: boolean): Promise<Faqs> {
    const clauses: T[] = [];
    const search = input.search ?? {};

    if (publicOnly) {
      clauses.push({
        $or: [{ faqStatus: FaqStatus.PUBLISHED }, { faqStatus: { $exists: false } }],
      });
    } else if (search.faqStatus === FaqStatus.PUBLISHED) {
      clauses.push({
        $or: [{ faqStatus: FaqStatus.PUBLISHED }, { faqStatus: { $exists: false } }],
      });
    } else if (search.faqStatus) {
      clauses.push({ faqStatus: search.faqStatus });
    }

    if (search.faqCategory) clauses.push({ faqCategory: search.faqCategory });
    if (search.text?.trim()) {
      const regex = new RegExp(this.escapeRegex(search.text.trim()), 'i');
      clauses.push({
        $or: [{ faqQuestion: { $regex: regex } }, { faqAnswer: { $regex: regex } }],
      });
    }

    const match = clauses.length ? { $and: clauses } : {};
    const direction = input.direction ?? Direction.DESC;
    const requestedSort = input.sort ?? (publicOnly ? 'createdAt' : 'updatedAt');
    const sortField = this.allowedSorts.has(requestedSort)
      ? requestedSort
      : publicOnly
        ? 'createdAt'
        : 'updatedAt';
    const sort: T = publicOnly
      ? {
          faqOrder: 1,
          ...(sortField === 'faqOrder' ? {} : { [sortField]: direction }),
          _id: 1,
        }
      : { [sortField]: direction, _id: direction };

    const [result] = await this.faqModel.aggregate([
      { $match: match },
      {
        $addFields: {
          faqStatus: { $ifNull: ['$faqStatus', FaqStatus.PUBLISHED] },
        },
      },
      { $sort: sort },
      {
        $facet: {
          list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]);

    return {
      list: result?.list ?? [],
      metaCounter: result?.metaCounter ?? [],
    };
  }

  private objectId(value: string) {
    if (!isValidObjectId(value)) throw new BadRequestException('Invalid FAQ ID.');
    return shapeIntoMongoObjectId(value);
  }

  private normalizePayload(input: Partial<FaqInput | Omit<FaqUpdate, '_id'>>, partial: boolean): T {
    const payload: T = {};
    if (input.faqCategory !== undefined) {
      if (!Object.values(FaqCategory).includes(input.faqCategory)) {
        throw new BadRequestException('Invalid FAQ category.');
      }
      payload.faqCategory = input.faqCategory;
    } else if (!partial) throw new BadRequestException('FAQ category is required.');

    if (input.faqStatus !== undefined) {
      if (!Object.values(FaqStatus).includes(input.faqStatus)) {
        throw new BadRequestException('Invalid FAQ status.');
      }
      payload.faqStatus = input.faqStatus;
    }

    if (input.faqQuestion !== undefined) {
      const question = input.faqQuestion.trim();
      if (question.length < 3 || question.length > 300) {
        throw new BadRequestException('FAQ question must be between 3 and 300 characters.');
      }
      payload.faqQuestion = question;
    } else if (!partial) throw new BadRequestException('FAQ question is required.');

    if (input.faqAnswer !== undefined) {
      const answer = input.faqAnswer.trim();
      if (answer.length < 5 || answer.length > 5000) {
        throw new BadRequestException('FAQ answer must be between 5 and 5000 characters.');
      }
      payload.faqAnswer = answer;
    } else if (!partial) throw new BadRequestException('FAQ answer is required.');

    if (input.faqOrder !== undefined) {
      if (!Number.isInteger(input.faqOrder) || input.faqOrder < 0 || input.faqOrder > 100000) {
        throw new BadRequestException('FAQ display order must be an integer from 0 to 100000.');
      }
      payload.faqOrder = input.faqOrder;
    }

    return payload;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
