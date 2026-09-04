import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { ViewInput } from '../../libs/dto/community/view.input';
import { Notice, Notices } from '../../libs/dto/system/notice';
import { NoticeInput, NoticesInquiry } from '../../libs/dto/system/notice.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ViewTargetType } from '../../libs/enums/community.enum';
import { T } from '../../libs/types/common';
import { ViewService } from '../view/view.service';

@Injectable()
export class NoticeService {
  constructor(
    @InjectModel('Notice')
    private readonly noticeModel: Model<Notice>,
    private readonly viewService: ViewService,
  ) {}

  public async createNotice(adminId: ObjectId, input: NoticeInput): Promise<Notice> {
    try {
      const expireAt = new Date();

      expireAt.setDate(expireAt.getDate() + 7);

      return await this.noticeModel.create({
        ...input,
        adminId,
        expireAt,
      });
    } catch (err: any) {
      console.log('Error, Service.createNotice:', err.message);

      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async getNotices(input: NoticesInquiry): Promise<Notices> {
    const search = input.search ?? {};

    const match: T = {};

    if (search.noticePinned !== undefined) {
      match.noticePinned = search.noticePinned;
    }

    if (search.text) {
      match.$or = [
        {
          noticeTitle: {
            $regex: new RegExp(search.text, 'i'),
          },
        },
        {
          noticeContent: {
            $regex: new RegExp(search.text, 'i'),
          },
        },
      ];
    }

    const sort: T = {
      noticePinned: -1,
      [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
    };

    const result = await this.noticeModel.aggregate([
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

  public async getNotice(memberId: ObjectId | null, noticeId: ObjectId): Promise<Notice> {
    const targetNotice = await this.noticeModel.findOne({
      _id: noticeId,
    });

    if (!targetNotice) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    if (memberId) {
      const viewInput: ViewInput = {
        viewerId: memberId,
        targetId: noticeId,
        targetType: ViewTargetType.NOTICE,
      };

      const newView = await this.viewService.recordView(viewInput);

      if (newView) {
        await this.noticeStatsEditor({
          _id: noticeId,
          targetKey: 'noticeViewCount',
          modifier: 1,
        });

        targetNotice.noticeViewCount++;
      }
    }

    return targetNotice;
  }

  public async deleteNotice(noticeId: ObjectId): Promise<Notice> {
    const result = await this.noticeModel.findByIdAndDelete(noticeId);

    if (!result) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return result;
  }

  public async noticeStatsEditor(input: {
    _id: ObjectId;
    targetKey: string;
    modifier: number;
  }): Promise<Notice> {
    const result = await this.noticeModel.findByIdAndUpdate(
      input._id,
      {
        $inc: {
          [input.targetKey]: input.modifier,
        },
      },
      {
        new: true,
      },
    );

    if (!result) {
      throw new BadRequestException(Message.UPDATE_FAILED);
    }

    return result;
  }
}
