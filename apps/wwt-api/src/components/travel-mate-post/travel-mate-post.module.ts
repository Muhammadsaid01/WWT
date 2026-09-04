import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import TravelMatePostSchema from '../../schemas/community/TravelMatePost.schema';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { ViewModule } from '../view/view.module';
import { TravelMatePostResolver } from './travel-mate-post.resolver';
import { TravelMatePostService } from './travel-mate-post.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'TravelMatePost', schema: TravelMatePostSchema }]),
    AuthModule,
    MemberModule,
    ViewModule,
  ],
  providers: [TravelMatePostResolver, TravelMatePostService],
  exports: [TravelMatePostService],
})
export class TravelMatePostModule {}
