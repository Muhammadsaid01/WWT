import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import AgentSchema from '../../schemas/accounts/Agent.schema';
import { AuthModule } from '../auth/auth.module';
import { AgentResolver } from './agent.resolver';
import { AgentService } from './agent.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Agent',
        schema: AgentSchema,
      },
    ]),
    AuthModule,
  ],
  providers: [AgentResolver, AgentService],
  exports: [AgentService],
})
export class AgentModule {}
