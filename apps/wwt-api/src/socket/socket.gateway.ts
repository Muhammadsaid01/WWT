import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import * as url from 'url';

import { Server } from 'ws';

import * as WS from 'ws';
import { AiService } from '../components/ai/ai.service';
import { AuthService } from '../components/auth/auth.service';
import { ConversationService } from '../components/chat/conversation/conversation.service';
import { MessageService } from '../components/chat/message/message.service';
import { OpenchatService } from '../components/openchat/openchat.service';
import { Member } from '../libs/dto/member/member';
import { PrivateMessageType } from '../libs/enums/chat.enum';
import { MemberType } from '../libs/enums/member.enum';
import { AIErrorCode } from '../libs/enums/common.enum';
type WsClient = WS.WebSocket;
/**
 * ============================================================
 * PAYLOAD INTERFACES
 * ============================================================
 */

interface SocketPayload {
  event: string;
  data?: any;
  message?: string;
}

interface JoinConversationPayload {
  conversationId: string;
}

interface TypingPayload {
  conversationId: string;
}

interface PrivateMessagePayload {
  conversationId: string;
  messageType?: PrivateMessageType;
  messageContent?: string;
  messageImages?: string[];
}

interface MessageReadPayload {
  messageId: string;
}

interface ConversationReadPayload {
  conversationId: string;
}

interface MemberOnlinePayload {
  memberId: string;
}

/**
 * ============================================================
 * SOCKET GATEWAY
 * ============================================================
 */

