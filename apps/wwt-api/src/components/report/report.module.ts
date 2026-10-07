import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import MemberSchema from '../../schemas/accounts/Member.schema';
import BoardArticleSchema from '../../schemas/community/BoardActivity.schema';
import CommentSchema from '../../schemas/community/Comment.schema';
import ReviewSchema from '../../schemas/community/Review.schema';
import TravelMatePostSchema from '../../schemas/community/TravelMatePost.schema';
import ReportSchema from '../../schemas/system/Report.schema';
import { AuthModule } from '../auth/auth.module';
import { ReportResolver } from './report.resolver';
import { ReportService } from './report.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Report',
        schema: ReportSchema,
      },
      { name: 'Member', schema: MemberSchema },
      { name: 'BoardArticle', schema: BoardArticleSchema },
      { name: 'Comment', schema: CommentSchema },
      { name: 'Review', schema: ReviewSchema },
      { name: 'TravelMatePost', schema: TravelMatePostSchema },
    ]),

    AuthModule,
  ],

  providers: [ReportResolver, ReportService],

  exports: [ReportService],
})
export class ReportModule {}
