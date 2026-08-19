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

import { AiService } from '../components/ai/ai.service';
import { AuthService } from '../components/auth/auth.service';
import { MessageService } from '../components/chat/message/message.service';
import { shapeIntoMongoObjectId } from '../libs/config';
import { Member } from '../libs/dto/member/member';
import { PrivateMessageType } from '../libs/enums/chat.enum';

import * as WS from 'ws';
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
  receiverId: string;
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

interface OpenChatMessagePayload {
  event: string;
  text: string;
  memberData: Member;
  createdAt: Date;
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
   * memberId -> WebSocket
   *
   * Hozircha bitta member = bitta socket.
   * Keyinchalik multiple device support kerak bo'lsa:
   *
   * Map<string, Set<WsClient>>
   *
   * qilamiz.
   */
  private readonly onlineClients = new Map<string, WsClient>();

  /**
   * WebSocket -> authenticated Member
   */
  private readonly clientsAuthMap = new Map<WsClient, Member>();

  /**
   * conversationId -> connected sockets
   */
  private readonly conversationRooms = new Map<string, Set<WsClient>>();

  private readonly openChatMessages: OpenChatMessagePayload[] = [];
  private readonly openChatClients = new Set<WsClient>();
  constructor(
    private readonly authService: AuthService,
    private readonly messageService: MessageService,
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
     * Member -> Socket
     */
    this.onlineClients.set(memberId, client);

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
     * Online clientsdan o'chiramiz.
     */
    this.onlineClients.delete(memberId);

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

    this.logger.log(`Disconnected: ${authMember.memberNick} [${memberId}]`);

    /**
     * Boshqa userlarga offline event.
     */
    this.emitToAll({
      event: 'memberOffline',

      data: {
        memberId,
      },
    });
  }

  /**
   * ============================================================
   * JOIN CONVERSATION
   * ============================================================
   */

