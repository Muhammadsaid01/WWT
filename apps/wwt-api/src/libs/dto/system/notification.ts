import { Field, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { NotificationReferenceType, NotificationType } from '../../enums/notification.enum';

@ObjectType()
export class Notification {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  receiverId: ObjectId;

  @Field(() => String, { nullable: true })
  senderId?: ObjectId;

  @Field(() => NotificationType)
  notificationType: NotificationType;

  @Field(() => String)
  notificationTitle: string;

  @Field(() => String)
  notificationMessage: string;

  @Field(() => NotificationReferenceType, { nullable: true })
  referenceType?: NotificationReferenceType;

  @Field(() => String, { nullable: true })
  referenceId?: ObjectId;

  @Field(() => Boolean)
  isRead: boolean;

  @Field(() => Date, { nullable: true })
  readAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
