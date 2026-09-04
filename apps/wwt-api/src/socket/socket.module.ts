import { Module } from '@nestjs/common';
import { AIModule } from '../components/ai/ai.module';
import { AuthModule } from '../components/auth/auth.module';
import { MessageModule } from '../components/chat/message/message.module';
import { SocketGateway } from './socket.gateway';

@Module({
  imports: [AuthModule, MessageModule, AIModule],
  providers: [SocketGateway],
})
export class SocketModule {}
