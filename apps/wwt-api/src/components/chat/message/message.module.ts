import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import PrivateConversationSchema from '../../../schemas/chat/PrivateConversation.schema';
import PrivateMessageSchema from '../../../schemas/chat/PrivateMessage.schema';
import { AuthModule } from '../../auth/auth.module';
import { MessageResolver } from './message.resolver';
import { MessageService } from './message.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Conversation',
        schema: PrivateConversationSchema,
      },
      {
        name: 'Message',
        schema: PrivateMessageSchema,
      },
    ]),

    AuthModule,
  ],

  providers: [MessageResolver, MessageService],

  exports: [MessageService],
})
export class MessageModule {}
