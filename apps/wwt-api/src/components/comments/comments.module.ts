import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import BoardArticleSchema from '../../schemas/community/BoardActivity.schema';
import CommentSchema from '../../schemas/community/Comment.schema';
import { AuthModule } from '../auth/auth.module';
import { BoardArticleModule } from '../board-article/board-article.module';
import { LikesModule } from '../likes/likes.module';
import { MemberModule } from '../member/member.module';
import { CommentsResolver } from './comments.resolver';
import { CommentsService } from './comments.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Comment',
        schema: CommentSchema,
      },
      {
        name: 'BoardArticle',
        schema: BoardArticleSchema,
      },
    ]),

    MemberModule,
    AuthModule,
    BoardArticleModule,
    LikesModule,
  ],

  providers: [CommentsResolver, CommentsService],

  exports: [CommentsService],
})
export class CommentsModule {}
