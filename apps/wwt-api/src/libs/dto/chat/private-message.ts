import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { PrivateMessageStatus, PrivateMessageType } from '../../enums/chat.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class PrivateMessage {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  conversationId: ObjectId;

  @Field(() => String)
  senderId: ObjectId;

  @Field(() => String)
  receiverId: ObjectId;

  @Field(() => PrivateMessageType)
  messageType: PrivateMessageType;

  @Field(() => String, { nullable: true })
  messageContent?: string;

  @Field(() => [String])
  messageImages: string[];

  @Field(() => PrivateMessageStatus)
  messageStatus: PrivateMessageStatus;

  @Field(() => Date, { nullable: true })
  readAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class PrivateMessages {
  @Field(() => [PrivateMessage])
  list: PrivateMessage[];

  @Field(() => [TotalCounter], {
    nullable: true,
  })
  metaCounter?: TotalCounter[];
}
