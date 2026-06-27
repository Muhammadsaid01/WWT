import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WwtBatchController } from './wwt-batch.controller';
import { WwtBatchService } from './wwt-batch.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [WwtBatchController],
  providers: [WwtBatchService],
})
export class WwtBatchModule {}
