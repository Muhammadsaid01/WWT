import { Module } from '@nestjs/common';
import { WwtBatchController } from './wwt-batch.controller';
import { WwtBatchService } from './wwt-batch.service';

@Module({
  imports: [],
  controllers: [WwtBatchController],
  providers: [WwtBatchService],
})
export class WwtBatchModule {}
