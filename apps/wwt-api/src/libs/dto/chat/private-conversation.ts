import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class PrivateConversation {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  memberOneId: ObjectId;

  @Field(() => String)
  memberTwoId: ObjectId;

  @Field(() => String, { nullable: true })
  lastMessage?: string;

  @Field(() => Date, { nullable: true })
  lastMessageAt?: Date;

  @Field(() => Member, { nullable: true })
  memberOneData?: Member;

  @Field(() => Member, { nullable: true })
  memberTwoData?: Member;

  @Field(() => Int, { nullable: true })
  unreadCount?: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class PrivateConversations {
  @Field(() => [PrivateConversation])
  list: PrivateConversation[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
