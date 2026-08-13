import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import PrivateConversationSchema from '../../../schemas/chat/PrivateConversation.schema';
import PrivateMessageSchema from '../../../schemas/chat/PrivateMessage.schema';
import { AuthModule } from '../../auth/auth.module';
import { MemberModule } from '../../member/member.module';
import { ConversationResolver } from './conversation.resolver';
import { ConversationService } from './conversation.service';

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
    MemberModule,
  ],

  providers: [ConversationResolver, ConversationService],

  exports: [ConversationService],
})
export class ConversationModule {}
