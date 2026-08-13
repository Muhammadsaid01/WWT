import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../../libs/config';
import { PrivateMessage, PrivateMessages } from '../../../libs/dto/chat/private-message';
import {
  PrivateMessageInput,
  PrivateMessagesInquiry,
} from '../../../libs/dto/chat/private-message.input';
import { AuthMember } from '../../auth/decorators/authMember.decorator';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { MessageService } from './message.service';

@Resolver()
export class MessageResolver {
  constructor(private readonly messageService: MessageService) {}
  @UseGuards(AuthGuard)
  @Mutation(() => PrivateMessage)
  public async sendMessage(
    @Args('input') input: PrivateMessageInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PrivateMessage> {
    console.log('Mutation: sendMessage');

    return this.messageService.sendMessage(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Query(() => PrivateMessages)
  public async getMessages(
    @AuthMember('_id')
    memberId: ObjectId,

    @Args('conversationId', {
      type: () => String,
    })
    conversationId: string,

    @Args('input')
    input: PrivateMessagesInquiry,
  ): Promise<PrivateMessages> {
    console.log('Query: getMessages');

    return this.messageService.getMessages(memberId, shapeIntoMongoObjectId(conversationId), input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => PrivateMessage)
  public async markMessageAsRead(
    @Args('messageId', { type: () => String })
    messageId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PrivateMessage> {
    console.log('Mutation: markMessageAsRead');

    return this.messageService.markMessageAsRead(memberId, shapeIntoMongoObjectId(messageId));
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Boolean)
  public async markConversationAsRead(
    @Args('conversationId', { type: () => String })
    conversationId: string,

    @AuthMember('_id')
    memberId: ObjectId,
  ): Promise<boolean> {
    console.log('Mutation: markConversationAsRead');

    return this.messageService.markConversationAsRead(
      memberId,
      shapeIntoMongoObjectId(conversationId),
    );
  }

  @UseGuards(AuthGuard)
  @Mutation(() => PrivateMessage)
  public async deleteMessage(
    @Args('messageId', { type: () => String })
    messageId: string,

    @AuthMember('_id')
    memberId: ObjectId,
  ): Promise<PrivateMessage> {
    console.log('Mutation: deleteMessage');

    return this.messageService.deleteMessage(memberId, shapeIntoMongoObjectId(messageId));
  }
}
