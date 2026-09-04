import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import AgentSchema from '../../schemas/accounts/Agent.schema';
import FollowSchema from '../../schemas/accounts/Follow.schema';
import MemberSchema from '../../schemas/accounts/Member.schema';
import { AuthModule } from '../auth/auth.module';
import { LikesModule } from '../likes/likes.module';
import { NotificationModule } from '../notification/notification.module';
import { ViewModule } from '../view/view.module';
import { MemberResolver } from './member.resolver';
import { MemberService } from './member.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Member', schema: MemberSchema },
      { name: 'Agent', schema: AgentSchema },
    ]),
    MongooseModule.forFeature([{ name: 'Follow', schema: FollowSchema }]),
    AuthModule,
    ViewModule,
    LikesModule,
    NotificationModule,
  ],
  providers: [MemberResolver, MemberService],
  exports: [MemberService],
})
export class MemberModule {}
