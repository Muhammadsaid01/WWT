import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import OpenChatMessageSchema from '../../schemas/chat/OpenChatMessage.schema';
import { AuthModule } from '../auth/auth.module';
import { OpenchatResolver } from './openchat.resolver';
import { OpenchatService } from './openchat.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'OpenChatMessage',
        schema: OpenChatMessageSchema,
      },
    ]),
    AuthModule,
  ],
  providers: [OpenchatResolver, OpenchatService],
  exports: [OpenchatService],
})
export class OpenchatModule {}
