import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Notification, Notifications } from '../../libs/dto/system/notification';
import { NotificationsInquiry } from '../../libs/dto/system/notification.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { NotificationReferenceType, NotificationType } from '../../libs/enums/notification.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel('Notification')
    private readonly notificationModel: Model<Notification>,
  ) {}

  public async createNotification(input: {
    receiverId: ObjectId;
    senderId?: ObjectId | null;

    notificationType: NotificationType;

    notificationTitle: string;
    notificationMessage: string;

    referenceType?: NotificationReferenceType | null;
    referenceId?: ObjectId | null;
  }): Promise<Notification> {
    try {
      const result = await this.notificationModel.create({
        receiverId: input.receiverId,
        senderId: input.senderId ?? null,

        notificationType: input.notificationType,

        notificationTitle: input.notificationTitle,
        notificationMessage: input.notificationMessage,

        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
      });

      return result;
    } catch (error) {
      console.log('Error, NotificationService createNotification:', error);

      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async getMyNotifications(
    memberId: ObjectId,
    input: NotificationsInquiry,
  ): Promise<Notifications> {
    const search = input.search ?? {};

    const match: T = {
      receiverId: memberId,
    };

    if (search.isRead !== undefined) {
      match.isRead = search.isRead;
    }

    const sort: T = {
      [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
    };

    const result = await this.notificationModel.aggregate([
      {
        $match: match,
      },
      {
        $sort: sort,
      },
      {
        $facet: {
          list: [
            {
              $skip: (input.page - 1) * input.limit,
            },
            {
              $limit: input.limit,
            },
          ],

          metaCounter: [
            {
              $count: 'total',
            },
          ],
        },
      },
    ]);

    return {
      list: result[0]?.list ?? [],
      metaCounter: result[0]?.metaCounter ?? [],
    };
  }

  public async getNotification(
    memberId: ObjectId,
    notificationId: ObjectId,
  ): Promise<Notification> {
    const result = await this.notificationModel.findOne({
      _id: notificationId,
      receiverId: memberId,
    });

    if (!result) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return result;
  }

  public async readNotification(
    memberId: ObjectId,
    notificationId: ObjectId,
  ): Promise<Notification> {
    const targetNotification = await this.notificationModel.findOne({
      _id: notificationId,
      receiverId: memberId,
    });

    if (!targetNotification) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    if (targetNotification.isRead) {
      return targetNotification;
    }

    targetNotification.isRead = true;
    targetNotification.readAt = new Date();

    return await targetNotification.save();
  }

  public async readAllNotifications(memberId: ObjectId): Promise<boolean> {
    await this.notificationModel.updateMany(
      {
        receiverId: memberId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );

    return true;
  }

  public async deleteNotification(
    memberId: ObjectId,
    notificationId: ObjectId,
  ): Promise<Notification> {
    const result = await this.notificationModel.findOneAndDelete({
      _id: notificationId,
      receiverId: memberId,
    });

    if (!result) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return result;
  }
}
