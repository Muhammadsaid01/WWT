import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Traveler } from '../../libs/dto/booking/traveler';
import { TravelerInput } from '../../libs/dto/booking/traveler.input';
import { TravelerUpdate } from '../../libs/dto/booking/traveler.update';
import { BookingStatus } from '../../libs/enums/booking.enum';
import { Message } from '../../libs/enums/common.enum';
import { AgentService } from '../agent/agent.service';
import { BookingService } from '../booking/booking.service';

@Injectable()
export class TravelerService {
  constructor(
    @InjectModel('Traveler') private readonly travelerModel: Model<Traveler>,
    private readonly bookingService: BookingService,
    private readonly agentService: AgentService,
  ) {}

  public async createTraveler(memberId: ObjectId, input: TravelerInput): Promise<Traveler> {
    const bookingId = shapeIntoMongoObjectId(input.bookingId);

    const booking = await this.bookingService.findActiveBookingById(bookingId);

    if (booking.memberId.toString() !== memberId.toString()) {
      throw new UnauthorizedException(Message.NOT_AUTHORIZED);
    }

    if (booking.bookingStatus === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot add travelers to a cancelled booking.');
    }

    if (booking.bookingStatus === BookingStatus.COMPLETED) {
      throw new BadRequestException('Booking has already been completed.');
    }

    const travelerCount = await this.travelerModel.countDocuments({
      bookingId,
      travelerDeletedAt: null,
    });

    if (travelerCount >= booking.peopleCount) {
      throw new BadRequestException('Maximum number of travelers has been reached.');
    }

    const existingTraveler = await this.travelerModel.findOne({
      bookingId,
      passportNumber: input.passportNumber,
      travelerDeletedAt: null,
    });

    if (existingTraveler) {
      throw new BadRequestException('Traveler with this passport already exists in this booking.');
    }

    return await this.travelerModel.create({
      ...input,
      bookingId,
      dateOfBirth: new Date(input.dateOfBirth),
      passportExpireDate: new Date(input.passportExpireDate),
    });
  }

  public async updateTraveler(
    memberId: ObjectId,
    travelerId: ObjectId,
    input: TravelerUpdate,
  ): Promise<Traveler> {
    const traveler = await this.travelerModel.findOne({
      _id: travelerId,
      travelerDeletedAt: null,
    });

    if (!traveler) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const booking = await this.bookingService.findActiveBookingById(traveler.bookingId);

    if (booking.memberId.toString() !== memberId.toString()) {
      throw new UnauthorizedException(Message.NOT_AUTHORIZED);
    }

    if (
      booking.bookingStatus === BookingStatus.CANCELLED ||
      booking.bookingStatus === BookingStatus.COMPLETED ||
      booking.bookingStatus === BookingStatus.REJECTED
    ) {
      throw new BadRequestException(
        `Traveler cannot be updated for a ${booking.bookingStatus} booking.`,
      );
    }

    if (input.passportNumber) {
      const duplicatedTraveler = await this.travelerModel.findOne({
        _id: {
          $ne: travelerId,
        },
        bookingId: traveler.bookingId,
        passportNumber: input.passportNumber,
        travelerDeletedAt: null,
      });

      if (duplicatedTraveler) {
        throw new BadRequestException(
          'Traveler with this passport already exists in this booking.',
        );
      }
    }

    const updateData: Record<string, unknown> = {
      ...input,
    };

    if (input.dateOfBirth) {
      updateData.dateOfBirth = new Date(input.dateOfBirth);
    }

    if (input.passportExpireDate) {
      updateData.passportExpireDate = new Date(input.passportExpireDate);
    }

    const result = await this.travelerModel.findOneAndUpdate(
      {
        _id: travelerId,
        travelerDeletedAt: null,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!result) {
      throw new BadRequestException(Message.UPDATE_FAILED);
    }

    return result;
  }

  public async deleteTraveler(memberId: ObjectId, travelerId: ObjectId): Promise<Traveler> {
    const traveler = await this.travelerModel.findOne({
      _id: travelerId,
      travelerDeletedAt: null,
    });

    if (!traveler) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const booking = await this.bookingService.findActiveBookingById(traveler.bookingId);

    if (booking.memberId.toString() !== memberId.toString()) {
      throw new UnauthorizedException(Message.NOT_AUTHORIZED);
    }

    if (
      booking.bookingStatus === BookingStatus.COMPLETED ||
      booking.bookingStatus === BookingStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Traveler cannot be deleted from a ${booking.bookingStatus} booking.`,
      );
    }

    traveler.travelerDeletedAt = new Date();

    await traveler.save();

    return traveler;
  }

  public async getMyTravelersByBooking(
    memberId: ObjectId,
    bookingId: ObjectId,
  ): Promise<Traveler[]> {
    const booking = await this.bookingService.findActiveBookingById(bookingId);

    if (booking.memberId.toString() !== memberId.toString()) {
      throw new UnauthorizedException(Message.NOT_AUTHORIZED);
    }

    const travelers = await this.travelerModel
      .find({
        bookingId,
        travelerDeletedAt: null,
      })
      .sort({
        createdAt: 1,
      })
      .lean()
      .exec();

    return travelers;
  }

  public async getTraveler(memberId: ObjectId, travelerId: ObjectId): Promise<Traveler> {
    const traveler = await this.travelerModel
      .findOne({
        _id: travelerId,
        travelerDeletedAt: null,
      })
      .lean()
      .exec();

    if (!traveler) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const booking = await this.bookingService.findActiveBookingById(traveler.bookingId);

    if (booking.memberId.toString() !== memberId.toString()) {
      throw new UnauthorizedException(Message.NOT_AUTHORIZED);
    }

    return traveler;
  }

  public async getTravelersByBooking(memberId: ObjectId, bookingId: ObjectId): Promise<Traveler[]> {
    const agent = await this.agentService.findAgentByMemberId(memberId);

    const booking = await this.bookingService.findActiveBookingById(bookingId);

    if (booking.agentId.toString() !== agent._id.toString()) {
      throw new UnauthorizedException(Message.NOT_AUTHORIZED);
    }

    return this.travelerModel
      .find({
        bookingId,
        travelerDeletedAt: null,
      })
      .sort({
        createdAt: 1,
      })
      .lean()
      .exec();
  }

  public async getTravelersByAdmin(bookingId: ObjectId): Promise<Traveler[]> {
    await this.bookingService.findActiveBookingById(bookingId);

    const result = await this.travelerModel
      .find({
        bookingId,
        travelerDeletedAt: null,
      })
      .sort({
        createdAt: 1,
      })
      .lean()
      .exec();

    return result;
  }

  public async deleteTravelerByAdmin(travelerId: ObjectId): Promise<Traveler> {
    const traveler = await this.travelerModel.findOne({
      _id: travelerId,
      travelerDeletedAt: null,
    });

    if (!traveler) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    traveler.travelerDeletedAt = new Date();

    await traveler.save();

    return traveler;
  }

  public async getTravelerByAdmin(travelerId: ObjectId): Promise<Traveler> {
    const traveler = await this.travelerModel
      .findOne({
        _id: travelerId,
        travelerDeletedAt: null,
      })
      .lean()
      .exec();

    if (!traveler) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return traveler;
  }
}
