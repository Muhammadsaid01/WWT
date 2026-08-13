import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { PrivateMessageStatus, PrivateMessageType } from '../../enums/chat.enum';

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
