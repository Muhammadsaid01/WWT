import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import AIConversationSchema from '../../schemas/ai-chat-bot/ai-conversation.schema';
import AIMessageSchema from '../../schemas/ai-chat-bot/ai-message.schema';
import { TravelPackageModule } from '../travel-package/travel-package.module';
import { AiService } from './ai.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'AIConversation',
        schema: AIConversationSchema,
      },
      {
        name: 'AIMessage',
        schema: AIMessageSchema,
      },
    ]),
    TravelPackageModule,
  ],

  providers: [AiService],

  exports: [AiService],
})
export class AIModule {}