@WebSocketGateway({
  path: '/chat',
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SocketGateway.name);

  /**
   * memberId -> every active WebSocket for that member.
   */
  private readonly onlineClients = new Map<string, Set<WsClient>>();

  /**
   * WebSocket -> authenticated Member
   */
  private readonly clientsAuthMap = new Map<WsClient, Member>();

  /**
   * conversationId -> connected sockets
   */
  private readonly conversationRooms = new Map<string, Set<WsClient>>();

  private readonly openChatClients = new Set<WsClient>();
  private readonly aiLastRequestMap = new Map<string, number>();
  private readonly aiProcessingMembers = new Set<string>();
  private readonly AI_RATE_LIMIT_MS = 3000;
  private readonly AI_MAX_MESSAGE_LENGTH = 2000;
  constructor(
    private readonly authService: AuthService,
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly openchatService: OpenchatService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Native WS Server
   */
  @WebSocketServer()
  server: Server;

  /**
   * ============================================================
   * SERVER INIT
   * ============================================================
   */

  public afterInit(): void {
    this.logger.log('WWT WebSocket Server Initialized');
  }

  /**
   * ============================================================
   * AUTHENTICATION
   * ============================================================
   */

  private async retrieveAuth(req: any): Promise<Member | null> {
    try {
      const parsedUrl = url.parse(req.url, true);

      const { token } = parsedUrl.query;

      if (!token) {
        return null;
      }

      const member = await this.authService.verifyToken(token as string);

      return member;
    } catch (error) {
      this.logger.error('WebSocket authentication failed');

      return null;
    }
  }

  /**
   * ============================================================
   * CONNECTION
   * ============================================================
   */

  public async handleConnection(client: WsClient, req: any): Promise<void> {
    const authMember = await this.retrieveAuth(req);

    /**
     * WWT private chat.
     *
     * Guest socketga ruxsat bermaymiz.
     */
    if (!authMember) {
      this.logger.warn('Unauthorized WebSocket connection');

      this.sendToClient(client, {
        event: 'error',
        message: 'Unauthorized',
      });

      client.close();

      return;
    }

    const memberId = authMember._id.toString();

    /**
     * Socket -> Member
     */
    this.clientsAuthMap.set(client, authMember);

    /**
     * Member -> every active socket (multiple tabs/devices are supported).
     */
    const memberClients = this.onlineClients.get(memberId) ?? new Set<WsClient>();
    const wasOffline = memberClients.size === 0;
    memberClients.add(client);
    this.onlineClients.set(memberId, memberClients);

    this.logger.log(`Connected: ${authMember.memberNick} [${memberId}]`);

    /**
     * Connected clientga confirmation.
     */
    this.sendToClient(client, {
      event: 'connected',

      data: {
        memberId,
        memberNick: authMember.memberNick,
      },
    });

    /**
     * Boshqa online userlarga:
     *
     * "bu member online bo'ldi"
     */
    if (wasOffline) {
      this.emitToAll(
        {
          event: 'memberOnline',

          data: {
            memberId,
          },
        },

        client,
      );
    }
  }

  /**
   * ============================================================
   * DISCONNECT
   * ============================================================
   */

  public handleDisconnect(client: WsClient): void {
    const authMember = this.clientsAuthMap.get(client);

    if (!authMember) {
      return;
    }

    const memberId = authMember._id.toString();

    /**
     * Auth mapdan o'chiramiz.
     */
    this.clientsAuthMap.delete(client);

    /**
     * Remove only this socket. The member stays online while another tab or
     * device is still connected.
     */
    const memberClients = this.onlineClients.get(memberId);
    memberClients?.delete(client);
    const isLastConnection = !memberClients || memberClients.size === 0;
    if (isLastConnection) {
      this.onlineClients.delete(memberId);
    }

    const leftOpenChat = this.openChatClients.delete(client);

    /**
     * Userni barcha conversation roomlardan
     * chiqaramiz.
     */
    this.conversationRooms.forEach((clients, conversationId) => {
      clients.delete(client);

      /**
       * Room bo'sh qolgan bo'lsa
       * Mapdan ham o'chiramiz.
       */
      if (clients.size === 0) {
        this.conversationRooms.delete(conversationId);
      }
    });

    if (leftOpenChat) {
      this.emitToOpenChat({
        event: 'openChatInfo',
        data: {
          memberId,
          memberNick: authMember.memberNick,
          action: 'left',
          totalClient: this.openChatClients.size,
        },
      });
    }

    this.logger.log(`Disconnected: ${authMember.memberNick} [${memberId}]`);

    /**
     * Boshqa userlarga offline event.
     */
    if (isLastConnection) {
      this.emitToAll({
        event: 'memberOffline',

        data: {
          memberId,
        },
      });
    }
  }

  /**
   * ============================================================
   * JOIN CONVERSATION
   * ============================================================
   */

  @SubscribeMessage('joinConversation')
  public async handleJoinConversation(
    client: WsClient,
    payload: JoinConversationPayload,
  ): Promise<void> {
    const authMember = this.clientsAuthMap.get(client);
    if (!authMember || !this.canUsePrivateChat(authMember)) {
      this.sendToClient(client, {
        event: 'conversationError',
        message: 'Private chat access denied.',
      });
      return;
    }

    const { conversationId } = payload;
    if (!conversationId) {
      this.sendToClient(client, {
        event: 'conversationError',
        message: 'conversationId is required',
      });
      return;
    }

    try {
      await this.conversationService.getConversation(authMember._id, conversationId);
    } catch {
      this.sendToClient(client, {
        event: 'conversationError',
        message: 'Conversation was not found or access was denied.',
      });
      return;
    }

    let room = this.conversationRooms.get(conversationId);
    if (!room) {
      room = new Set<WsClient>();
      this.conversationRooms.set(conversationId, room);
    }
    room.add(client);

    this.sendToClient(client, {
      event: 'conversationJoined',
      data: { conversationId },
    });
  }

  /**
   * ============================================================
   * LEAVE CONVERSATION
   * ============================================================
   */

  @SubscribeMessage('leaveConversation')
  public handleLeaveConversation(client: WsClient, payload: JoinConversationPayload): void {
    const authMember = this.clientsAuthMap.get(client);

    if (!authMember || !this.canUsePrivateChat(authMember)) {
      return;
    }

    const { conversationId } = payload;

    if (!conversationId) {
      return;
    }

    const room = this.conversationRooms.get(conversationId);

    if (!room) {
      return;
    }

    /**
     * Socketni roomdan chiqaramiz.
     */
    room.delete(client);

    /**
     * Room bo'sh qolsa o'chiramiz.
     */
    if (room.size === 0) {
      this.conversationRooms.delete(conversationId);
    }

    this.logger.log(`${authMember.memberNick} left conversation [${conversationId}]`);

    this.sendToClient(client, {
      event: 'conversationLeft',

      data: {
        conversationId,
      },
    });
  }

  /**
   * ============================================================
   * PRIVATE MESSAGE
   * ============================================================
   */

  @SubscribeMessage('privateMessage')
  public async handlePrivateMessage(
    client: WsClient,
    payload: PrivateMessagePayload,
  ): Promise<void> {
    try {
      const authMember = this.clientsAuthMap.get(client);

      if (!authMember || !this.canUsePrivateChat(authMember)) {
        this.sendToClient(client, {
          event: 'error',
          message: 'Unauthorized',
        });

        return;
      }

      if (!payload.conversationId) {
        this.sendToClient(client, {
          event: 'error',
          message: 'conversationId is required',
        });

        return;
      }

      /**
       * 1. Socket payload -> PrivateMessageInput
       */
      const input = {
        conversationId: payload.conversationId,
        messageType: payload.messageType,
        messageContent: payload.messageContent,
        messageImages: payload.messageImages,
      };

      /**
       * 2. MongoDB ga saqlaymiz
       *
       * MessageService:
       * - conversationni tekshiradi
       * - receiverni aniqlaydi
       * - message yaratadi
       * - conversation.lastMessage update qiladi
       */
      const savedMessage = await this.messageService.sendMessage(authMember._id, input);

      /**
       * 3. Receiver ID DBdan kelgan message ichida bor
       */
      const receiverId = savedMessage.receiverId.toString();

      /**
       * 4. Receiverga real-time yuboramiz
       */
      this.emitToMember(receiverId, {
        event: 'newMessage',
        data: savedMessage,
      });

      /**
       * 5. Confirm to every active sender tab/device so their views stay in sync.
       */
      this.emitToMember(authMember._id.toString(), {
        event: 'messageSent',
        data: savedMessage,
      });

      this.logger.verbose(`MESSAGE [${authMember.memberNick}] -> [${receiverId}]`);
    } catch (err) {
      this.logger.error('Socket message sending failed', err);

      this.sendToClient(client, {
        event: 'messageError',
        message: err instanceof Error ? err.message : 'Message sending failed',
      });
    }
  }

  /**
   * ============================================================
   * READ MESSAGE
   * ============================================================
   */

  @SubscribeMessage('messageRead')
  public async handleMessageRead(client: WsClient, payload: MessageReadPayload): Promise<void> {
    try {
      const authMember = this.clientsAuthMap.get(client);

      if (!authMember || !this.canUsePrivateChat(authMember)) {
        this.sendToClient(client, {
          event: 'error',
          message: 'Unauthorized',
        });

        return;
      }

      if (!payload.messageId) {
        this.sendToClient(client, {
          event: 'messageError',
          message: 'messageId is required',
        });

        return;
      }

      /**
       * DB -> messageStatus = READ
       * DB -> readAt = new Date()
       */
      const updatedMessage = await this.messageService.markMessageAsRead(
        authMember._id,
        payload.messageId,
      );

      const senderId = updatedMessage.senderId.toString();

      /**
       * Senderga real-time xabar beramiz:
       * receiver message'ni o'qidi.
       */
      this.emitToMember(senderId, {
        event: 'messageRead',
        data: {
          messageId: updatedMessage._id.toString(),

          conversationId: updatedMessage.conversationId.toString(),

          messageStatus: updatedMessage.messageStatus,

          readAt: updatedMessage.readAt,
        },
      });

      /**
       * Receiverga confirmation
       */
      this.sendToClient(client, {
        event: 'messageReadSuccess',
        data: {
          messageId: updatedMessage._id.toString(),

          messageStatus: updatedMessage.messageStatus,

          readAt: updatedMessage.readAt,
        },
      });

      this.logger.verbose(`MESSAGE READ [${updatedMessage._id}] by [${authMember.memberNick}]`);
    } catch (err) {
      this.logger.error('Socket message read failed', err);

      this.sendToClient(client, {
        event: 'messageError',
        message: err instanceof Error ? err.message : 'Message read failed',
      });
    }
  }

  /**
   * ============================================================
   * READ CONVERSATION
   * ============================================================
   */

  @SubscribeMessage('conversationRead')
  public async handleConversationRead(
    client: WsClient,
    payload: ConversationReadPayload,
  ): Promise<void> {
    try {
      const authMember = this.clientsAuthMap.get(client);

      if (!authMember || !this.canUsePrivateChat(authMember)) {
        this.sendToClient(client, {
          event: 'error',
          message: 'Unauthorized',
        });

        return;
      }

      if (!payload.conversationId) {
        this.sendToClient(client, {
          event: 'messageError',
          message: 'conversationId is required',
        });

        return;
      }

      await this.messageService.markConversationAsRead(authMember._id, payload.conversationId);

      /**
       * Receiverga confirmation
       */
      this.sendToClient(client, {
        event: 'conversationReadSuccess',
        data: {
          conversationId: payload.conversationId,
        },
      });

      /**
       * Hozircha senderIdlarni alohida topmayapmiz.
       * Keyin xohlasak unread message senderlariga
       * conversationRead event yuboramiz.
       */

      this.logger.verbose(
        `CONVERSATION READ [${payload.conversationId}] by [${authMember.memberNick}]`,
      );
    } catch (err) {
      this.logger.error('Socket conversation read failed', err);

      this.sendToClient(client, {
        event: 'messageError',
        message: err instanceof Error ? err.message : 'Conversation read failed',
      });
    }
  }

  /**
   * ============================================================
   * TYPING START
   * ============================================================
   */

  @SubscribeMessage('typingStart')
  public async handleTypingStart(client: WsClient, payload: TypingPayload): Promise<void> {
    await this.emitAuthorizedTyping(client, payload, 'typingStart');
  }

  @SubscribeMessage('typingStop')
  public async handleTypingStop(client: WsClient, payload: TypingPayload): Promise<void> {
    await this.emitAuthorizedTyping(client, payload, 'typingStop');
  }

  private async emitAuthorizedTyping(
    client: WsClient,
    payload: TypingPayload,
    event: 'typingStart' | 'typingStop',
  ): Promise<void> {
    const authMember = this.clientsAuthMap.get(client);
    if (!authMember || !payload.conversationId) return;

    try {
      const conversation = await this.conversationService.getConversation(
        authMember._id,
        payload.conversationId,
      );
      const receiverId =
        conversation.memberOneId.toString() === authMember._id.toString()
          ? conversation.memberTwoId.toString()
          : conversation.memberOneId.toString();

      this.emitToMember(receiverId, {
        event,
        data: {
          conversationId: payload.conversationId,
          memberId: authMember._id.toString(),
          memberNick: authMember.memberNick,
        },
      });
    } catch {
      this.sendToClient(client, {
        event: 'conversationError',
        message: 'Conversation was not found or access was denied.',
      });
    }
  }

  /**
   * ============================================================
   * MEMBER ONLINE
   * ============================================================
   */

  @SubscribeMessage('isMemberOnline')
  public handleIsMemberOnline(client: WsClient, payload: MemberOnlinePayload): void {
    const authMember = this.clientsAuthMap.get(client);

    if (!authMember) {
      this.sendToClient(client, {
        event: 'error',
        message: 'Unauthorized',
      });

      return;
    }

    if (!payload.memberId) {
      this.sendToClient(client, {
        event: 'error',
        message: 'memberId is required',
      });

      return;
    }

    const isOnline = this.onlineClients.has(payload.memberId);

    this.sendToClient(client, {
      event: 'memberStatus',
      data: {
        memberId: payload.memberId,
        isOnline,
      },
    });
  }

  /**
   * ============================================================
   * SEND TO ONE SOCKET
   * ============================================================
   */

  private canUsePrivateChat(member: Member): boolean {
    return (
      member.memberType === MemberType.USER ||
      member.memberType === MemberType.AGENT ||
      member.memberType === MemberType.ADMIN
    );
  }

  private sendToClient(client: WsClient, payload: SocketPayload): void {
    if (client.readyState !== WS.OPEN) {
      return;
    }

    client.send(JSON.stringify(payload));
  }

  /**
   * ============================================================
   * SEND TO MEMBER
   * ============================================================
   */

  private emitToMember(memberId: string, payload: SocketPayload): void {
    const clients = this.onlineClients.get(memberId);

    /**
     * Member offline.
     */
    if (!clients) {
      return;
    }

    clients.forEach((client) => this.sendToClient(client, payload));
  }

  /**
   * ============================================================
   * SEND TO CONVERSATION ROOM
   * ============================================================
   */

  private emitToConversation(
    conversationId: string,
    payload: SocketPayload,
    sender?: WsClient,
  ): void {
    const room = this.conversationRooms.get(conversationId);

    if (!room) {
      return;
    }

    room.forEach((client) => {
      /**
       * Senderga qayta yubormaymiz.
       */
      if (sender && client === sender) {
        return;
      }

      this.sendToClient(client, payload);
    });
  }

  /**
   * ============================================================
   * SEND TO ALL ONLINE SOCKETS
   * ============================================================
   */

  private emitToAll(payload: SocketPayload, exceptClient?: WsClient): void {
    this.server.clients.forEach((client) => {
      /**
       * Kerak bo'lsa senderni
       * chiqarib tashlaymiz.
       */
      if (exceptClient && client === exceptClient) {
        return;
      }

      this.sendToClient(client, payload);
    });
  }

  @SubscribeMessage('openChatMessage')
  public async handleOpenChatMessage(client: WsClient, payload: string): Promise<void> {
    const authMember = this.clientsAuthMap.get(client);
    if (!authMember) {
      this.sendToClient(client, { event: 'openChatError', message: 'Unauthorized' });
      return;
    }
    if (!this.openChatClients.has(client)) {
      this.sendToClient(client, { event: 'openChatError', message: 'Join open chat first' });
      return;
    }

    try {
      const savedMessage = await this.openchatService.createMessage(authMember._id, payload);
      this.emitToOpenChat({ event: 'openChatMessage', data: savedMessage });
    } catch (error) {
      this.sendToClient(client, {
        event: 'openChatError',
        message: error instanceof Error ? error.message : 'Message could not be sent.',
      });
    }
  }

  @SubscribeMessage('openChatJoin')
  public async handleOpenChatJoin(client: WsClient): Promise<void> {
    const authMember = this.clientsAuthMap.get(client);
    if (!authMember) {
      this.sendToClient(client, { event: 'openChatError', message: 'Unauthorized' });
      return;
    }

    try {
      const history = await this.openchatService.getMessages({
        page: 1,
        limit: 20,
        sort: 'createdAt',
        direction: -1,
      });
      this.openChatClients.add(client);
      this.sendToClient(client, { event: 'openChatMessages', data: history });
      this.emitToOpenChat({
        event: 'openChatInfo',
        data: {
          memberId: authMember._id.toString(),
          memberNick: authMember.memberNick,
          action: 'joined',
          totalClient: this.openChatClients.size,
        },
      });
    } catch (error) {
      this.sendToClient(client, {
        event: 'openChatError',
        message: error instanceof Error ? error.message : 'Open Chat could not be loaded.',
      });
    }
  }

  private emitToOpenChat(payload: SocketPayload): void {
    this.openChatClients.forEach((client) => this.sendToClient(client, payload));
  }

  @SubscribeMessage('openChatLeave')
  public handleOpenChatLeave(client: WsClient): void {
    const authMember = this.clientsAuthMap.get(client);
    if (!authMember || !this.openChatClients.delete(client)) return;

    this.emitToOpenChat({
      event: 'openChatInfo',
      data: {
        memberId: authMember._id.toString(),
        memberNick: authMember.memberNick,
        action: 'left',
        totalClient: this.openChatClients.size,
      },
    });
  }

  // =========================================================
  // AI CHAT JOIN
  // =========================================================

  @SubscribeMessage('aiChatJoin')
  public async handleAIChatJoin(client: WsClient): Promise<void> {
    try {
      const authMember = this.clientsAuthMap.get(client);

      if (!authMember) {
        this.sendToClient(client, {
          event: 'aiError',
          message: 'Unauthorized',
        });

        return;
      }

      // Userning AI conversationini oladi.
      // Agar mavjud bo'lmasa AiService yaratadi.
      // Keyin oldingi AI message historyni olib keladi.
      const messages = await this.aiService.getMessages(authMember._id);

      this.sendToClient(client, {
        event: 'aiChatHistory',
        data: {
          list: messages,
          available: this.aiService.isAvailable(),
        },
      });

      this.logger.verbose(`AI CHAT JOIN [${authMember.memberNick}]`);
    } catch (err) {
      this.logger.error('AI chat join failed', err);

      this.sendToClient(client, {
        event: 'aiError',
        message: err instanceof Error ? err.message : 'Failed to load AI chat',
      });
    }
  }

  @SubscribeMessage('aiMessage')
  public async handleAIMessage(client: WsClient, payload: string): Promise<void> {
    const authMember = this.clientsAuthMap.get(client);

    // =========================================================
    // AUTH CHECK
    // =========================================================

    if (!authMember) {
      this.sendToClient(client, {
        event: 'aiError',
        data: {
          code: AIErrorCode.UNAUTHORIZED,
          message: 'Unauthorized',
        },
      });

      return;
    }

    // =========================================================
    // MESSAGE VALIDATION
    // =========================================================

    const content = payload?.trim();

    if (!this.aiService.isAvailable()) {
      this.sendToClient(client, {
        event: 'aiError',
        data: {
          code: AIErrorCode.AI_UNAVAILABLE,
          message: 'AI Assistant is not configured on the server.',
        },
      });
      return;
    }

    // EMPTY MESSAGE
    if (!content) {
      this.sendToClient(client, {
        event: 'aiError',
        data: {
          code: AIErrorCode.MESSAGE_REQUIRED,
          message: 'Message is required',
        },
      });

      return;
    }

    // MESSAGE LENGTH LIMIT
    if (content.length > this.AI_MAX_MESSAGE_LENGTH) {
      this.sendToClient(client, {
        event: 'aiError',
        data: {
          code: AIErrorCode.MESSAGE_TOO_LONG,
          message: `Message must not exceed ${this.AI_MAX_MESSAGE_LENGTH} characters.`,
          maxLength: this.AI_MAX_MESSAGE_LENGTH,
          currentLength: content.length,
        },
      });

      return;
    }

    const memberId = authMember._id.toString();

    // =========================================================
    // CHECK IF PREVIOUS AI REQUEST IS STILL PROCESSING
    // =========================================================

    if (this.aiProcessingMembers.has(memberId)) {
      this.sendToClient(client, {
        event: 'aiError',
        data: {
          code: AIErrorCode.AI_BUSY,
          message: 'Your previous AI request is still processing.',
        },
      });

      return;
    }

    // =========================================================
    // RATE LIMIT
    // =========================================================

    const retryAfter = this.checkAIRateLimit(memberId);

    if (retryAfter > 0) {
      this.sendToClient(client, {
        event: 'aiError',
        data: {
          code: AIErrorCode.RATE_LIMIT,
          message: 'Please wait before sending another message.',
          retryAfter,
        },
      });

      return;
    }

    // =========================================================
    // LOCK MEMBER
    // =========================================================

    this.aiProcessingMembers.add(memberId);

    try {
      // =========================================================
      // 1. SAVE USER MESSAGE
      // =========================================================

      const userMessage = await this.aiService.saveUserMessage(authMember._id, content);

      this.sendToClient(client, {
        event: 'aiUserMessage',
        data: userMessage,
      });

      // =========================================================
      // 2. THINKING ON
      // =========================================================

      this.sendToClient(client, {
        event: 'aiThinking',
        data: {
          isThinking: true,
        },
      });

      // =========================================================
      // 3. GENERATE AI RESPONSE
      // =========================================================

      const aiResult = await this.aiService.generateResponse(authMember._id);

      // =========================================================
      // 4. SAVE AI RESPONSE
      // =========================================================

      const aiMessage = await this.aiService.saveAIMessage(
        authMember._id,
        aiResult.text,
        'gemini-3.5-flash',
        aiResult.inputTokens,
        aiResult.outputTokens,
      );

      // =========================================================
      // 5. SEND AI RESPONSE
      // =========================================================

      this.sendToClient(client, {
        event: 'aiResponse',
        data: aiMessage,
      });

      this.logger.verbose(`AI MESSAGE [${authMember.memberNick}]: ${content}`);
    } catch (err) {
      // =========================================================
      // ERROR
      // =========================================================

      const errorMessage = err instanceof Error ? err.message : 'AI message failed';

      this.logger.error(
        `AI MESSAGE FAILED [${authMember.memberNick}]: ${errorMessage}`,
        err instanceof Error ? err.stack : undefined,
      );

      let code: AIErrorCode = AIErrorCode.AI_ERROR;
      let message = 'AI service failed. Please try again.';

      const status =
        (err as any)?.status ?? (err as any)?.statusCode ?? (err as any)?.response?.status;

      // Gemini / provider quota yoki rate-limit
      if (status === 429) {
        code = AIErrorCode.QUOTA_EXCEEDED;
        message = 'AI request limit has been reached. Please try again later.';
      }

      // Gemini vaqtincha unavailable
      else if (status === 500 || status === 502 || status === 503) {
        code = AIErrorCode.AI_UNAVAILABLE;
        message = 'AI service is temporarily unavailable. Please try again later.';
      }

      // Timeout
      else if (
        errorMessage.toLowerCase().includes('timeout') ||
        errorMessage.toLowerCase().includes('timed out') ||
        (err as any)?.code === 'ETIMEDOUT'
      ) {
        code = AIErrorCode.AI_TIMEOUT;
        message = 'AI request timed out. Please try again.';
      }

      // Qolgan noma'lum errorlar
      else {
        code = AIErrorCode.AI_ERROR;
        message = errorMessage;
      }

      this.sendToClient(client, {
        event: 'aiError',
        data: {
          code,
          message,
        },
      });
    } finally {
      // =========================================================
      // ALWAYS UNLOCK MEMBER
      // =========================================================

      this.aiProcessingMembers.delete(memberId);

      // =========================================================
      // THINKING OFF
      // =========================================================

      this.sendToClient(client, {
        event: 'aiThinking',
        data: {
          isThinking: false,
        },
      });

      this.logger.debug(`AI PROCESSING UNLOCKED [${authMember.memberNick}]`);
    }
  }

  // =========================================================
  // AI CHAT CLEAR / NEW CHAT
  // =========================================================

  @SubscribeMessage('aiChatClear')
  public async handleAIChatClear(client: WsClient): Promise<void> {
    try {
      const authMember = this.clientsAuthMap.get(client);

      if (!authMember) {
        this.sendToClient(client, {
          event: 'aiError',
          message: 'Unauthorized',
        });

        return;
      }

      // AI chat historyni tozalash
      await this.aiService.clearChat(authMember._id);

      // Clientga success response
      this.sendToClient(client, {
        event: 'aiChatCleared',
        data: {
          success: true,
        },
      });

      this.logger.verbose(`AI CHAT CLEARED [${authMember.memberNick}]`);
    } catch (err) {
      this.logger.error('AI chat clear failed', err);

      this.sendToClient(client, {
        event: 'aiError',
        message: err instanceof Error ? err.message : 'Failed to clear AI chat',
      });
    }
  }

  private checkAIRateLimit(memberId: string): number {
    const now = Date.now();

    const lastRequest = this.aiLastRequestMap.get(memberId);

    if (!lastRequest) {
      this.aiLastRequestMap.set(memberId, now);

      return 0;
    }

    const difference = now - lastRequest;

    if (difference >= this.AI_RATE_LIMIT_MS) {
      this.aiLastRequestMap.set(memberId, now);

      return 0;
    }

    return this.AI_RATE_LIMIT_MS - difference;
  }
}
