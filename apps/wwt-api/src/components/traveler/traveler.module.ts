import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import TravelerSchema from '../../schemas/bookings/Traveler.schema';
import { BookingModule } from '../booking/booking.module';
import { TravelerResolver } from './traveler.resolver';
import { TravelerService } from './traveler.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Traveler', schema: TravelerSchema }]),
    BookingModule,
  ],
  providers: [TravelerResolver, TravelerService],
  exports: [TravelerService],
})
export class TravelerModule {}
