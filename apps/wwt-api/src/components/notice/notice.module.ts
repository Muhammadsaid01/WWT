import { Module } from '@nestjs/common';
import { NoticeResolver } from './notice.resolver';
import { NoticeService } from './notice.service';

@Module({
  providers: [NoticeResolver, NoticeService],
})
export class NoticeModule {}
