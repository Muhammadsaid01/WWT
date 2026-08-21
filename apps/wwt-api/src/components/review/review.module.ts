import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ReviewSchema from '../../schemas/community/Review.schema';
import TravelPackageSchema from '../../schemas/travel/Package.schema';
import { AuthModule } from '../auth/auth.module';
import { BookingModule } from '../booking/booking.module';
import { LikesModule } from '../likes/likes.module';
import { MemberModule } from '../member/member.module';
import { NotificationModule } from '../notification/notification.module';
import { ReviewResolver } from './review.resolver';
import { ReviewService } from './review.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Review',
        schema: ReviewSchema,
      },
      {
        name: 'TravelPackage',
        schema: TravelPackageSchema,
      },
    ]),

    BookingModule,
    AuthModule,
    LikesModule,
    NotificationModule,
    MemberModule,
  ],
  providers: [ReviewResolver, ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
