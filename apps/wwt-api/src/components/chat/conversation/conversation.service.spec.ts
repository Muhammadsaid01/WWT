/* eslint-disable @typescript-eslint/no-var-requires */
jest.mock('../../../libs/config', () => ({
  shapeIntoMongoObjectId: (value: unknown) =>
    typeof value === 'string' ? new (require('mongoose').Types.ObjectId)(value) : value,
}));

import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ConversationService } from './conversation.service';

describe('ConversationService', () => {
  const conversationModel = {
    findOneAndUpdate: jest.fn(),
    findOne: jest.fn(),
    aggregate: jest.fn(),
  };
  const messageModel = { deleteMany: jest.fn() };
  const connection = { startSession: jest.fn() };
  const memberService = { getMember: jest.fn() };
  const service = new ConversationService(
    conversationModel as any,
    messageModel as any,
    connection as any,
    memberService as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('normalizes participant order and uses an atomic upsert to prevent duplicates', async () => {
    const memberId = new Types.ObjectId('64b000000000000000000020');
    const targetId = new Types.ObjectId('64b000000000000000000010');
    const conversation = {
      _id: new Types.ObjectId(),
      memberOneId: targetId,
      memberTwoId: memberId,
    };
    memberService.getMember.mockResolvedValue({ _id: targetId });
    conversationModel.findOneAndUpdate.mockResolvedValue(conversation);

    await expect(
      service.createConversation(memberId as any, { memberTwoId: targetId.toString() }),
    ).resolves.toBe(conversation);
    expect(conversationModel.findOneAndUpdate).toHaveBeenCalledWith(
      { memberOneId: targetId, memberTwoId: memberId },
      { $setOnInsert: { memberOneId: targetId, memberTwoId: memberId } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  });

  it('rejects self conversations', async () => {
    const memberId = new Types.ObjectId();
    await expect(
      service.createConversation(memberId as any, { memberTwoId: memberId.toString() }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(conversationModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('does not return a conversation when the authenticated member is not a participant', async () => {
    conversationModel.aggregate.mockResolvedValue([]);
    await expect(
      service.getConversation(new Types.ObjectId() as any, new Types.ObjectId() as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    const pipeline = conversationModel.aggregate.mock.calls[0][0];
    expect(pipeline[0].$match.$or).toHaveLength(2);
    expect(pipeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          $lookup: expect.objectContaining({ from: 'members', as: 'memberOneData' }),
        }),
        expect.objectContaining({
          $lookup: expect.objectContaining({ from: 'members', as: 'memberTwoData' }),
        }),
      ]),
    );
  });
});
