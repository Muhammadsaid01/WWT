import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';

import { AIMessageRole } from '../../enums/ai.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class AIMessage {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  conversationId: ObjectId;

  @Field(() => String)
  memberId: ObjectId;

  @Field(() => AIMessageRole)
  messageRole: AIMessageRole;

  @Field(() => String)
  messageContent: string;

  @Field(() => String, { nullable: true })
  aiModel?: string;

  @Field(() => Number, { nullable: true })
  inputTokens?: number;

  @Field(() => Number, { nullable: true })
  outputTokens?: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class AIMessages {
  @Field(() => [AIMessage])
  list: AIMessage[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
