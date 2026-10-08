import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, ObjectId } from 'mongoose';
import { OpenChatMessage, OpenChatMessages } from '../../libs/dto/chat/open-chat-message';
import { OpenChatMessagesInquiry } from '../../libs/dto/chat/open-chat-message.input';
import { Direction } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class OpenchatService {
  private readonly MAX_MESSAGE_LENGTH = 2000;
  private readonly ALLOWED_SORTS = new Set(['createdAt']);

  constructor(
    @InjectModel('OpenChatMessage')
    private readonly openChatMessageModel: Model<OpenChatMessage>,
  ) {}

  public async createMessage(memberId: ObjectId, content: string): Promise<OpenChatMessage> {
    if (!isValidObjectId(memberId)) {
      throw new BadRequestException('Invalid member identity.');
    }

    const messageContent = content?.trim();
    if (!messageContent) {
      throw new BadRequestException('Message is required.');
    }
    if (messageContent.length > this.MAX_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `Message must not exceed ${this.MAX_MESSAGE_LENGTH} characters.`,
      );
    }

    const created = await this.openChatMessageModel.create({
      senderId: memberId,
      messageContent,
    });

    return (await this.openChatMessageModel
      .aggregate([
        { $match: { _id: created._id } },
        {
          $lookup: {
            from: 'members',
            localField: 'senderId',
            foreignField: '_id',
            as: 'memberData',
          },
        },
        { $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            senderId: 1,
            messageContent: 1,
            createdAt: 1,
            updatedAt: 1,
            'memberData._id': 1,
            'memberData.memberNick': 1,
            'memberData.memberFullName': 1,
            'memberData.memberImage': 1,
            'memberData.memberType': 1,
          },
        },
      ])
      .then((list) => list[0])) as OpenChatMessage;
  }

  public async getMessages(input: OpenChatMessagesInquiry): Promise<OpenChatMessages> {
    const sortField = this.ALLOWED_SORTS.has(input.sort ?? '') ? input.sort! : 'createdAt';
    const direction = input.direction ?? Direction.DESC;
    const sort: T = { [sortField]: direction, _id: direction };

    const [result] = await this.openChatMessageModel.aggregate([
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            {
              $lookup: {
                from: 'members',
                localField: 'senderId',
                foreignField: '_id',
                as: 'memberData',
              },
            },
            { $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                senderId: 1,
                messageContent: 1,
                createdAt: 1,
                updatedAt: 1,
                'memberData._id': 1,
                'memberData.memberNick': 1,
                'memberData.memberFullName': 1,
                'memberData.memberImage': 1,
                'memberData.memberType': 1,
              },
            },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]);

    return {
      list: result?.list ?? [],
      metaCounter: result?.metaCounter ?? [],
    };
  }
}
