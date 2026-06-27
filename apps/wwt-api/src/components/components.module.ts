import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { TravelPackageModule } from './travel-package/travel-package.module';
import { BookingModule } from './booking/booking.module';
import { AuthModule } from './auth/auth.module';
import { AgentModule } from './agent/agent.module';
import { AdminModule } from './admin/admin.module';
import { TravelerModule } from './traveler/traveler.module';
import { PaymentModule } from './payment/payment.module';
import { ReviewModule } from './review/review.module';
import { CommentsModule } from './comments/comments.module';
import { LikesModule } from './likes/likes.module';
import { FollowModule } from './follow/follow.module';
import { ViewModule } from './view/view.module';
import { NotificationModule } from './notification/notification.module';
import { NoticeModule } from './notice/notice.module';
import { ReportModule } from './report/report.module';
import { DiscountModule } from './discount/discount.module';
import { CommunityModule } from './community/community.module';
import { BoardArticleModule } from './board-article/board-article.module';
import { OpenchatModule } from './openchat/openchat.module';
import { AiModule } from './ai/ai.module';
import { FaqModule } from './faq/faq.module';

@Module({
  imports: [
    MemberModule,
    TravelPackageModule,
    BookingModule,
    AuthModule,
    AgentModule,
    AdminModule,
    TravelerModule,
    PaymentModule,
    ReviewModule,
    CommentsModule,
    LikesModule,
    FollowModule,
    ViewModule,
    NotificationModule,
    NoticeModule,
    ReportModule,
    DiscountModule,
    CommunityModule,
    BoardArticleModule,
    OpenchatModule,
    AiModule,
    FaqModule,
  ],
})
export class ComponentsModule {}
