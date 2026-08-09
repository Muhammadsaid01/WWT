import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Notification, Notifications } from '../../libs/dto/system/notification';
// eslint-disable-next-line prettier/prettier
import {
  NotificationsInquiry,
  ReadNotificationInput,
} from '../../libs/dto/system/notification.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { NotificationService } from './notification.service';

@Resolver()
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(AuthGuard)
  @Query(() => Notifications)
  public async getMyNotifications(
    @Args('input') input: NotificationsInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Notifications> {
    console.log('Query: getMyNotifications');

    return this.notificationService.getMyNotifications(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Query(() => Notification)
  public async getNotification(
    @Args('notificationId', { type: () => String })
    notificationId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Notification> {
    console.log('Query: getNotification');

    return this.notificationService.getNotification(
      memberId,
      shapeIntoMongoObjectId(notificationId),
    );
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Notification)
  public async readNotification(
    @Args('input') input: ReadNotificationInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Notification> {
    console.log('Mutation: readNotification');

    return this.notificationService.readNotification(
      memberId,
      shapeIntoMongoObjectId(input.notificationId),
    );
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Boolean)
  public async readAllNotifications(@AuthMember('_id') memberId: ObjectId): Promise<boolean> {
    console.log('Mutation: readAllNotifications');

    return this.notificationService.readAllNotifications(memberId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Notification)
  public async deleteNotification(
    @Args('notificationId', { type: () => String })
    notificationId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Notification> {
    console.log('Mutation: deleteNotification');

    return this.notificationService.deleteNotification(
      memberId,
      shapeIntoMongoObjectId(notificationId),
    );
  }
}
