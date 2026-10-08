import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class OpenChatMessage {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  senderId: ObjectId;

  @Field(() => String)
  messageContent: string;

  @Field(() => Member, { nullable: true })
  memberData?: Member;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class OpenChatMessages {
  @Field(() => [OpenChatMessage])
  list: OpenChatMessage[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
