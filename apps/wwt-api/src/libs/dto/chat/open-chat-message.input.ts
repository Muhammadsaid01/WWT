import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Max, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';

@InputType()
export class OpenChatMessagesInquiry {
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
}
