import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';
import MemberSchema from '../../schemas/accounts/Member.schema';
import LikeSchema from '../../schemas/community/Like.schema';
import { LikesService } from './likes.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Like',
        schema: LikeSchema,
      },

      {
        name: 'Member',
        schema: MemberSchema,
      },
    ]),
  ],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule {}
