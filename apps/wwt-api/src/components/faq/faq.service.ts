import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Faq, Faqs } from '../../libs/dto/system/faq';
import { FaqInput, FaqsInquiry } from '../../libs/dto/system/faq.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class FaqService {
  constructor(
    @InjectModel('Faq')
    private readonly faqModel: Model<Faq>,
  ) {}

  public async createFaq(adminId: ObjectId, input: FaqInput): Promise<Faq> {
    try {
      const result = await this.faqModel.create({
        ...input,
        adminId,
        faqOrder: input.faqOrder ?? 0,
      });

      if (!result) {
        throw new BadRequestException(Message.CREATE_FAILED);
      }

      return result;
    } catch (err: any) {
      console.log('Error, Service.createFaq:', err.message);

      if (err instanceof HttpException) {
        throw err;
      }

      throw new InternalServerErrorException(Message.CREATE_FAILED);
    }
  }

  public async getFaqs(input: FaqsInquiry): Promise<Faqs> {
    const search = input.search ?? {};

    const match: T = {};

    if (search.faqCategory) {
      match.faqCategory = search.faqCategory;
    }

    if (search.text) {
      match.$or = [
        {
          faqQuestion: {
            $regex: new RegExp(search.text, 'i'),
          },
        },
        {
          faqAnswer: {
            $regex: new RegExp(search.text, 'i'),
          },
        },
      ];
    }

    const sort: T = {
      faqOrder: 1,
      [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
    };

    const result = await this.faqModel.aggregate([
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

  public async getFaq(faqId: ObjectId): Promise<Faq> {
    const result = await this.faqModel.findById(faqId).exec();

    if (!result) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return result;
  }

  public async deleteFaq(faqId: ObjectId): Promise<Faq> {
    const result = await this.faqModel.findOneAndDelete({
      _id: faqId,
    });

    if (!result) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return result;
  }
}
