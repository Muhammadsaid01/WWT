import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import BoardArticleSchema from '../../schemas/community/BoardActivity.schema';
import { AuthModule } from '../auth/auth.module';
import { LikesModule } from '../likes/likes.module';
import { MemberModule } from '../member/member.module';
import { ViewModule } from '../view/view.module';
import { BoardArticleResolver } from './board-article.resolver';
import { BoardArticleService } from './board-article.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'BoardArticle', schema: BoardArticleSchema }]),
    AuthModule,
    MemberModule,
    ViewModule,
    LikesModule,
  ],
  providers: [BoardArticleService, BoardArticleResolver],
  exports: [BoardArticleService],
})
export class BoardArticleModule {}
