import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { validate } from 'class-validator';
import { ClientSession, Model, ObjectId } from 'mongoose';
import { Booking } from '../../libs/dto/booking/booking';
import { Traveler } from '../../libs/dto/booking/traveler';
import { TravelerInput } from '../../libs/dto/booking/traveler.input';
import { BookingStatus } from '../../libs/enums/booking.enum';
import { Message } from '../../libs/enums/common.enum';

// Shared by standalone creation and the booking transaction without a module cycle.
@Injectable()
export class TravelerCreationService {
  constructor(@InjectModel('Traveler') private readonly travelerModel: Model<Traveler>) {}

  public async create(
    memberId: ObjectId,
    booking: Booking,
    input: TravelerInput,
    session?: ClientSession,
  ): Promise<Traveler> {
    const errors = await validate(Object.assign(new TravelerInput(), input));
    if (errors.length) throw new BadRequestException('Invalid traveler information.');
    const bookingId = booking._id;
    if (booking.memberId.toString() !== memberId.toString()) {
      throw new UnauthorizedException(Message.NOT_AUTHORIZED);
    }

    if (booking.bookingStatus === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot add travelers to a cancelled booking.');
    }

    if (booking.bookingStatus === BookingStatus.COMPLETED) {
      throw new BadRequestException('Booking has already been completed.');
    }

    const travelerCount = await this.travelerModel
      .countDocuments({
        bookingId,
        travelerDeletedAt: null,
      })
      .session(session ?? null);

    if (travelerCount >= booking.peopleCount) {
      throw new BadRequestException('Maximum number of travelers has been reached.');
    }

    const existingTraveler = await this.travelerModel
      .findOne({
        bookingId,
        passportNumber: input.passportNumber.trim(),
        travelerDeletedAt: null,
      })
      .session(session ?? null);

    if (existingTraveler) {
      throw new BadRequestException('Traveler with this passport already exists in this booking.');
    }

    const [traveler] = await this.travelerModel.create(
      [
        {
          ...input,
          bookingId,
          dateOfBirth: new Date(input.dateOfBirth),
          passportExpireDate: new Date(input.passportExpireDate),
        },
      ],
      { session },
    );
    return traveler;
  }
}
