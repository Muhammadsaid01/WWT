import { Types, type ObjectId } from 'mongoose';

jest.mock('uuid', () => ({ v4: () => 'notification-receiver-test-uuid' }));

import { AgentService } from '../agent/agent.service';
import { BookingService } from '../booking/booking.service';
import { ReviewService } from '../review/review.service';
import { BookingStatus } from '../../libs/enums/booking.enum';
import { Direction } from '../../libs/enums/common.enum';
import { NotificationService } from './notification.service';

const objectId = () => new Types.ObjectId() as unknown as ObjectId;

function queryResult<T>(value: T) {
  const result: any = {
    session: () => result,
    select: () => result,
    lean: () => result,
    exec: async () => value,
    then: (resolve: (value: T) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(value).then(resolve, reject),
  };

  return result;
}

function notificationFixture() {
  const records: any[] = [];
  const model = {
    create: jest.fn(async (input) => {
      const notification = {
        _id: objectId(),
        ...input,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      records.push(notification);
      return notification;
    }),
    aggregate: jest.fn(async (pipeline) => {
      const match = pipeline[0].$match;
      const list = records.filter(
        (record) =>
          record.receiverId.toString() === match.receiverId.toString() &&
          (match.isRead === undefined || record.isRead === match.isRead),
      );

      return [{ list, metaCounter: list.length ? [{ total: list.length }] : [] }];
    }),
  };

  return {
    records,
    service: new NotificationService(model as any),
  };
}

function bookingCreationFixture(notificationService: NotificationService) {
  const travelerMemberId = objectId();
  const agentId = objectId();
  const agentMemberId = objectId();
  const packageId = objectId();
  const scheduleId = objectId();
  const bookingId = objectId();
  const createdBooking: any = {
    _id: bookingId,
    memberId: travelerMemberId,
    agentId,
    packageId,
    scheduleId,
    bookingStatus: BookingStatus.PENDING,
  };
  const bookingModel: any = {
    db: { transaction: async (callback: (session: object) => unknown) => callback({}) },
    findOne: jest.fn(() => queryResult(null)),
    create: jest.fn(async () => [createdBooking]),
  };
  const memberModel: any = {
    findOne: jest.fn(() => queryResult({ _id: travelerMemberId })),
  };
  const packageModel: any = {
    findOne: jest.fn(() =>
      queryResult({
        _id: packageId,
        agentId,
        packagePrice: 100,
        currency: 'USD',
        minPeople: 1,
        maxPeople: 4,
      }),
    ),
  };
  const scheduleModel: any = {
    findOneAndUpdate: jest.fn(() => queryResult({ _id: scheduleId, availableSeats: 3 })),
  };
  const agentService = {
    findAgentMemberId: jest.fn(async () => agentMemberId),
  };
  const service = new BookingService(
    bookingModel,
    memberModel,
    packageModel,
    scheduleModel,
    agentService as any,
    { applyCoupon: jest.fn() } as any,
    notificationService,
    { addMemberPoint: jest.fn(async () => undefined) } as any,
    { create: jest.fn(async () => undefined) } as any,
  );

  return {
    service,
    travelerMemberId,
    agentId,
    agentMemberId,
    packageId,
    scheduleId,
  };
}

describe('Agent notification receiver identity', () => {
  it('resolves a notification receiver from the Agent document memberId without status filtering', async () => {
    const agentId = objectId();
    const agentMemberId = objectId();
    const agentModel = {
      findById: jest.fn(() => queryResult({ _id: agentId, memberId: agentMemberId })),
    };
    const service = new AgentService(agentModel as any, {} as any, {} as any, {} as any);

    await expect(service.findAgentMemberId(agentId)).resolves.toBe(agentMemberId);
    expect(agentModel.findById).toHaveBeenCalledWith(agentId);
  });

  it('stores booking creation notifications under Agent.memberId and makes them queryable there', async () => {
    const notifications = notificationFixture();
    const fixture = bookingCreationFixture(notifications.service);

    await fixture.service.createBooking(fixture.travelerMemberId, {
      packageId: fixture.packageId.toString(),
      scheduleId: fixture.scheduleId.toString(),
      adultCount: 1,
      childCount: 0,
      infantCount: 0,
      travelers: [
        {
          firstName: 'Test',
          lastName: 'Traveler',
          dateOfBirth: '1990-01-01',
          gender: 'OTHER' as any,
          nationality: 'Test',
          passportNumber: 'TEST-PASSPORT-1',
          passportExpireDate: '2030-01-01',
        },
      ],
      contactName: 'Test Traveler',
      contactPhone: '123',
      currency: 'USD',
    });

    expect(notifications.records).toHaveLength(1);
    expect(notifications.records[0].receiverId.toString()).toBe(fixture.agentMemberId.toString());
    expect(notifications.records[0].receiverId.toString()).not.toBe(fixture.agentId.toString());

    const result = await notifications.service.getMyNotifications(fixture.agentMemberId, {
      page: 1,
      limit: 10,
      sort: 'createdAt',
      direction: Direction.DESC,
    });
    expect(result.list).toHaveLength(1);
  });

  it('stores traveler cancellation notifications under Agent.memberId', async () => {
    const notifications = notificationFixture();
    const travelerMemberId = objectId();
    const agentId = objectId();
    const agentMemberId = objectId();
    const booking: any = {
      _id: objectId(),
      memberId: travelerMemberId,
      agentId,
      bookingStatus: BookingStatus.PENDING,
      cancelledAt: null,
      save: jest.fn(async function () {
        return this;
      }),
    };
    const agentService = {
      findAgentMemberId: jest.fn(async () => agentMemberId),
    };
    const service = new BookingService(
      { findOne: jest.fn(async () => booking) } as any,
      {} as any,
      {} as any,
      {} as any,
      agentService as any,
      {} as any,
      notifications.service,
      {} as any,
      {} as any,
    );

    await service.cancelBooking(travelerMemberId, booking._id);

    expect(notifications.records[0].receiverId.toString()).toBe(agentMemberId.toString());
    expect(notifications.records[0].receiverId.toString()).not.toBe(agentId.toString());
  });

  it('stores new review notifications under Agent.memberId', async () => {
    const notifications = notificationFixture();
    const travelerMemberId = objectId();
    const agentId = objectId();
    const agentMemberId = objectId();
    const packageId = objectId();
    const bookingId = objectId();
    const booking = {
      _id: bookingId,
      memberId: travelerMemberId,
      agentId,
      packageId,
      bookingStatus: BookingStatus.COMPLETED,
    };
    const reviewModel = {
      findOne: jest.fn(async () => null),
      create: jest.fn(async (input) => ({ _id: objectId(), ...input })),
      aggregate: jest.fn(async () => [{ averageRating: 5, reviewCount: 1 }]),
    };
    const agentService = {
      findAgentMemberId: jest.fn(async () => agentMemberId),
    };
    const service = new ReviewService(
      reviewModel as any,
      { findByIdAndUpdate: jest.fn(async () => ({})) } as any,
      { findActiveBookingById: jest.fn(async () => booking) } as any,
      agentService as any,
      {} as any,
      notifications.service,
      { addMemberPoint: jest.fn(async () => undefined) } as any,
    );

    await service.createReview(travelerMemberId, {
      bookingId: bookingId.toString(),
      reviewRating: 5,
      reviewContent: 'A focused receiver identity test review.',
    });

    expect(notifications.records[0].receiverId.toString()).toBe(agentMemberId.toString());
    expect(notifications.records[0].receiverId.toString()).not.toBe(agentId.toString());
  });

  it('keeps existing traveler notification receivers on the traveler Member._id', async () => {
    const notifications = notificationFixture();
    const travelerMemberId = objectId();
    const agentMemberId = objectId();
    const agentId = objectId();
    const booking: any = {
      _id: objectId(),
      memberId: travelerMemberId,
      agentId,
      bookingStatus: BookingStatus.PENDING,
      save: jest.fn(async function () {
        return this;
      }),
    };
    const agentService = {
      findAgentByMemberId: jest.fn(async () => ({ _id: agentId, memberId: agentMemberId })),
    };
    const service = new BookingService(
      { findOne: jest.fn(async () => booking) } as any,
      {} as any,
      {} as any,
      {} as any,
      agentService as any,
      {} as any,
      notifications.service,
      {} as any,
      {} as any,
    );

    await service.updateBookingStatus(agentMemberId, booking._id, BookingStatus.CONFIRMED);

    expect(notifications.records[0].receiverId.toString()).toBe(travelerMemberId.toString());
  });
});