  @SubscribeMessage('joinConversation')
  public handleJoinConversation(client: WsClient, payload: JoinConversationPayload): void {
    const authMember = this.clientsAuthMap.get(client);

    /**
     * Auth bo'lmagan socket
     * conversationga kira olmaydi.
     */
    if (!authMember) {
      return;
    }

    const { conversationId } = payload;

    if (!conversationId) {
      this.sendToClient(client, {
        event: 'error',
        message: 'conversationId is required',
      });

      return;
    }

    /**
     * Room mavjudligini tekshiramiz.
     */
    let room = this.conversationRooms.get(conversationId);

    /**
     * Yo'q bo'lsa yangi room.
     */
    if (!room) {
      room = new Set<WsClient>();

      this.conversationRooms.set(conversationId, room);
    }

    /**
     * Socketni roomga qo'shamiz.
     */
    room.add(client);

    this.logger.log(`${authMember.memberNick} joined conversation [${conversationId}]`);

    this.sendToClient(client, {
      event: 'conversationJoined',

      data: {
        conversationId,
      },
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

    if (!authMember) {
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

      if (!authMember) {
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
       * 5. Senderga confirmation
       */
      this.sendToClient(client, {
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

      if (!authMember) {
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
        shapeIntoMongoObjectId(payload.messageId),
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

      if (!authMember) {
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

      const conversationId = shapeIntoMongoObjectId(payload.conversationId);

      await this.messageService.markConversationAsRead(authMember._id, conversationId);

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
  public handleTypingStart(client: WsClient, payload: TypingPayload): void {
    const authMember = this.clientsAuthMap.get(client);

    if (!authMember) {
      return;
    }

    if (!payload.conversationId || !payload.receiverId) {
      return;
    }

    this.emitToMember(payload.receiverId, {
      event: 'typingStart',
      data: {
        conversationId: payload.conversationId,
        memberId: authMember._id.toString(),
        memberNick: authMember.memberNick,
      },
    });
  }

  /**
   * ============================================================
   * TYPING STOP
   * ============================================================
   */

  @SubscribeMessage('typingStop')
  public handleTypingStop(client: WsClient, payload: TypingPayload): void {
    const authMember = this.clientsAuthMap.get(client);

    if (!authMember) {
      return;
    }

    if (!payload.conversationId || !payload.receiverId) {
      return;
    }

    this.emitToMember(payload.receiverId, {
      event: 'typingStop',
      data: {
        conversationId: payload.conversationId,
        memberId: authMember._id.toString(),
        memberNick: authMember.memberNick,
      },
    });
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
    const client = this.onlineClients.get(memberId);

    /**
     * Member offline.
     */
    if (!client) {
      return;
    }

    this.sendToClient(client, payload);
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
      this.sendToClient(client, {
        event: 'error',
        message: 'Unauthorized',
      });

      return;
    }

    // Open chatga join qilmagan bo'lsa
    if (!this.openChatClients.has(client)) {
      this.sendToClient(client, {
        event: 'error',
        message: 'Join open chat first',
      });

      return;
    }

    if (!payload?.trim()) {
      return;
    }

    const newMessage: OpenChatMessagePayload = {
      event: 'openChatMessage',
      text: payload.trim(),
      memberData: authMember,
      createdAt: new Date(),
    };

    this.openChatMessages.push(newMessage);

    // RAM'da oxirgi 20 ta
    if (this.openChatMessages.length > 20) {
      this.openChatMessages.splice(0, this.openChatMessages.length - 20);
    }

    console.log('EMITTING TO OPEN CHAT:', this.openChatClients.size);

    this.emitToOpenChat(newMessage);

    this.logger.verbose(`OPEN CHAT [${authMember.memberNick}]: ${payload}`);
  }

  @SubscribeMessage('openChatJoin')
  public handleOpenChatJoin(client: WsClient): void {
    const authMember = this.clientsAuthMap.get(client);

    if (!authMember) {
      this.sendToClient(client, {
        event: 'error',
        message: 'Unauthorized',
      });

      return;
    }

    this.openChatClients.add(client);

    console.log('OPEN CHAT CLIENTS:', this.openChatClients.size);

    // Oldingi 20 ta message
    this.sendToClient(client, {
      event: 'openChatMessages',
      data: {
        list: this.openChatMessages,
      },
    });

    // Open chat ichidagi userlarga joined event
    this.emitToOpenChat({
      event: 'openChatInfo',
      data: {
        memberId: authMember._id.toString(),
        memberNick: authMember.memberNick,
        action: 'joined',
        totalClient: this.openChatClients.size,
      },
    });
  }

  private emitToOpenChat(payload: SocketPayload): void {
    console.log('emitToOpenChat clients:', this.openChatClients.size);

    this.openChatClients.forEach((client) => {
      console.log('client readyState:', client.readyState);

      this.sendToClient(client, payload);
    });
  }

  @SubscribeMessage('openChatLeave')
  public handleOpenChatLeave(client: WsClient): void {
    const authMember = this.clientsAuthMap.get(client);

    if (!authMember) {
      return;
    }

    this.openChatClients.delete(client);

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
    try {
      const authMember = this.clientsAuthMap.get(client);

      if (!authMember) {
        this.sendToClient(client, {
          event: 'aiError',
          message: 'Unauthorized',
        });
        return;
      }

      const content = payload?.trim();

      if (!content) {
        this.sendToClient(client, {
          event: 'aiError',
          message: 'Message is required',
        });
        return;
      }

      // 1. User message -> MongoDB
      const userMessage = await this.aiService.saveUserMessage(authMember._id, content);

      this.sendToClient(client, {
        event: 'aiUserMessage',
        data: userMessage,
      });

      // 2. Thinking ON
      this.sendToClient(client, {
        event: 'aiThinking',
        data: {
          isThinking: true,
        },
      });

      const aiResult = await this.aiService.generateResponse(authMember._id);

      const aiMessage = await this.aiService.saveAIMessage(
        authMember._id,
        aiResult.text,
        'gemini-3.5-flash',
        aiResult.inputTokens,
        aiResult.outputTokens,
      );

      // 5. Response
      this.sendToClient(client, {
        event: 'aiResponse',
        data: aiMessage,
      });

      // 6. Thinking OFF
      this.sendToClient(client, {
        event: 'aiThinking',
        data: {
          isThinking: false,
        },
      });

      this.logger.verbose(`AI MESSAGE [${authMember.memberNick}]: ${content}`);
    } catch (err) {
      this.logger.error('AI message failed', err);

      this.sendToClient(client, {
        event: 'aiThinking',
        data: {
          isThinking: false,
        },
      });

      this.sendToClient(client, {
        event: 'aiError',
        message: err instanceof Error ? err.message : 'AI message failed',
      });
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
}
