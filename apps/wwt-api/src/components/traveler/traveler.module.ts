import { TravelerCreationService } from './traveler-creation.service';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import TravelerSchema from '../../schemas/bookings/Traveler.schema';
import { AgentModule } from '../agent/agent.module';
import { AuthModule } from '../auth/auth.module';
import { BookingModule } from '../booking/booking.module';
import { TravelerResolver } from './traveler.resolver';
import { TravelerService } from './traveler.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Traveler', schema: TravelerSchema }]),
    AuthModule,
    AgentModule,
    BookingModule,
  ],
  providers: [TravelerResolver, TravelerService, TravelerCreationService],
  exports: [TravelerService],
})
export class TravelerModule {}
