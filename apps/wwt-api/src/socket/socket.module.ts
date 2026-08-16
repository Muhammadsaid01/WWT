import { Module } from '@nestjs/common';
import { AuthModule } from '../components/auth/auth.module';
import { MessageModule } from '../components/chat/message/message.module';
import { SocketGateway } from './socket.gateway';

@Module({
  imports: [AuthModule, MessageModule],
  providers: [SocketGateway],
})
export class SocketModule {}
