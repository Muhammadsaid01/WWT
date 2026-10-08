import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { OpenchatService } from './openchat.service';

describe('OpenchatService', () => {
  const model = { create: jest.fn(), aggregate: jest.fn() };
  const service = new OpenchatService(model as any);

  beforeEach(() => jest.clearAllMocks());

  it('persists a trimmed message under the authenticated sender identity', async () => {
    const senderId = new Types.ObjectId();
    const created = { _id: new Types.ObjectId() };
    const projected = { ...created, senderId, messageContent: 'Hello travelers' };
    model.create.mockResolvedValue(created);
    model.aggregate.mockResolvedValue([projected]);

    await expect(service.createMessage(senderId as any, '  Hello travelers  ')).resolves.toEqual(
      projected,
    );
    expect(model.create).toHaveBeenCalledWith({ senderId, messageContent: 'Hello travelers' });
    expect(model.aggregate.mock.calls[0][0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ $lookup: expect.objectContaining({ from: 'members' }) }),
        expect.objectContaining({
          $project: expect.objectContaining({ 'memberData.memberNick': 1 }),
        }),
      ]),
    );
  });

  it('rejects whitespace-only Open Chat messages', async () => {
    await expect(service.createMessage(new Types.ObjectId() as any, '   ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(model.create).not.toHaveBeenCalled();
  });
});
