import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, mongo } from 'mongoose';

import { shapeIntoMongoObjectId } from '../../libs/config';
import { Payment } from '../../libs/dto/booking/payment';
import { PaymentInput } from '../../libs/dto/booking/payment.input';
import { BookingStatus } from '../../libs/enums/booking.enum';
import { Message } from '../../libs/enums/common.enum';
import { NotificationReferenceType, NotificationType } from '../../libs/enums/notification.enum';
import { PaymentStatus } from '../../libs/enums/payment.enum';
import { AgentService } from '../agent/agent.service';
import { BookingService } from '../booking/booking.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly logger = new Logger(PaymentService.name);
  private readonly transitions: Record<PaymentStatus, readonly PaymentStatus[]> = {
    [PaymentStatus.PENDING]: [PaymentStatus.PAID, PaymentStatus.FAILED, PaymentStatus.CANCELLED],
    [PaymentStatus.PAID]: [PaymentStatus.REFUNDED],
    [PaymentStatus.FAILED]: [],
    [PaymentStatus.CANCELLED]: [],
    [PaymentStatus.REFUNDED]: [],
  };

  async onModuleInit(): Promise<void> {
    // Fail startup if the required uniqueness guard cannot be installed. Never
    // silently accept payments without it, or drop existing indexes/data.
    await this.paymentModel.createIndexes();
  }

  constructor(
    @InjectModel('Payment')
    private readonly paymentModel: Model<Payment>,

    private readonly bookingService: BookingService,

    private readonly agentService: AgentService,
    private readonly notificationService: NotificationService,
  ) {}

  public async createPayment(memberId: ObjectId, input: PaymentInput): Promise<Payment> {
    const bookingId = shapeIntoMongoObjectId(input.bookingId);
    try {
      return await this.paymentModel.db.transaction(
        async (session) => {
          const booking = await this.bookingService.findActiveBookingById(bookingId, session);
          if (booking.memberId.toString() !== memberId.toString()) {
            throw new UnauthorizedException(Message.NOT_AUTHORIZED);
          }
          if (booking.bookingStatus !== BookingStatus.PENDING) {
            throw new BadRequestException('Only pending bookings can be paid.');
          }
          if (
            !Number.isFinite(booking.finalPrice) ||
            booking.finalPrice < 0 ||
            !booking.currency?.trim()
          ) {
            throw new BadRequestException('Invalid booking amount or currency.');
          }
          // Write-lock the booking so concurrent cancellation/status changes conflict.
          await this.bookingService.updateBookingStatusForPayment(
            bookingId,
            BookingStatus.PENDING,
            [BookingStatus.PENDING],
            session,
          );
          const [payment] = await this.paymentModel.create(
            [
              {
                bookingId,
                memberId: booking.memberId,
                agentId: booking.agentId,
                paymentAmount: booking.finalPrice,
                currency: booking.currency,
                paymentMethod: input.paymentMethod,
                paymentStatus: PaymentStatus.PENDING,
                // transactionId stays absent until a real provider supplies it.
              },
            ],
            { session },
          );
          return payment;
        },
        {
          readConcern: { level: 'snapshot' },
          writeConcern: { w: 'majority' },
          readPreference: 'primary',
        },
      );
    } catch (error) {
      if (error instanceof mongo.MongoServerError && error.code === 11000) {
        throw new BadRequestException('An active payment already exists for this booking.');
      }
      throw error;
    }
  }

  public async getMyPayments(memberId: ObjectId): Promise<Payment[]> {
    return await this.paymentModel
      .find({
        memberId,
        paymentDeletedAt: null,
      })
      .sort({
        createdAt: -1,
      })
      .lean()
      .exec();
  }

  public async getMyPayment(memberId: ObjectId, paymentId: ObjectId): Promise<Payment> {
    const payment = await this.paymentModel
      .findOne({
        _id: paymentId,
        paymentDeletedAt: null,
      })
      .lean()
      .exec();

    if (!payment) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    if (payment.memberId.toString() !== memberId.toString()) {
      throw new UnauthorizedException(Message.NOT_AUTHORIZED);
    }

    return payment;
  }

  public async getPaymentsByAgent(memberId: ObjectId): Promise<Payment[]> {
    const agent = await this.agentService.findAgentByMemberId(memberId);

    return await this.paymentModel
      .find({
        agentId: agent._id,
        paymentDeletedAt: null,
      })
      .sort({
        createdAt: -1,
      })
      .lean()
      .exec();
  }

  public async getPaymentByAgent(memberId: ObjectId, paymentId: ObjectId): Promise<Payment> {
    const agent = await this.agentService.findAgentByMemberId(memberId);

    const payment = await this.paymentModel
      .findOne({
        _id: paymentId,
        paymentDeletedAt: null,
      })
      .lean()
      .exec();

    if (!payment) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    if (payment.agentId.toString() !== agent._id.toString()) {
      throw new UnauthorizedException(Message.NOT_AUTHORIZED);
    }

    return payment;
  }

  public async getAllPaymentsByAdmin(): Promise<Payment[]> {
    return await this.paymentModel
      .find({
        paymentDeletedAt: null,
      })
      .sort({
        createdAt: -1,
      })
      .lean()
      .exec();
  }

  public async getPaymentByAdmin(paymentId: ObjectId): Promise<Payment> {
    const payment = await this.paymentModel
      .findOne({
        _id: paymentId,
        paymentDeletedAt: null,
      })
      .lean()
      .exec();

    if (!payment) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return payment;
  }

  // ADMIN today; a future verified gateway adapter can reuse this transition policy.
  public async updatePaymentStatus(
    paymentId: ObjectId,
    paymentStatus: PaymentStatus,
  ): Promise<Payment> {
    const updatedPayment = await this.paymentModel.db.transaction(
      async (session) => {
        const payment = await this.paymentModel
          .findOne({ _id: paymentId, paymentDeletedAt: null })
          .session(session);
        if (!payment) throw new BadRequestException(Message.NO_DATA_FOUND);
        if (!this.transitions[payment.paymentStatus]?.includes(paymentStatus)) {
          throw new BadRequestException(
            `Invalid payment transition: ${payment.paymentStatus} -> ${paymentStatus}.`,
          );
        }
        const updateData: Record<string, unknown> = { paymentStatus };
        if (paymentStatus === PaymentStatus.PAID) updateData.paymentDate = new Date();
        if (paymentStatus === PaymentStatus.REFUNDED) updateData.refundedAt = new Date();
        const updated = await this.paymentModel.findOneAndUpdate(
          { _id: paymentId, paymentDeletedAt: null, paymentStatus: payment.paymentStatus },
          { $set: updateData },
          { new: true, session, runValidators: true },
        );
        if (!updated) throw new BadRequestException(Message.UPDATE_FAILED);
        if (paymentStatus === PaymentStatus.PAID) {
          await this.bookingService.updateBookingStatusForPayment(
            payment.bookingId,
            BookingStatus.CONFIRMED,
            [BookingStatus.PENDING],
            session,
          );
        } else if (paymentStatus === PaymentStatus.REFUNDED) {
          // Internal status only. Financial refund and seat/coupon reconciliation
          // are intentionally not implied by this transition.
          await this.bookingService.updateBookingStatusForPayment(
            payment.bookingId,
            BookingStatus.CANCELLED,
            [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.CANCELLED],
            session,
          );
        }
        // FAILED/CANCELLED do not reset or resurrect a booking's current status.
        return updated;
      },
      {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
        readPreference: 'primary',
      },
    );

    const notifications: Partial<
      Record<PaymentStatus, { type: NotificationType; title: string; message: string }>
    > = {
      [PaymentStatus.PAID]: {
        type: NotificationType.PAYMENT_SUCCESS,
        title: 'Payment status updated',
        message: 'Your payment was marked paid by an administrator.',
      },
      [PaymentStatus.FAILED]: {
        type: NotificationType.PAYMENT_FAILED,
        title: 'Payment failed',
        message: 'Your payment attempt was marked failed.',
      },
      [PaymentStatus.REFUNDED]: {
        type: NotificationType.PAYMENT_REFUNDED,
        title: 'Refund status updated',
        message:
          'Your payment was marked refunded internally. This status update does not transfer money.',
      },
    };
    const notification = notifications[paymentStatus];
    if (notification) {
      try {
        await this.notificationService.createNotification({
          receiverId: updatedPayment.memberId,
          senderId: null,
          notificationType: notification.type,
          notificationTitle: notification.title,
          notificationMessage: notification.message,
          referenceType: NotificationReferenceType.PAYMENT,
          referenceId: updatedPayment._id,
        });
      } catch (error) {
        this.logger.error(
          'Post-payment notification failed',
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
    return updatedPayment;
  }

  public async deletePaymentByAdmin(paymentId: ObjectId): Promise<Payment> {
    const payment = await this.paymentModel.findOne({
      _id: paymentId,
      paymentDeletedAt: null,
    });

    if (!payment) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const deletedPayment = await this.paymentModel.findOneAndUpdate(
      {
        _id: paymentId,
        paymentDeletedAt: null,
        paymentStatus: { $in: [PaymentStatus.FAILED, PaymentStatus.CANCELLED] },
      },
      {
        $set: {
          paymentDeletedAt: new Date(),
        },
      },
      {
        new: true,
      },
    );

    if (!deletedPayment) {
      throw new BadRequestException(Message.DELETE_FAILED);
    }

    return deletedPayment;
  }
}
