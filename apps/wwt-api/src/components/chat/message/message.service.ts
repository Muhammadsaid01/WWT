import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../../libs/config';
import { PrivateConversation } from '../../../libs/dto/chat/private-conversation';
import { PrivateMessage, PrivateMessages } from '../../../libs/dto/chat/private-message';
import {
  PrivateMessageInput,
  PrivateMessagesInquiry,
} from '../../../libs/dto/chat/private-message.input';
import { PrivateMessageStatus, PrivateMessageType } from '../../../libs/enums/chat.enum';
import { Direction, Message } from '../../../libs/enums/common.enum';
import { T } from '../../../libs/types/common';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel('Message')
    private readonly messageModel: Model<PrivateMessage>,

    @InjectModel('Conversation')
    private readonly conversationModel: Model<PrivateConversation>,
  ) {}
  public async sendMessage(
    memberId: ObjectId,
    input: PrivateMessageInput,
  ): Promise<PrivateMessage> {
    const conversationId = shapeIntoMongoObjectId(input.conversationId);

    const conversation = await this.conversationModel.findOne({
      _id: conversationId,
      $or: [{ memberOneId: memberId }, { memberTwoId: memberId }],
    });

    if (!conversation) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const receiverId =
      conversation.memberOneId.toString() === memberId.toString()
        ? conversation.memberTwoId
        : conversation.memberOneId;

    const hasContent = !!input.messageContent?.trim();

    const hasImages = !!input.messageImages?.length;

    if (!hasContent && !hasImages) {
      throw new BadRequestException('Message content or image is required.');
    }

    const result = await this.messageModel.create({
      conversationId,
      senderId: memberId,
      receiverId,

      messageType: input.messageType ?? PrivateMessageType.TEXT,

      messageContent: input.messageContent?.trim() ?? null,

      messageImages: input.messageImages ?? [],

      messageStatus: PrivateMessageStatus.SENT,
    });

    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $set: {
        lastMessage: result.messageContent ?? (result.messageImages.length ? 'Image' : null),

        lastMessageAt: result.createdAt,
      },
    });

    return result;
  }

  public async getMessages(
    memberId: ObjectId,
    conversationId: ObjectId,
    input: PrivateMessagesInquiry,
  ): Promise<PrivateMessages> {
    // 1. Conversation mavjud va member participant ekanini tekshiramiz
    const conversation = await this.conversationModel.findOne({
      _id: conversationId,
      $or: [{ memberOneId: memberId }, { memberTwoId: memberId }],
    });

    if (!conversation) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    // 2. Message filter
    const match: T = {
      conversationId,
    };

    const search = input.search ?? {};

    if (search.senderId) {
      match.senderId = shapeIntoMongoObjectId(search.senderId);
    }

    if (search.receiverId) {
      match.receiverId = shapeIntoMongoObjectId(search.receiverId);
    }

    if (search.messageStatus) {
      match.messageStatus = search.messageStatus;
    }

    const sort: T = {
      [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
    };

    // 3. Messages
    const result = await this.messageModel.aggregate([
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
  public async markMessageAsRead(memberId: ObjectId, messageId: ObjectId): Promise<PrivateMessage> {
    const targetMessage = await this.messageModel.findOne({
      _id: messageId,
      receiverId: memberId,
    });

    if (!targetMessage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    if (targetMessage.messageStatus === PrivateMessageStatus.READ) {
      return targetMessage;
    }

    targetMessage.messageStatus = PrivateMessageStatus.READ;

    targetMessage.readAt = new Date();

    return await targetMessage.save();
  }

  public async markConversationAsRead(
    memberId: ObjectId,
    conversationId: ObjectId,
  ): Promise<boolean> {
    // 1. User shu conversation participantimi?
    const conversation = await this.conversationModel.findOne({
      _id: conversationId,
      $or: [{ memberOneId: memberId }, { memberTwoId: memberId }],
    });

    if (!conversation) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    // 2. Faqat user qabul qilgan unread message'larni READ qilamiz
    await this.messageModel.updateMany(
      {
        conversationId,
        receiverId: memberId,
        messageStatus: {
          $ne: PrivateMessageStatus.READ,
        },
      },
      {
        $set: {
          messageStatus: PrivateMessageStatus.READ,
          readAt: new Date(),
        },
      },
    );

    return true;
  }

  public async deleteMessage(memberId: ObjectId, messageId: ObjectId): Promise<PrivateMessage> {
    const targetMessage = await this.messageModel.findOne({
      _id: messageId,
      senderId: memberId,
    });

    if (!targetMessage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const conversationId = targetMessage.conversationId;

    // Message HARD DELETE
    await this.messageModel.deleteOne({
      _id: messageId,
      senderId: memberId,
    });

    // O'chirilgandan keyingi eng oxirgi message
    const latestMessage = await this.messageModel
      .findOne({
        conversationId,
      })
      .sort({
        createdAt: -1,
      });

    // Conversation lastMessage'ni qayta update qilamiz
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $set: {
        lastMessage: latestMessage
          ? (latestMessage.messageContent ?? (latestMessage.messageImages?.length ? 'Image' : null))
          : null,

        lastMessageAt: latestMessage ? latestMessage.createdAt : null,
      },
    });

    return targetMessage;
  }
}
