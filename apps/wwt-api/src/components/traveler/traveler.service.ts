import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Traveler } from '../../libs/dto/booking/traveler';
import { TravelerInput } from '../../libs/dto/booking/traveler.input';
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

    const result = await this.travelerModel.create({
      ...input,
      bookingId,
    });

    return result;
  }
}
