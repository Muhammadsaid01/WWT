import { Module } from '@nestjs/common';
import { AgentModule } from './agent/agent.module';
import { AuthModule } from './auth/auth.module';
import { BookingModule } from './booking/booking.module';
import { MemberModule } from './member/member.module';
import { TravelPackageModule } from './travel-package/travel-package.module';

import { AgentRequestModule } from './agent-request/agent-request.module';
import { AiModule } from './ai/ai.module';
import { BoardArticleModule } from './board-article/board-article.module';
import { CommentsModule } from './comments/comments.module';
import { CommunityModule } from './community/community.module';
import { DiscountModule } from './discount/discount.module';
import { FaqModule } from './faq/faq.module';
import { FollowModule } from './follow/follow.module';
import { LikesModule } from './likes/likes.module';
import { NoticeModule } from './notice/notice.module';
import { NotificationModule } from './notification/notification.module';
import { OpenchatModule } from './openchat/openchat.module';
import { PaymentModule } from './payment/payment.module';
import { ReportModule } from './report/report.module';
import { ReviewModule } from './review/review.module';
import { TravelerModule } from './traveler/traveler.module';
import { ViewModule } from './view/view.module';

@Module({
  imports: [
    MemberModule,
    TravelPackageModule,
    BookingModule,
    AuthModule,
    AgentModule,
    AgentRequestModule,
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
    AgentRequestModule,
  ],
})
export class ComponentsModule {}
