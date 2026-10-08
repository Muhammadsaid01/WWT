import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, ObjectId } from 'mongoose';
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
  private readonly MAX_MESSAGE_LENGTH = 5000;
  private readonly ALLOWED_SORTS = new Set(['createdAt', 'updatedAt']);

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
    if (!isValidObjectId(input.conversationId)) {
      throw new BadRequestException('Invalid conversation ID.');
    }

    const conversationId = shapeIntoMongoObjectId(input.conversationId);
    const conversation = await this.conversationModel.findOne({
      _id: conversationId,
      $or: [{ memberOneId: memberId }, { memberTwoId: memberId }],
    });
    if (!conversation) throw new BadRequestException(Message.NO_DATA_FOUND);

    const receiverId =
      conversation.memberOneId.toString() === memberId.toString()
        ? conversation.memberTwoId
        : conversation.memberOneId;
    const messageContent = input.messageContent?.trim();
    const messageImages = input.messageImages?.filter((image) => image?.trim()) ?? [];

    if (!messageContent && messageImages.length === 0) {
      throw new BadRequestException('Message content or image is required.');
    }
    if (messageContent && messageContent.length > this.MAX_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `Message must not exceed ${this.MAX_MESSAGE_LENGTH} characters.`,
      );
    }

    const result = await this.messageModel.create({
      conversationId,
      senderId: memberId,
      receiverId,
      messageType: input.messageType ?? PrivateMessageType.TEXT,
      messageContent: messageContent ?? null,
      messageImages,
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
    conversationId: ObjectId | string,
    input: PrivateMessagesInquiry,
  ): Promise<PrivateMessages> {
    if (!isValidObjectId(conversationId)) {
      throw new BadRequestException('Invalid conversation ID.');
    }
    const targetConversationId = shapeIntoMongoObjectId(conversationId);
    const conversation = await this.conversationModel.findOne({
      _id: targetConversationId,
      $or: [{ memberOneId: memberId }, { memberTwoId: memberId }],
    });
    if (!conversation) throw new BadRequestException(Message.NO_DATA_FOUND);

    const match: T = { conversationId: targetConversationId };
    const search = input.search ?? {};
    if (search.senderId) {
      if (!isValidObjectId(search.senderId)) throw new BadRequestException('Invalid sender ID.');
      match.senderId = shapeIntoMongoObjectId(search.senderId);
    }
    if (search.receiverId) {
      if (!isValidObjectId(search.receiverId))
        throw new BadRequestException('Invalid receiver ID.');
      match.receiverId = shapeIntoMongoObjectId(search.receiverId);
    }
    if (search.messageStatus) match.messageStatus = search.messageStatus;

    const sortField = this.ALLOWED_SORTS.has(input.sort ?? '') ? input.sort! : 'createdAt';
    const direction = input.direction ?? Direction.DESC;
    const sort: T = { [sortField]: direction, _id: direction };

    const [result] = await this.messageModel.aggregate([
      { $match: match },
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

  public async getUnreadMessageCount(memberId: ObjectId): Promise<number> {
    return this.messageModel.countDocuments({
      receiverId: memberId,
      messageStatus: PrivateMessageStatus.SENT,
    });
  }

  public async markMessageAsRead(
    memberId: ObjectId,
    messageId: ObjectId | string,
  ): Promise<PrivateMessage> {
    if (!isValidObjectId(messageId)) throw new BadRequestException('Invalid message ID.');
    const targetMessageId = shapeIntoMongoObjectId(messageId);
    const targetMessage = await this.messageModel.findOne({
      _id: targetMessageId,
      receiverId: memberId,
    });
    if (!targetMessage) throw new BadRequestException(Message.NO_DATA_FOUND);
    if (targetMessage.messageStatus === PrivateMessageStatus.READ) return targetMessage;
    if (targetMessage.messageStatus === PrivateMessageStatus.DELETED) {
      throw new BadRequestException('Deleted messages cannot be marked as read.');
    }

    targetMessage.messageStatus = PrivateMessageStatus.READ;
    targetMessage.readAt = new Date();
    return targetMessage.save();
  }

  public async markConversationAsRead(
    memberId: ObjectId,
    conversationId: ObjectId | string,
  ): Promise<boolean> {
    if (!isValidObjectId(conversationId)) {
      throw new BadRequestException('Invalid conversation ID.');
    }
    const targetConversationId = shapeIntoMongoObjectId(conversationId);
    const conversation = await this.conversationModel.findOne({
      _id: targetConversationId,
      $or: [{ memberOneId: memberId }, { memberTwoId: memberId }],
    });
    if (!conversation) throw new BadRequestException(Message.NO_DATA_FOUND);

    await this.messageModel.updateMany(
      {
        conversationId: targetConversationId,
        receiverId: memberId,
        messageStatus: PrivateMessageStatus.SENT,
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

  public async deleteMessage(
    memberId: ObjectId,
    messageId: ObjectId | string,
  ): Promise<PrivateMessage> {
    if (!isValidObjectId(messageId)) throw new BadRequestException('Invalid message ID.');
    const targetMessageId = shapeIntoMongoObjectId(messageId);
    const targetMessage = await this.messageModel.findOne({
      _id: targetMessageId,
      senderId: memberId,
    });
    if (!targetMessage) throw new BadRequestException(Message.NO_DATA_FOUND);

    const conversationId = targetMessage.conversationId;
    await this.messageModel.deleteOne({ _id: targetMessageId, senderId: memberId });
    const latestMessage = await this.messageModel.findOne({ conversationId }).sort({
      createdAt: -1,
      _id: -1,
    });

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
