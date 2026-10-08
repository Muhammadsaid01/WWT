import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { PrivateMessage, PrivateMessages } from '../../../libs/dto/chat/private-message';
import {
  PrivateMessageInput,
  PrivateMessagesInquiry,
} from '../../../libs/dto/chat/private-message.input';
import { AuthMember } from '../../auth/decorators/authMember.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { MemberType } from '../../../libs/enums/member.enum';
import { MessageService } from './message.service';

@Resolver()
export class MessageResolver {
  constructor(private readonly messageService: MessageService) {}
  @Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => PrivateMessage)
  public async sendMessage(
    @Args('input') input: PrivateMessageInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PrivateMessage> {
    console.log('Mutation: sendMessage');

    return this.messageService.sendMessage(memberId, input);
  }

  @Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
  @UseGuards(RolesGuard)
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

    return this.messageService.getMessages(memberId, conversationId, input);
  }

  @Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Number)
  public async getMyUnreadMessageCount(@AuthMember('_id') memberId: ObjectId): Promise<number> {
    return this.messageService.getUnreadMessageCount(memberId);
  }

  @Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => PrivateMessage)
  public async markMessageAsRead(
    @Args('messageId', { type: () => String })
    messageId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PrivateMessage> {
    console.log('Mutation: markMessageAsRead');

    return this.messageService.markMessageAsRead(memberId, messageId);
  }

  @Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Boolean)
  public async markConversationAsRead(
    @Args('conversationId', { type: () => String })
    conversationId: string,

    @AuthMember('_id')
    memberId: ObjectId,
  ): Promise<boolean> {
    console.log('Mutation: markConversationAsRead');

    return this.messageService.markConversationAsRead(memberId, conversationId);
  }

  @Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => PrivateMessage)
  public async deleteMessage(
    @Args('messageId', { type: () => String })
    messageId: string,

    @AuthMember('_id')
    memberId: ObjectId,
  ): Promise<PrivateMessage> {
    console.log('Mutation: deleteMessage');

    return this.messageService.deleteMessage(memberId, messageId);
  }
}
