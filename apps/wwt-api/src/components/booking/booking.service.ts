import { TravelerCreationService } from '../traveler/traveler-creation.service';
/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { ClientSession, Model, ObjectId } from 'mongoose';

import {
  availableBookingSorts,
  lookupAgent,
  lookupBookingCustomer,
  lookupBookingPackage,
  lookupBookingSchedule,
  lookupMember,
  shapeIntoMongoObjectId,
  unwindAgent,
  unwindBookingCustomer,
  unwindBookingPackage,
  unwindBookingSchedule,
  unwindMember,
} from '../../libs/config';
import { Booking, Bookings } from '../../libs/dto/booking/booking';
import { BookingInput, BookingsInquiry } from '../../libs/dto/booking/booking.input';
import { Member } from '../../libs/dto/member/member';
import { PackageSchedule } from '../../libs/dto/travel-package/package-schedule';
import { TravelPackage } from '../../libs/dto/travel-package/travel-package';
import { BookingStatus } from '../../libs/enums/booking.enum';
import { Direction, MemberPointAction, Message } from '../../libs/enums/common.enum';
import { NotificationReferenceType, NotificationType } from '../../libs/enums/notification.enum';
import { PackageStatus, ScheduleStatus } from '../../libs/enums/package.enum';
import { AgentService } from '../agent/agent.service';
import { CouponService } from '../coupon/coupon.service';
import { MemberService } from '../member/member.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
  constructor(
    @InjectModel('Booking')
    private readonly bookingModel: Model<Booking>,

    @InjectModel('Member')
    private readonly memberModel: Model<Member>,

    @InjectModel('TravelPackage')
    private readonly travelPackageModel: Model<TravelPackage>,

    @InjectModel('PackageSchedule')
    private readonly packageScheduleModel: Model<PackageSchedule>,
    private agentService: AgentService,
    private readonly couponService: CouponService,
    private readonly notificationService: NotificationService,
    private readonly memberService: MemberService,
    private readonly travelerCreationService: TravelerCreationService,
  ) {}

  public async createBooking(memberId: ObjectId, input: BookingInput): Promise<Booking> {
    let createdBooking: Booking;
    try {
      createdBooking = await this.bookingModel.db.transaction(
        async (session) => {
          const {
            packageId,
            scheduleId,
            couponCode,
            adultCount = 1,
            childCount = 0,
            infantCount = 0,
            currency,
            travelers,
            ...bookingData
          } = input;
          const targetPackageId = shapeIntoMongoObjectId(packageId);
          const targetScheduleId = shapeIntoMongoObjectId(scheduleId);

          if (
            ![adultCount, childCount, infantCount].every(
              (count) => Number.isSafeInteger(count) && count >= 0,
            )
          ) {
            throw new BadRequestException('Traveler counts must be nonnegative integers.');
          }
          const peopleCount = adultCount + childCount + infantCount;
          if (!Number.isSafeInteger(peopleCount) || peopleCount < 1) {
            throw new BadRequestException('At least one traveler is required.');
          }
          if (!Array.isArray(travelers) || travelers.length !== peopleCount) {
            throw new BadRequestException('Traveler count must match peopleCount.');
          }
          const targetMember = await this.memberModel
            .findOne({ _id: memberId, memberDeletedAt: null })
            .session(session)
            .exec();
          if (!targetMember) throw new BadRequestException('Member not found.');

          const targetPackage = await this.travelPackageModel
            .findOne({ _id: targetPackageId, packageStatus: PackageStatus.ACTIVE })
            .session(session)
            .exec();
          if (!targetPackage)
            throw new BadRequestException('Travel package not found or inactive.');
          if (peopleCount < targetPackage.minPeople) {
            throw new BadRequestException('Traveler count is below the package minimum.');
          }
          if (peopleCount > targetPackage.maxPeople) {
            throw new BadRequestException('Traveler count exceeds the package maximum.');
          }

          const packagePrice = Number(targetPackage.packagePrice);
          const totalPrice = packagePrice * peopleCount;
          if (!Number.isFinite(packagePrice) || packagePrice < 0 || !Number.isFinite(totalPrice)) {
            throw new BadRequestException('Invalid package price.');
          }

          // This conditional write is the final concurrency guard, not a prior seat read.
          const reservedSchedule = await this.packageScheduleModel
            .findOneAndUpdate(
              {
                _id: targetScheduleId,
                packageId: targetPackageId,
                scheduleStatus: ScheduleStatus.OPEN,
                availableSeats: { $gte: peopleCount },
              },
              { $inc: { availableSeats: -peopleCount } },
              { new: true, session },
            )
            .exec();
          if (!reservedSchedule) {
            throw new BadRequestException(
              'Package schedule unavailable or not enough available seats.',
            );
          }

          let targetCouponId: ObjectId | null = null;
          let discountAmount = 0;
          let finalPrice = totalPrice;
          if (couponCode?.trim()) {
            const couponResult = await this.couponService.applyCoupon(
              memberId,
              couponCode,
              totalPrice,
              session,
            );
            targetCouponId = couponResult.couponId;
            discountAmount = couponResult.discountAmount;
            finalPrice = couponResult.finalPrice;
          }
          const bookingCode = await this.generateBookingCode(session);
          const [booking] = await this.bookingModel.create(
            [
              {
                ...bookingData,
                bookingCode,
                memberId,
                packageId: targetPackageId,
                scheduleId: targetScheduleId,
                agentId: targetPackage.agentId,
                bookingStatus: BookingStatus.PENDING,
                adultCount,
                childCount,
                infantCount,
                peopleCount,
                totalPrice,
                discountAmount,
                finalPrice,
                currency: targetPackage.currency ?? currency ?? 'USD',
                couponId: targetCouponId,
              },
            ],
            { session },
          );

          if (targetCouponId) {
            await this.couponService.createCouponUsage(
              {
                couponId: targetCouponId,
                memberId,
                bookingId: booking._id,
                discountAmount,
              },
              session,
            );
            // Updating the shared coupon document also serializes concurrent usage checks.
            // A write conflict retries the transaction, including per-user-limit validation.
            await this.couponService.increaseUsedCount(targetCouponId, session);
          }
          // Sequential writes use the same session; a later traveler failure aborts all writes.
          for (const traveler of travelers) {
            await this.travelerCreationService.create(
              memberId,
              booking,
              {
                ...traveler,
                bookingId: booking._id.toString(),
              },
              session,
            );
          }
          return booking;
        },
        {
          readConcern: { level: 'snapshot' },
          writeConcern: { w: 'majority' },
          readPreference: 'primary',
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        'Booking transaction failed',
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(Message.CREATE_FAILED);
    }

    // Never run external side effects in a retried transaction callback. A failure
    // here must not report a committed booking as failed and encourage duplicate retries.
    try {
      await this.notificationService.createNotification({
        receiverId: createdBooking.agentId,
        senderId: memberId,
        notificationType: NotificationType.BOOKING_CREATED,
        notificationTitle: 'New booking',
        notificationMessage: 'A new booking has been created.',
        referenceType: NotificationReferenceType.BOOKING,
        referenceId: createdBooking._id,
      });
    } catch (error) {
      this.logger.error(
        'Post-booking notification failed',
        error instanceof Error ? error.stack : undefined,
      );
    }
    try {
      await this.memberService.addMemberPoint(memberId, MemberPointAction.BOOKING);
    } catch (error) {
      this.logger.error(
        'Post-booking member points failed',
        error instanceof Error ? error.stack : undefined,
      );
    }
    return createdBooking;
  }

  public async cancelBooking(memberId: ObjectId, bookingId: ObjectId): Promise<Booking> {
    const targetBooking = await this.bookingModel.findOne({
      _id: bookingId,
      bookingDeletedAt: null,
    });

    if (!targetBooking) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    if (targetBooking.memberId.toString() !== memberId.toString()) {
      throw new UnauthorizedException(Message.NOT_AUTHORIZED);
    }

    if (targetBooking.bookingStatus === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled.');
    }

    if (targetBooking.bookingStatus === BookingStatus.COMPLETED) {
      throw new BadRequestException('Completed booking cannot be cancelled.');
    }

    targetBooking.bookingStatus = BookingStatus.CANCELLED;

    targetBooking.cancelledAt = new Date();

    const updatedBooking = await targetBooking.save();

    await this.notificationService.createNotification({
      receiverId: updatedBooking.agentId,
      senderId: memberId,

      notificationType: NotificationType.BOOKING_CANCELLED,

      notificationTitle: 'Booking cancelled',

      notificationMessage: 'A customer has cancelled a booking.',

      referenceType: NotificationReferenceType.BOOKING,

      referenceId: updatedBooking._id,
    });

    return updatedBooking;
  }

  public async getMyBookings(memberId: ObjectId, input: BookingsInquiry): Promise<Bookings> {
    const match = {
      memberId,
      bookingDeletedAt: null,
    };

    return await this.bookingPagination(match, input);
  }

  public async getMyBooking(memberId: ObjectId, bookingId: ObjectId): Promise<Booking> {
    const result = await this.bookingModel.aggregate([
      {
        $match: {
          _id: bookingId,
          memberId,
          bookingDeletedAt: null,
        },
      },

      lookupBookingPackage,
      unwindBookingPackage,

      lookupBookingSchedule,
      unwindBookingSchedule,

      lookupAgent,
      unwindAgent,

      lookupMember,
      unwindMember,
    ]);

    if (!result.length) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return result[0];
  }

  public async getBookingsByAgent(memberId: ObjectId, input: BookingsInquiry): Promise<Bookings> {
    const agent = await this.agentService.findAgentByMemberId(memberId);

    const match = {
      agentId: agent._id,
      bookingDeletedAt: null,
    };

    return await this.bookingPagination(match, input);
  }

  public async getBookingByAgent(memberId: ObjectId, bookingId: ObjectId): Promise<Booking> {
    const agent = await this.agentService.findAgentByMemberId(memberId);

    const result = await this.bookingModel.aggregate([
      {
        $match: {
          _id: bookingId,
          agentId: agent._id,
          bookingDeletedAt: null,
        },
      },

      lookupBookingPackage,
      unwindBookingPackage,

      lookupBookingSchedule,
      unwindBookingSchedule,

      lookupAgent,
      unwindAgent,

      /*
       * Booking qilgan customer ma'lumoti.
       *
       * Bu yerda oldingi lookupMember helper ishlamaydi,
       * chunki u agentData.memberId orqali lookup qiladi.
       */
      lookupBookingCustomer,
      unwindBookingCustomer,
    ]);

    if (!result.length) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return result[0];
  }

  public async updateBookingStatus(
    memberId: ObjectId,
    bookingId: ObjectId,
    bookingStatus: BookingStatus,
  ): Promise<Booking> {
    const agent = await this.agentService.findAgentByMemberId(memberId);

    const targetBooking = await this.bookingModel.findOne({
      _id: bookingId,
      agentId: agent._id,
      bookingDeletedAt: null,
    });

    if (!targetBooking) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    if (targetBooking.bookingStatus === bookingStatus) {
      throw new BadRequestException(`Booking status is already ${bookingStatus}.`);
    }

    const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.REJECTED],

      [BookingStatus.CONFIRMED]: [BookingStatus.COMPLETED],

      [BookingStatus.CANCELLED]: [],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.REJECTED]: [],
    };

    const currentStatus = targetBooking.bookingStatus;

    const availableStatuses = allowedTransitions[currentStatus];

    if (!availableStatuses || !availableStatuses.includes(bookingStatus)) {
      throw new BadRequestException(
        `Cannot change booking status from ${currentStatus} to ${bookingStatus}.`,
      );
    }

    targetBooking.bookingStatus = bookingStatus;

    const updatedBooking = await targetBooking.save();

    if (bookingStatus === BookingStatus.CONFIRMED) {
      await this.notificationService.createNotification({
        receiverId: updatedBooking.memberId,
        senderId: updatedBooking.agentId,

        notificationType: NotificationType.BOOKING_CONFIRMED,

        notificationTitle: 'Booking confirmed',

        notificationMessage: 'Your booking has been confirmed.',

        referenceType: NotificationReferenceType.BOOKING,

        referenceId: updatedBooking._id,
      });
    }

    if (bookingStatus === BookingStatus.REJECTED) {
      await this.notificationService.createNotification({
        receiverId: updatedBooking.memberId,
        senderId: updatedBooking.agentId,

        notificationType: NotificationType.BOOKING_CANCELLED,

        notificationTitle: 'Booking rejected',

        notificationMessage: 'Your booking has been rejected.',

        referenceType: NotificationReferenceType.BOOKING,

        referenceId: updatedBooking._id,
      });
    }

    return updatedBooking;
  }

  public async getAllBookingsByAdmin(input: BookingsInquiry): Promise<Bookings> {
    const match = {
      bookingDeletedAt: null,
    };

    return await this.bookingPagination(match, input);
  }

  public async getBookingByAdmin(bookingId: ObjectId): Promise<Booking> {
    const result = await this.bookingModel.aggregate([
      {
        $match: {
          _id: bookingId,
          bookingDeletedAt: null,
        },
      },

      lookupBookingPackage,
      unwindBookingPackage,

      lookupBookingSchedule,
      unwindBookingSchedule,

      lookupAgent,
      unwindAgent,

      lookupBookingCustomer,
      unwindBookingCustomer,
    ]);

    if (!result.length) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return result[0];
  }

  public async updateBookingByAdmin(
    bookingId: ObjectId,
    bookingStatus: BookingStatus,
  ): Promise<Booking> {
    const targetBooking = await this.bookingModel.findOne({
      _id: bookingId,
      bookingDeletedAt: null,
    });

    if (!targetBooking) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const currentStatus = targetBooking.bookingStatus;

    if (currentStatus === bookingStatus) {
      throw new BadRequestException(`Booking status is already ${bookingStatus}.`);
    }

    targetBooking.bookingStatus = bookingStatus;

    if (bookingStatus === BookingStatus.CANCELLED) {
      targetBooking.cancelledAt = new Date();
    }

    if (currentStatus === BookingStatus.CANCELLED && bookingStatus !== BookingStatus.CANCELLED) {
      targetBooking.cancelledAt = null;
    }

    const updatedBooking = await targetBooking.save();

    if (bookingStatus === BookingStatus.CONFIRMED) {
      await this.notificationService.createNotification({
        receiverId: updatedBooking.memberId,
        senderId: null,

        notificationType: NotificationType.BOOKING_CONFIRMED,

        notificationTitle: 'Booking confirmed',

        notificationMessage: 'Your booking has been confirmed by the administrator.',

        referenceType: NotificationReferenceType.BOOKING,

        referenceId: updatedBooking._id,
      });
    }

    if (bookingStatus === BookingStatus.CANCELLED) {
      await this.notificationService.createNotification({
        receiverId: updatedBooking.memberId,
        senderId: null,

        notificationType: NotificationType.BOOKING_CANCELLED,

        notificationTitle: 'Booking cancelled',

        notificationMessage: 'Your booking has been cancelled by the administrator.',

        referenceType: NotificationReferenceType.BOOKING,

        referenceId: updatedBooking._id,
      });
    }

    return updatedBooking;
  }

  public async deleteBookingByAdmin(bookingId: ObjectId): Promise<Booking> {
    const result = await this.bookingModel.findOneAndUpdate(
      {
        _id: bookingId,
        bookingDeletedAt: null,
      },
      {
        bookingDeletedAt: new Date(),
      },
      {
        new: true,
      },
    );

    if (!result) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return result;
  }

  //Private Functions

  private async generateBookingCode(session?: ClientSession): Promise<string> {
    let bookingCode: string;
    let existingBooking: Booking | null;

    do {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

      const randomCode = randomBytes(3).toString('hex').toUpperCase();

      bookingCode = `WWT-${date}-${randomCode}`;

      existingBooking = await this.bookingModel
        .findOne({ bookingCode })
        .session(session ?? null)
        .select('_id')
        .lean()
        .exec();
    } while (existingBooking);

    return bookingCode;
  }

  private async bookingPagination(match: any, input: BookingsInquiry): Promise<Bookings> {
    const { page, limit, sort = 'createdAt', direction = Direction.DESC, search } = input;

    if (search?.bookingStatus) {
      match.bookingStatus = search.bookingStatus;
    }

    if (search?.packageId) {
      match.packageId = shapeIntoMongoObjectId(search.packageId);
    }

    if (search?.memberId) {
      match.memberId = shapeIntoMongoObjectId(search.memberId);
    }

    if (search?.agentId) {
      match.agentId = shapeIntoMongoObjectId(search.agentId);
    }

    if (search?.text) {
      const escapedText = search.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      match.$or = [
        {
          bookingCode: {
            $regex: escapedText,
            $options: 'i',
          },
        },
        {
          contactName: {
            $regex: escapedText,
            $options: 'i',
          },
        },
        {
          contactPhone: {
            $regex: escapedText,
            $options: 'i',
          },
        },
        {
          contactEmail: {
            $regex: escapedText,
            $options: 'i',
          },
        },
      ];
    }

    const sortField = availableBookingSorts.includes(sort) ? sort : 'createdAt';

    const sortDirection = direction === Direction.ASC ? 1 : -1;

    const result = await this.bookingModel.aggregate([
      {
        $match: match,
      },

      lookupBookingPackage,
      unwindBookingPackage,

      lookupBookingSchedule,
      unwindBookingSchedule,

      lookupAgent,
      unwindAgent,

      lookupMember,
      unwindMember,

      {
        $facet: {
          list: [
            {
              $sort: {
                [sortField]: sortDirection,
              },
            },
            {
              $skip: (page - 1) * limit,
            },
            {
              $limit: limit,
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

    if (!result.length) {
      return {
        list: [],
        metaCounter: [{ total: 0 }],
      };
    }

    return {
      list: result[0].list,
      metaCounter: result[0].metaCounter.length > 0 ? result[0].metaCounter : [{ total: 0 }],
    };
  }

  public async findActiveBookingById(
    bookingId: ObjectId,
    session?: ClientSession,
  ): Promise<Booking> {
    const booking = await this.bookingModel
      .findOne({
        _id: bookingId,
        bookingDeletedAt: null,
      })
      .session(session ?? null);

    if (!booking) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return booking;
  }

  public async updateBookingStatusForPayment(
    bookingId: ObjectId,
    bookingStatus: BookingStatus,
    expectedStatuses: BookingStatus[],
    session: ClientSession,
  ): Promise<Booking> {
    const booking = await this.bookingModel.findOneAndUpdate(
      { _id: bookingId, bookingDeletedAt: null, bookingStatus: { $in: expectedStatuses } },
      { $set: { bookingStatus }, $inc: { __v: 1 } },
      { new: true, session, runValidators: true },
    );
    if (!booking)
      throw new BadRequestException('Booking is unavailable for this payment transition.');
    return booking;
  }
}
