import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';

@InputType()
class NotificationSearch {
  @IsOptional()
  @Field(() => Boolean, { nullable: true })
  isRead?: boolean;

  @IsOptional()
  @Field(() => String, { nullable: true })
  receiverId?: string;
}

@InputType()
export class NotificationsInquiry {
  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  page: number;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  limit: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  sort?: string;

  @IsOptional()
  @Field(() => Direction, { nullable: true })
  direction?: Direction;

  @IsOptional()
  @Field(() => NotificationSearch, { nullable: true })
  search?: NotificationSearch;
}

@InputType()
export class ReadNotificationInput {
  @IsNotEmpty()
  @Field(() => String)
  notificationId: string;
}

@InputType()
export class ReadAllNotificationsInput {
  @IsOptional()
  @IsBoolean()
  @Field(() => Boolean, { defaultValue: true })
  readAll?: boolean;
}
