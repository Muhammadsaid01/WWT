import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';

import { shapeIntoMongoObjectId } from '../../libs/config';
import { Payment } from '../../libs/dto/booking/payment';
import { PaymentInput } from '../../libs/dto/booking/payment.input';
import { BookingStatus } from '../../libs/enums/booking.enum';
import { Message } from '../../libs/enums/common.enum';
import { PaymentStatus } from '../../libs/enums/payment.enum';
import { AgentService } from '../agent/agent.service';
import { BookingService } from '../booking/booking.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel('Payment')
    private readonly paymentModel: Model<Payment>,

    private readonly bookingService: BookingService,

    private readonly agentService: AgentService,
  ) {}

  public async createPayment(memberId: ObjectId, input: PaymentInput): Promise<Payment> {
    const bookingId = shapeIntoMongoObjectId(input.bookingId);

    const booking = await this.bookingService.findActiveBookingById(bookingId);

    if (booking.memberId.toString() !== memberId.toString()) {
      throw new UnauthorizedException(Message.NOT_AUTHORIZED);
    }

    if (
      booking.bookingStatus === BookingStatus.CANCELLED ||
      booking.bookingStatus === BookingStatus.REJECTED
    ) {
      throw new BadRequestException('This booking cannot be paid.');
    }

    const existingPayment = await this.paymentModel.findOne({
      bookingId,
      paymentDeletedAt: null,
    });

    if (existingPayment) {
      throw new BadRequestException('Payment already exists for this booking.');
    }

    return await this.paymentModel.create({
      bookingId,

      memberId: booking.memberId,
      agentId: booking.agentId,

      paymentAmount: booking.finalPrice,
      currency: booking.currency,

      paymentMethod: input.paymentMethod,

      paymentStatus: PaymentStatus.PENDING,

      transactionId: null,
    });
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

  public async updatePaymentStatus(
    paymentId: ObjectId,
    paymentStatus: PaymentStatus,
  ): Promise<Payment> {
    const payment = await this.paymentModel.findOne({
      _id: paymentId,
      paymentDeletedAt: null,
    });

    if (!payment) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    if (payment.paymentStatus === paymentStatus) {
      throw new BadRequestException(`Payment status is already ${paymentStatus}.`);
    }

    const updateData: Record<string, any> = {
      paymentStatus,
    };

    switch (paymentStatus) {
      case PaymentStatus.PAID:
        updateData.paidAt = new Date();
        updateData.refundedAt = null;

        await this.bookingService.updateBookingStatusForPayment(
          payment.bookingId,
          BookingStatus.CONFIRMED,
        );
        break;

      case PaymentStatus.REFUNDED:
        if (payment.paymentStatus !== PaymentStatus.PAID) {
          throw new BadRequestException('Only paid payments can be refunded.');
        }

        updateData.refundedAt = new Date();

        await this.bookingService.updateBookingStatusForPayment(
          payment.bookingId,
          BookingStatus.CANCELLED,
        );
        break;

      case PaymentStatus.FAILED:
        updateData.paidAt = null;
        updateData.refundedAt = null;

        await this.bookingService.updateBookingStatusForPayment(
          payment.bookingId,
          BookingStatus.PENDING,
        );
        break;

      case PaymentStatus.PENDING:
        updateData.paidAt = null;
        updateData.refundedAt = null;

        await this.bookingService.updateBookingStatusForPayment(
          payment.bookingId,
          BookingStatus.PENDING,
        );
        break;
    }

    const updatedPayment = await this.paymentModel.findOneAndUpdate(
      {
        _id: paymentId,
        paymentDeletedAt: null,
      },
      {
        $set: updateData,
      },
      {
        new: true,
      },
    );

    if (!updatedPayment) {
      throw new BadRequestException(Message.UPDATE_FAILED);
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
