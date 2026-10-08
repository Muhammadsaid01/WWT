import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, isValidObjectId, Model, ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../../libs/config';
import {
  PrivateConversation,
  PrivateConversations,
} from '../../../libs/dto/chat/private-conversation';
import {
  PrivateConversationInput,
  PrivateConversationsInquiry,
} from '../../../libs/dto/chat/private-conversation.input';
import { PrivateMessage } from '../../../libs/dto/chat/private-message';
import { Direction, Message } from '../../../libs/enums/common.enum';
import { PrivateMessageStatus } from '../../../libs/enums/chat.enum';
import { T } from '../../../libs/types/common';
import { MemberService } from '../../member/member.service';

@Injectable()
export class ConversationService {
  private readonly ALLOWED_SORTS = new Set(['lastMessageAt', 'createdAt', 'updatedAt']);

  constructor(
    @InjectModel('Conversation')
    private readonly conversationModel: Model<PrivateConversation>,
    @InjectModel('Message')
    private readonly messageModel: Model<PrivateMessage>,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly memberService: MemberService,
  ) {}

  public async createConversation(
    memberId: ObjectId,
    input: PrivateConversationInput,
  ): Promise<PrivateConversation> {
    try {
      if (!isValidObjectId(input.memberTwoId)) {
        throw new BadRequestException('Invalid member ID.');
      }

      const targetMemberId = shapeIntoMongoObjectId(input.memberTwoId);
      if (memberId.toString() === targetMemberId.toString()) {
        throw new BadRequestException('You cannot create a conversation with yourself.');
      }

      await this.memberService.getMember(null, targetMemberId);

      const [firstId, secondId] = [memberId.toString(), targetMemberId.toString()].sort();
      const memberOneId = shapeIntoMongoObjectId(firstId);
      const memberTwoId = shapeIntoMongoObjectId(secondId);

      const result = await this.conversationModel.findOneAndUpdate(
        { memberOneId, memberTwoId },
        { $setOnInsert: { memberOneId, memberTwoId } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      if (!result) {
        throw new InternalServerErrorException(Message.CREATE_FAILED);
      }

      return result;
    } catch (error: any) {
      if (error?.code === 11000 && isValidObjectId(input.memberTwoId)) {
        const ids = [memberId.toString(), input.memberTwoId].sort().map(shapeIntoMongoObjectId);
        const existing = await this.conversationModel.findOne({
          memberOneId: ids[0],
          memberTwoId: ids[1],
        });
        if (existing) return existing;
      }
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(Message.CREATE_FAILED);
    }
  }

  public async getMyConversations(
    memberId: ObjectId,
    input: PrivateConversationsInquiry,
  ): Promise<PrivateConversations> {
    const match: T = {
      $or: [{ memberOneId: memberId }, { memberTwoId: memberId }],
    };
    const sortField = this.ALLOWED_SORTS.has(input.sort ?? '') ? input.sort! : 'lastMessageAt';
    const direction = input.direction ?? Direction.DESC;
    const sort: T = { [sortField]: direction, _id: direction };

    const [result] = await this.conversationModel.aggregate([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            {
              $lookup: {
                from: 'members',
                localField: 'memberOneId',
                foreignField: '_id',
                as: 'memberOneData',
              },
            },
            { $unwind: { path: '$memberOneData', preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: 'members',
                localField: 'memberTwoId',
                foreignField: '_id',
                as: 'memberTwoData',
              },
            },
            { $unwind: { path: '$memberTwoData', preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: 'privateMessages',
                let: { conversationId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$conversationId', '$$conversationId'] },
                          { $eq: ['$receiverId', memberId] },
                          { $eq: ['$messageStatus', PrivateMessageStatus.SENT] },
                        ],
                      },
                    },
                  },
                  { $count: 'total' },
                ],
                as: 'unreadMeta',
              },
            },
            {
              $addFields: {
                unreadCount: { $ifNull: [{ $arrayElemAt: ['$unreadMeta.total', 0] }, 0] },
              },
            },
            { $project: { unreadMeta: 0 } },
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

  public async getConversation(
    memberId: ObjectId,
    conversationId: ObjectId | string,
  ): Promise<PrivateConversation> {
    if (!isValidObjectId(conversationId)) {
      throw new BadRequestException('Invalid conversation ID.');
    }
    const targetConversationId = shapeIntoMongoObjectId(conversationId);

    const [result] = await this.conversationModel.aggregate([
      {
        $match: {
          _id: targetConversationId,
          $or: [{ memberOneId: memberId }, { memberTwoId: memberId }],
        },
      },
      {
        $lookup: {
          from: 'members',
          localField: 'memberOneId',
          foreignField: '_id',
          as: 'memberOneData',
        },
      },
      { $unwind: { path: '$memberOneData', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'members',
          localField: 'memberTwoId',
          foreignField: '_id',
          as: 'memberTwoData',
        },
      },
      { $unwind: { path: '$memberTwoData', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'privateMessages',
          let: { conversationId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$conversationId', '$$conversationId'] },
                    { $eq: ['$receiverId', memberId] },
                    { $eq: ['$messageStatus', PrivateMessageStatus.SENT] },
                  ],
                },
              },
            },
            { $count: 'total' },
          ],
          as: 'unreadMeta',
        },
      },
      {
        $addFields: {
          unreadCount: { $ifNull: [{ $arrayElemAt: ['$unreadMeta.total', 0] }, 0] },
        },
      },
      { $project: { unreadMeta: 0 } },
    ]);

    if (!result) throw new BadRequestException(Message.NO_DATA_FOUND);
    return result as PrivateConversation;
  }

  public async deleteConversation(
    memberId: ObjectId,
    conversationId: ObjectId | string,
  ): Promise<PrivateConversation> {
    if (!isValidObjectId(conversationId)) {
      throw new BadRequestException('Invalid conversation ID.');
    }
    const targetConversationId = shapeIntoMongoObjectId(conversationId);
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const conversation = await this.conversationModel
        .findOne({
          _id: targetConversationId,
          $or: [{ memberOneId: memberId }, { memberTwoId: memberId }],
        })
        .session(session);
      if (!conversation) throw new BadRequestException(Message.NO_DATA_FOUND);

      await this.messageModel.deleteMany({ conversationId: conversation._id }, { session });
      await this.conversationModel.deleteOne({ _id: conversation._id }, { session });
      await session.commitTransaction();
      return conversation;
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(Message.DELETE_FAILED);
    } finally {
      await session.endSession();
    }
  }
}
