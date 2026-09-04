import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import NoticeSchema from '../../schemas/system/Notice.schema';
import { AuthModule } from '../auth/auth.module';
import { ViewModule } from '../view/view.module';
import { NoticeResolver } from './notice.resolver';
import { NoticeService } from './notice.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Notice',
        schema: NoticeSchema,
      },
    ]),
    AuthModule,
    ViewModule,
  ],

  providers: [NoticeResolver, NoticeService],
  exports: [NoticeService],
})
export class NoticeModule {}
