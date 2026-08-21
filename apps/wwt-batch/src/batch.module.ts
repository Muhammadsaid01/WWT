import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import AgentSchema from '../../wwt-api/src/schemas/accounts/Agent.schema';
import TravelPackageSchema from '../../wwt-api/src/schemas/travel/Package.schema';
import { BatchController } from './batch.controller';
import { BatchService } from './batch.service';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    DatabaseModule,

    ScheduleModule.forRoot(),

    MongooseModule.forFeature([
      {
        name: 'Agent',
        schema: AgentSchema,
      },
      {
        name: 'TravelPackage',
        schema: TravelPackageSchema,
      },
    ]),
  ],

  controllers: [BatchController],

  providers: [BatchService],
})
export class BatchModule {}
