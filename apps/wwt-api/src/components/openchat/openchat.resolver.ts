import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { OpenChatMessages } from '../../libs/dto/chat/open-chat-message';
import { OpenChatMessagesInquiry } from '../../libs/dto/chat/open-chat-message.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { OpenchatService } from './openchat.service';

@Resolver()
export class OpenchatResolver {
  constructor(private readonly openchatService: OpenchatService) {}

  @UseGuards(AuthGuard)
  @Query(() => OpenChatMessages)
  public async getOpenChatMessages(
    @Args('input') input: OpenChatMessagesInquiry,
  ): Promise<OpenChatMessages> {
    return this.openchatService.getMessages(input);
  }
}
