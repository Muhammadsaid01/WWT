import { Schema } from 'mongoose';
import { NotificationReferenceType, NotificationType } from '../libs/enums/notification.enum';

const NotificationSchema = new Schema(
  {
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },

    notificationType: {
      type: String,
      enum: NotificationType,
      required: true,
    },

    notificationTitle: {
      type: String,
      required: true,
      trim: true,
    },

    notificationMessage: {
      type: String,
      required: true,
      trim: true,
    },

    referenceType: {
      type: String,
      enum: NotificationReferenceType,
      default: null,
    },

    referenceId: {
      type: Schema.Types.ObjectId,
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },

    notificationDeletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
  },
);

NotificationSchema.index({ receiverId: 1, isRead: 1 });
NotificationSchema.index({ receiverId: 1, createdAt: -1 });
NotificationSchema.index({ referenceType: 1, referenceId: 1 });

export default NotificationSchema;
