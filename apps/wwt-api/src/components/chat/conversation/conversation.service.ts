import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, ObjectId } from 'mongoose';
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
import { T } from '../../../libs/types/common';
import { MemberService } from '../../member/member.service';

@Injectable()
export class ConversationService {
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
      const targetMemberId = shapeIntoMongoObjectId(input.memberTwoId);

      // 1. O'zi bilan conversation ocholmaydi
      if (memberId.toString() === targetMemberId.toString()) {
        throw new BadRequestException('You cannot create a conversation with yourself.');
      }

      // 2. Target member mavjudligini tekshiramiz
      const targetMember = await this.memberService.getMember(null, targetMemberId);

      if (!targetMember) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      // 3. Member IDlarni bir xil tartibga keltiramiz
      const sortedIds = [memberId.toString(), targetMemberId.toString()].sort();

      const memberOneId = shapeIntoMongoObjectId(sortedIds[0]);

      const memberTwoId = shapeIntoMongoObjectId(sortedIds[1]);

      // 4. Conversation mavjudligini tekshiramiz
      const existingConversation = await this.conversationModel.findOne({
        memberOneId,
        memberTwoId,
      });

      if (existingConversation) {
        return existingConversation;
      }

      // 5. Yangi conversation yaratamiz
      const result = await this.conversationModel.create({
        memberOneId,
        memberTwoId,
      });

      return result;
    } catch (error) {
      console.log('Error, Service createConversation:', error);

      if (error instanceof HttpException) {
        throw error;
      }

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

    const sort: T = {
      [input.sort ?? 'lastMessageAt']: input.direction ?? Direction.DESC,
    };

    const result = await this.conversationModel.aggregate([
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

  public async getConversation(
    memberId: ObjectId,
    conversationId: ObjectId,
  ): Promise<PrivateConversation> {
    const result = await this.conversationModel.findOne({
      _id: conversationId,
      $or: [{ memberOneId: memberId }, { memberTwoId: memberId }],
    });

    if (!result) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return result;
  }

  public async deleteConversation(
    memberId: ObjectId,
    conversationId: ObjectId,
  ): Promise<PrivateConversation> {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      // 1. Conversation mavjudmi va user participantmi?
      const conversation = await this.conversationModel
        .findOne({
          _id: conversationId,

          $or: [{ memberOneId: memberId }, { memberTwoId: memberId }],
        })
        .session(session);

      if (!conversation) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      // 2. Barcha child message'larni hard delete
      await this.messageModel.deleteMany(
        {
          conversationId: conversation._id,
        },
        {
          session,
        },
      );

      // 3. Parent conversationni hard delete
      await this.conversationModel.deleteOne(
        {
          _id: conversation._id,
        },
        {
          session,
        },
      );

      // 4. Transaction commit
      await session.commitTransaction();

      return conversation;
    } catch (error) {
      await session.abortTransaction();

      console.log('Error, Service deleteConversation:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(Message.DELETE_FAILED);
    } finally {
      await session.endSession();
    }
  }
}
