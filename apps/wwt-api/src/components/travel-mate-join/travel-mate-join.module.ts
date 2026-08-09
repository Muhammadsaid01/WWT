import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import TravelMateJoinSchema from '../../schemas/community/TravelMateJoin.schema';
import TravelMatePostSchema from '../../schemas/community/TravelMatePost.schema';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { NotificationModule } from '../notification/notification.module';
import { TravelMateJoinResolver } from './travel-mate-join.resolver';
import { TravelMateJoinService } from './travel-mate-join.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'TravelMateJoin', schema: TravelMateJoinSchema },
      { name: 'TravelMatePost', schema: TravelMatePostSchema },
    ]),
    MemberModule,
    AuthModule,
    NotificationModule,
  ],

  providers: [TravelMateJoinResolver, TravelMateJoinService],
  exports: [TravelMateJoinService],
})
export class TravelMateJoinModule {}
