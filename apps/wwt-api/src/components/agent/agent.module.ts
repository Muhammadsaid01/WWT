import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import AgentSchema from '../../schemas/accounts/Agent.schema';
import MemberSchema from '../../schemas/accounts/Member.schema';
import { AuthModule } from '../auth/auth.module';
import { ViewModule } from '../view/view.module';
import { AgentResolver } from './agent.resolver';
import { AgentService } from './agent.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Agent',
        schema: AgentSchema,
      },
      {
        name: 'Member',
        schema: MemberSchema,
      },
    ]),
    AuthModule,
    ViewModule,
  ],
  providers: [AgentResolver, AgentService],
  exports: [AgentService],
})
export class AgentModule {}
