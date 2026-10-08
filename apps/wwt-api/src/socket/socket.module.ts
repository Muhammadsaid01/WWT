import { Module } from '@nestjs/common';
import { AIModule } from '../components/ai/ai.module';
import { AuthModule } from '../components/auth/auth.module';
import { ConversationModule } from '../components/chat/conversation/conversation.module';
import { MessageModule } from '../components/chat/message/message.module';
import { OpenchatModule } from '../components/openchat/openchat.module';
import { SocketGateway } from './socket.gateway';

@Module({
  imports: [AuthModule, ConversationModule, MessageModule, OpenchatModule, AIModule],
  providers: [SocketGateway],
})
export class SocketModule {}
