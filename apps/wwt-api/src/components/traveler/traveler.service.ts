import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Traveler } from '../../libs/dto/booking/traveler';
import { TravelerInput } from '../../libs/dto/booking/traveler.input';
import { BookingStatus } from '../../libs/enums/booking.enum';
import { Message } from '../../libs/enums/common.enum';
import { BookingService } from '../booking/booking.service';

@Injectable()
export class TravelerService {
  constructor(
    @InjectModel('Traveler') private readonly travelerModel: Model<Traveler>,
    private readonly bookingService: BookingService,
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
}
