import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Message } from '../../libs/enums/common.enum';
import { NotificationReferenceType, NotificationType } from '../../libs/enums/notification.enum';

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
}
