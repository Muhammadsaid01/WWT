import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ItinerarySchema from '../../schemas/travel/Itinerary.schema';
import TravelPackageSchema from '../../schemas/travel/Package.schema';
import PackageExcludeSchema from '../../schemas/travel/PackageExclude.schema';
import PackageIncludeSchema from '../../schemas/travel/PackageInclude.schema';
import PackagePolicySchema from '../../schemas/travel/PackagePolicy.schema';
import PackageScheduleSchema from '../../schemas/travel/PackageSchedule.schema';
import PackageTagSchema from '../../schemas/travel/PackageTag.schema';
import { AgentModule } from '../agent/agent.module';
import { AuthModule } from '../auth/auth.module';
import { LikesModule } from '../likes/likes.module';
import { MemberModule } from '../member/member.module';
import { NotificationModule } from '../notification/notification.module';
import { ViewModule } from '../view/view.module';
import { TravelPackageResolver } from './travel-package.resolver';
import { TravelPackageService } from './travel-package.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'TravelPackage', schema: TravelPackageSchema },
      { name: 'PackageSchedule', schema: PackageScheduleSchema },
      { name: 'Itinerary', schema: ItinerarySchema },
      { name: 'PackageInclude', schema: PackageIncludeSchema },
      { name: 'PackageExclude', schema: PackageExcludeSchema },
      { name: 'PackageTag', schema: PackageTagSchema },
      { name: 'PackagePolicy', schema: PackagePolicySchema },
    ]),
    AuthModule,
    ViewModule,
    MemberModule,
    AgentModule,
    LikesModule,
    NotificationModule,
  ],
  providers: [TravelPackageResolver, TravelPackageService],
  exports: [TravelPackageService],
})
export class TravelPackageModule {}
