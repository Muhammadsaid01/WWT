/* eslint-disable @typescript-eslint/no-var-requires */
jest.mock('../libs/config', () => ({
  shapeIntoMongoObjectId: (value: unknown) =>
    typeof value === 'string' ? new (require('mongoose').Types.ObjectId)(value) : value,
}));

import { Types } from 'mongoose';
import * as WS from 'ws';
import { MemberType } from '../libs/enums/member.enum';
import { SocketGateway } from './socket.gateway';

describe('SocketGateway private room authorization', () => {
  const authService = { verifyToken: jest.fn() };
  const conversationService = { getConversation: jest.fn() };
  const messageService = {
    sendMessage: jest.fn(),
    markConversationAsRead: jest.fn(),
  };
  const openchatService = {};
  const aiService = {};
  let gateway: SocketGateway;

  function client() {
    return { readyState: WS.OPEN, send: jest.fn(), close: jest.fn() } as any;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new SocketGateway(
      authService as any,
      conversationService as any,
      messageService as any,
      openchatService as any,
      aiService as any,
    );
    gateway.server = { clients: new Set() } as any;
  });

  it('rejects an ADMIN joining a private room when participant access is denied', async () => {
    const socket = client();
    authService.verifyToken.mockResolvedValue({
      _id: new Types.ObjectId(),
      memberNick: 'admin',
      memberType: MemberType.ADMIN,
    });
    await gateway.handleConnection(socket, { url: '/chat?token=test' });
    conversationService.getConversation.mockRejectedValue(new Error('denied'));

    await gateway.handleJoinConversation(socket, {
      conversationId: new Types.ObjectId().toString(),
    });

    const payloads = socket.send.mock.calls.map(([value]: [string]) => JSON.parse(value));
    expect(payloads).toContainEqual(expect.objectContaining({ event: 'conversationError' }));
    expect(payloads).not.toContainEqual(expect.objectContaining({ event: 'conversationJoined' }));
  });

  it.each([MemberType.USER, MemberType.AGENT, MemberType.ADMIN])(
    'allows an authorized %s participant to join their private room',
    async (memberType) => {
      const socket = client();
      const memberId = new Types.ObjectId();
      const conversationId = new Types.ObjectId().toString();
      authService.verifyToken.mockResolvedValue({
        _id: memberId,
        memberNick: memberType.toLowerCase(),
        memberType,
      });
      conversationService.getConversation.mockResolvedValue({
        _id: conversationId,
        memberOneId: memberId,
        memberTwoId: new Types.ObjectId(),
      });

      await gateway.handleConnection(socket, { url: '/chat?token=test' });
      await gateway.handleJoinConversation(socket, { conversationId });

      expect(conversationService.getConversation).toHaveBeenCalledWith(memberId, conversationId);
      const payloads = socket.send.mock.calls.map(([value]: [string]) => JSON.parse(value));
      expect(payloads).toContainEqual({
        event: 'conversationJoined',
        data: { conversationId },
      });
    },
  );

  it('uses the authenticated ADMIN identity and delivers private messages both ways', async () => {
    const adminSocket = client();
    const agentSocket = client();
    const adminId = new Types.ObjectId();
    const agentId = new Types.ObjectId();
    const conversationId = new Types.ObjectId().toString();
    authService.verifyToken.mockResolvedValueOnce({
      _id: adminId,
      memberNick: 'admin',
      memberType: MemberType.ADMIN,
    });
    authService.verifyToken.mockResolvedValueOnce({
      _id: agentId,
      memberNick: 'agent',
      memberType: MemberType.AGENT,
    });
    gateway.server = { clients: new Set([adminSocket, agentSocket]) } as any;
    await gateway.handleConnection(adminSocket, { url: '/chat?token=admin' });
    await gateway.handleConnection(agentSocket, { url: '/chat?token=agent' });
    adminSocket.send.mockClear();
    agentSocket.send.mockClear();

    const adminMessage = {
      _id: new Types.ObjectId(),
      conversationId,
      senderId: adminId,
      receiverId: agentId,
      messageContent: 'Admin to agent',
    };
    messageService.sendMessage.mockResolvedValueOnce(adminMessage);
    await gateway.handlePrivateMessage(adminSocket, {
      conversationId,
      messageContent: 'Admin to agent',
      ...({ senderId: agentId } as any),
    });

    expect(messageService.sendMessage).toHaveBeenNthCalledWith(1, adminId, {
      conversationId,
      messageType: undefined,
      messageContent: 'Admin to agent',
      messageImages: undefined,
    });
    expect(
      agentSocket.send.mock.calls.map(([value]: [string]) => JSON.parse(value)),
    ).toContainEqual({
      event: 'newMessage',
      data: JSON.parse(JSON.stringify(adminMessage)),
    });
    expect(
      adminSocket.send.mock.calls.map(([value]: [string]) => JSON.parse(value)),
    ).toContainEqual({
      event: 'messageSent',
      data: JSON.parse(JSON.stringify(adminMessage)),
    });

    const agentMessage = {
      _id: new Types.ObjectId(),
      conversationId,
      senderId: agentId,
      receiverId: adminId,
      messageContent: 'Agent to admin',
    };
    messageService.sendMessage.mockResolvedValueOnce(agentMessage);
    await gateway.handlePrivateMessage(agentSocket, {
      conversationId,
      messageContent: 'Agent to admin',
    });

    expect(messageService.sendMessage).toHaveBeenNthCalledWith(2, agentId, {
      conversationId,
      messageType: undefined,
      messageContent: 'Agent to admin',
      messageImages: undefined,
    });
    expect(
      adminSocket.send.mock.calls.map(([value]: [string]) => JSON.parse(value)),
    ).toContainEqual({
      event: 'newMessage',
      data: JSON.parse(JSON.stringify(agentMessage)),
    });
  });

  it('lets ADMIN mark only their participant-scoped conversation as read', async () => {
    const socket = client();
    const adminId = new Types.ObjectId();
    const conversationId = new Types.ObjectId().toString();
    authService.verifyToken.mockResolvedValue({
      _id: adminId,
      memberNick: 'admin',
      memberType: MemberType.ADMIN,
    });
    messageService.markConversationAsRead.mockResolvedValue(true);
    await gateway.handleConnection(socket, { url: '/chat?token=admin' });

    await gateway.handleConversationRead(socket, { conversationId });

    expect(messageService.markConversationAsRead).toHaveBeenCalledWith(adminId, conversationId);
    const payloads = socket.send.mock.calls.map(([value]: [string]) => JSON.parse(value));
    expect(payloads).toContainEqual({
      event: 'conversationReadSuccess',
      data: { conversationId },
    });
  });

  it('keeps a member online until their final socket disconnects', async () => {
    const memberId = new Types.ObjectId();
    const member = { _id: memberId, memberNick: 'member', memberType: MemberType.USER };
    const first = client();
    const second = client();
    const observer = client();
    authService.verifyToken.mockResolvedValue(member);
    gateway.server = { clients: new Set([first, second, observer]) } as any;

    await gateway.handleConnection(first, { url: '/chat?token=first' });
    await gateway.handleConnection(second, { url: '/chat?token=second' });
    authService.verifyToken.mockResolvedValue({
      _id: new Types.ObjectId(),
      memberNick: 'observer',
      memberType: MemberType.USER,
    });
    await gateway.handleConnection(observer, { url: '/chat?token=observer' });
    observer.send.mockClear();

    gateway.handleDisconnect(first);
    gateway.handleIsMemberOnline(observer, { memberId: memberId.toString() });

    expect(JSON.parse(observer.send.mock.calls.at(-1)[0])).toEqual({
      event: 'memberStatus',
      data: { memberId: memberId.toString(), isOnline: true },
    });

    gateway.handleDisconnect(second);
    gateway.handleIsMemberOnline(observer, { memberId: memberId.toString() });

    expect(JSON.parse(observer.send.mock.calls.at(-1)[0])).toEqual({
      event: 'memberStatus',
      data: { memberId: memberId.toString(), isOnline: false },
    });
  });

  it('delivers one persisted private message to every recipient tab', async () => {
    const senderSocket = client();
    const receiverFirstTab = client();
    const receiverSecondTab = client();
    const senderId = new Types.ObjectId();
    const receiverId = new Types.ObjectId();
    const conversationId = new Types.ObjectId().toString();
    authService.verifyToken
      .mockResolvedValueOnce({
        _id: senderId,
        memberNick: 'sender',
        memberType: MemberType.USER,
      })
      .mockResolvedValueOnce({
        _id: receiverId,
        memberNick: 'receiver',
        memberType: MemberType.AGENT,
      })
      .mockResolvedValueOnce({
        _id: receiverId,
        memberNick: 'receiver',
        memberType: MemberType.AGENT,
      });

    await gateway.handleConnection(senderSocket, { url: '/chat?token=sender' });
    await gateway.handleConnection(receiverFirstTab, { url: '/chat?token=receiver-one' });
    await gateway.handleConnection(receiverSecondTab, { url: '/chat?token=receiver-two' });
    senderSocket.send.mockClear();
    receiverFirstTab.send.mockClear();
    receiverSecondTab.send.mockClear();

    const savedMessage = {
      _id: new Types.ObjectId(),
      conversationId,
      senderId,
      receiverId,
      messageContent: 'Realtime multi-tab delivery',
    };
    messageService.sendMessage.mockResolvedValue(savedMessage);

    await gateway.handlePrivateMessage(senderSocket, {
      conversationId,
      messageContent: 'Realtime multi-tab delivery',
    });

    for (const receiverSocket of [receiverFirstTab, receiverSecondTab]) {
      const messages = receiverSocket.send.mock.calls
        .map(([value]: [string]) => JSON.parse(value))
        .filter((payload) => payload.event === 'newMessage');
      expect(messages).toEqual([
        {
          event: 'newMessage',
          data: JSON.parse(JSON.stringify(savedMessage)),
        },
      ]);
    }
  });

  it('authorizes and rejoins the conversation room after a socket reconnect', async () => {
    const memberId = new Types.ObjectId();
    const otherMemberId = new Types.ObjectId();
    const conversationId = new Types.ObjectId().toString();
    const member = { _id: memberId, memberNick: 'member', memberType: MemberType.USER };
    const firstSocket = client();
    const reconnectedSocket = client();
    authService.verifyToken.mockResolvedValue(member);
    conversationService.getConversation.mockResolvedValue({
      _id: conversationId,
      memberOneId: memberId,
      memberTwoId: otherMemberId,
    });

    await gateway.handleConnection(firstSocket, { url: '/chat?token=first' });
    await gateway.handleJoinConversation(firstSocket, { conversationId });
    gateway.handleDisconnect(firstSocket);

    await gateway.handleConnection(reconnectedSocket, { url: '/chat?token=reconnected' });
    await gateway.handleJoinConversation(reconnectedSocket, { conversationId });

    expect(conversationService.getConversation).toHaveBeenCalledTimes(2);
    const payloads = reconnectedSocket.send.mock.calls.map(([value]: [string]) =>
      JSON.parse(value),
    );
    expect(payloads).toContainEqual({
      event: 'conversationJoined',
      data: { conversationId },
    });
  });
});
