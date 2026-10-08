/* eslint-disable @typescript-eslint/no-var-requires */
jest.mock('../../../libs/config', () => ({
  shapeIntoMongoObjectId: (value: unknown) =>
    typeof value === 'string' ? new (require('mongoose').Types.ObjectId)(value) : value,
}));

import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PrivateMessageStatus } from '../../../libs/enums/chat.enum';
import { MessageService } from './message.service';

describe('MessageService', () => {
  const messageModel = {
    create: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn(),
  };
  const conversationModel = {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };
  const service = new MessageService(messageModel as any, conversationModel as any);

  beforeEach(() => jest.clearAllMocks());

  it('derives sender and receiver from authentication and the conversation', async () => {
    const senderId = new Types.ObjectId();
    const receiverId = new Types.ObjectId();
    const conversationId = new Types.ObjectId();
    conversationModel.findOne.mockResolvedValue({
      _id: conversationId,
      memberOneId: senderId,
      memberTwoId: receiverId,
    });
    const saved = {
      _id: new Types.ObjectId(),
      conversationId,
      senderId,
      receiverId,
      messageContent: 'Hello',
      messageImages: [],
      createdAt: new Date(),
    };
    messageModel.create.mockResolvedValue(saved);

    await service.sendMessage(senderId as any, {
      conversationId: conversationId.toString(),
      messageContent: '  Hello  ',
      ...({ senderId: receiverId } as any),
    });

    expect(messageModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId,
        senderId,
        receiverId,
        messageContent: 'Hello',
        messageStatus: PrivateMessageStatus.SENT,
      }),
    );
  });

  it('rejects whitespace-only messages', async () => {
    const senderId = new Types.ObjectId();
    const receiverId = new Types.ObjectId();
    const conversationId = new Types.ObjectId();
    conversationModel.findOne.mockResolvedValue({ memberOneId: senderId, memberTwoId: receiverId });
    await expect(
      service.sendMessage(senderId as any, {
        conversationId: conversationId.toString(),
        messageContent: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(messageModel.create).not.toHaveBeenCalled();
  });

  it('marks only the authenticated receiver SENT messages as read', async () => {
    const memberId = new Types.ObjectId();
    const conversationId = new Types.ObjectId();
    conversationModel.findOne.mockResolvedValue({ _id: conversationId });
    messageModel.updateMany.mockResolvedValue({ modifiedCount: 2 });

    await expect(
      service.markConversationAsRead(memberId as any, conversationId as any),
    ).resolves.toBe(true);
    expect(messageModel.updateMany).toHaveBeenCalledWith(
      { conversationId, receiverId: memberId, messageStatus: PrivateMessageStatus.SENT },
      { $set: { messageStatus: PrivateMessageStatus.READ, readAt: expect.any(Date) } },
    );
  });

  it('rejects sending into a conversation outside the authenticated member scope', async () => {
    conversationModel.findOne.mockResolvedValue(null);
    await expect(
      service.sendMessage(new Types.ObjectId() as any, {
        conversationId: new Types.ObjectId().toString(),
        messageContent: 'Hello',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(messageModel.create).not.toHaveBeenCalled();
  });
});
