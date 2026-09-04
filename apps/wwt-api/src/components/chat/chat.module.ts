import { Module } from '@nestjs/common';
import { ConversationModule } from './conversation/conversation.module';
import { MessageModule } from './message/message.module';

@Module({
  imports: [ConversationModule, MessageModule],
  exports: [ConversationModule, MessageModule],
})
export class ChatModule {}
