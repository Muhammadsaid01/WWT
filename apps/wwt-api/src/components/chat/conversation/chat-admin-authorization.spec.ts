/* eslint-disable @typescript-eslint/no-var-requires */
jest.mock('../../../libs/config', () => ({
  shapeIntoMongoObjectId: (value: unknown) =>
    typeof value === 'string' ? new (require('mongoose').Types.ObjectId)(value) : value,
}));

import { Types } from 'mongoose';
import { MemberType } from '../../../libs/enums/member.enum';
import { ConversationResolver } from './conversation.resolver';
import { MessageResolver } from '../message/message.resolver';

const EXPECTED_PRIVATE_CHAT_ROLES = [MemberType.USER, MemberType.AGENT, MemberType.ADMIN];

function operationRoles(target: object, method: string): MemberType[] {
  return Reflect.getMetadata('roles', (target as any)[method]);
}

describe('Private Chat ADMIN authorization', () => {
  it.each(['createConversation', 'getMyConversations', 'getConversation', 'deleteConversation'])(
    'allows USER, AGENT and ADMIN on ConversationResolver.%s',
    (method) => {
      expect(operationRoles(ConversationResolver.prototype, method)).toEqual(
        EXPECTED_PRIVATE_CHAT_ROLES,
      );
    },
  );

  it.each([
    'sendMessage',
    'getMessages',
    'getMyUnreadMessageCount',
    'markMessageAsRead',
    'markConversationAsRead',
    'deleteMessage',
  ])('allows USER, AGENT and ADMIN on MessageResolver.%s', (method) => {
    expect(operationRoles(MessageResolver.prototype, method)).toEqual(EXPECTED_PRIVATE_CHAT_ROLES);
  });

  it('passes the authenticated ADMIN identity into conversation creation and access', async () => {
    const adminId = new Types.ObjectId();
    const targetId = new Types.ObjectId().toString();
    const conversationId = new Types.ObjectId().toString();
    const conversationService = {
      createConversation: jest.fn().mockResolvedValue({ _id: conversationId }),
      getConversation: jest.fn().mockResolvedValue({ _id: conversationId }),
    };
    const resolver = new ConversationResolver(conversationService as any);

    await resolver.createConversation(adminId as any, { memberTwoId: targetId });
    await resolver.getConversation(adminId as any, conversationId);

    expect(conversationService.createConversation).toHaveBeenCalledWith(adminId, {
      memberTwoId: targetId,
    });
    expect(conversationService.getConversation).toHaveBeenCalledWith(adminId, conversationId);
  });

  it('passes the authenticated ADMIN identity into send, history and read operations', async () => {
    const adminId = new Types.ObjectId();
    const conversationId = new Types.ObjectId().toString();
    const messageService = {
      sendMessage: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
      getMessages: jest.fn().mockResolvedValue({ list: [], metaCounter: [] }),
      markConversationAsRead: jest.fn().mockResolvedValue(true),
    };
    const resolver = new MessageResolver(messageService as any);
    const inquiry = { page: 1, limit: 20 };

    await resolver.sendMessage({ conversationId, messageContent: 'Hello' }, adminId as any);
    await resolver.getMessages(adminId as any, conversationId, inquiry);
    await resolver.markConversationAsRead(conversationId, adminId as any);

    expect(messageService.sendMessage).toHaveBeenCalledWith(adminId, {
      conversationId,
      messageContent: 'Hello',
    });
    expect(messageService.getMessages).toHaveBeenCalledWith(adminId, conversationId, inquiry);
    expect(messageService.markConversationAsRead).toHaveBeenCalledWith(adminId, conversationId);
  });
});
