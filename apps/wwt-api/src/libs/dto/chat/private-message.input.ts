import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { PrivateMessageStatus, PrivateMessageType } from '../../enums/chat.enum';
import { Direction } from '../../enums/common.enum';

@InputType()
export class PrivateMessageInput {
  @IsNotEmpty()
  @Field(() => String)
  conversationId: string;

  @IsOptional()
  @IsEnum(PrivateMessageType)
  @Field(() => PrivateMessageType, { nullable: true })
  messageType?: PrivateMessageType;

  @IsOptional()
  @IsString()
  @Length(1, 5000)
  @Field(() => String, { nullable: true })
  messageContent?: string;

  @IsOptional()
  @Field(() => [String], { nullable: true })
  messageImages?: string[];
}

@InputType()
class PMSearch {
  @IsOptional()
  @Field(() => String, { nullable: true })
  senderId?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  receiverId?: string;

  @IsOptional()
  @IsEnum(PrivateMessageStatus)
  @Field(() => PrivateMessageStatus, { nullable: true })
  messageStatus?: PrivateMessageStatus;
}
@InputType()
export class PrivateMessagesInquiry {
  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  page: number;

  @IsNotEmpty()
  @Min(1)
  @Max(100)
  @Field(() => Int)
  limit: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  sort?: string;

  @IsOptional()
  @Field(() => Direction, { nullable: true })
  direction?: Direction;

  @IsOptional()
  @Field(() => PMSearch, { nullable: true })
  search?: PMSearch;
}

@InputType()
export class UpdatePrivateMessageStatusInput {
  @IsNotEmpty()
  @Field(() => String)
  messageId: string;

  @IsNotEmpty()
  @IsEnum(PrivateMessageStatus)
  @Field(() => PrivateMessageStatus)
  messageStatus: PrivateMessageStatus;
}
