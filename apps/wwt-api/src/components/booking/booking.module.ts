import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BookingResolver } from './booking.resolver';
import { BookingService } from './booking.service';

import MemberSchema from '../../schemas//accounts/Member.schema';
import BookingSchema from '../../schemas//bookings/Booking.schema';
import TravelPackageSchema from '../../schemas/travel/Package.schema';
import PackageScheduleSchema from '../../schemas/travel/PackageSchedule.schema';
import { AgentModule } from '../agent/agent.module';
import { AuthModule } from '../auth/auth.module';
import { CouponModule } from '../coupon/coupon.module';
import { MemberModule } from '../member/member.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Booking', schema: BookingSchema },
      { name: 'Member', schema: MemberSchema },
      { name: 'TravelPackage', schema: TravelPackageSchema },
      { name: 'PackageSchedule', schema: PackageScheduleSchema },
    ]),
    AuthModule,
    AgentModule,
    CouponModule,
    NotificationModule,
    MemberModule,
  ],
  providers: [BookingResolver, BookingService],
  exports: [BookingService],
})
export class BookingModule {}
