import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../../libs/config';
import {
  PrivateConversation,
  PrivateConversations,
} from '../../../libs/dto/chat/private-conversation';
import {
  PrivateConversationInput,
  PrivateConversationsInquiry,
} from '../../../libs/dto/chat/private-conversation.input';
import { AuthMember } from '../../auth/decorators/authMember.decorator';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { ConversationService } from './conversation.service';

@Resolver()
export class ConversationResolver {
  constructor(private readonly conversationService: ConversationService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => PrivateConversation)
  public async createConversation(
    @AuthMember('_id') memberId: ObjectId,
    @Args('input') input: PrivateConversationInput,
  ): Promise<PrivateConversation> {
    console.log('Mutation: createConversation');

    return this.conversationService.createConversation(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Query(() => PrivateConversations)
  public async getMyConversations(
    @AuthMember('_id') memberId: ObjectId,
    @Args('input') input: PrivateConversationsInquiry,
  ): Promise<PrivateConversations> {
    console.log('Query: getMyConversations');

    return this.conversationService.getMyConversations(memberId, input);
  }
  @UseGuards(AuthGuard)
  @Query(() => PrivateConversation)
  public async getConversation(
    @AuthMember('_id') memberId: ObjectId,

    @Args('conversationId', { type: () => String })
    conversationId: string,
  ): Promise<PrivateConversation> {
    console.log('Query: getConversation');

    return this.conversationService.getConversation(
      memberId,
      shapeIntoMongoObjectId(conversationId),
    );
  }

  @UseGuards(AuthGuard)
  @Mutation(() => PrivateConversation)
  public async deleteConversation(
    @AuthMember('_id')
    memberId: ObjectId,

    @Args('conversationId', {
      type: () => String,
    })
    conversationId: string,
  ): Promise<PrivateConversation> {
    console.log('Mutation: deleteConversation');

    return this.conversationService.deleteConversation(
      memberId,
      shapeIntoMongoObjectId(conversationId),
    );
  }
}
