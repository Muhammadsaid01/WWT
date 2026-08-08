import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';
import LikeSchema from '../../schemas/community/Like.schema';
import { LikesService } from './likes.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Like',
        schema: LikeSchema,
      },
    ]),
  ],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule {}
