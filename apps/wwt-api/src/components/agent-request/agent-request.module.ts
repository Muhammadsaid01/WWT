import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import AgentRequestSchema from '../../schemas/accounts/Agent-request.schema';
import AgentSchema from '../../schemas/accounts/Agent.schema';
import MemberSchema from '../../schemas/accounts/Member.schema';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { AgentRequestResolver } from './agent-request.resolver';
import { AgentRequestService } from './agent-request.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'AgentRequest',
        schema: AgentRequestSchema,
      },
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
    MemberModule,
  ],
  providers: [AgentRequestService, AgentRequestResolver],
  exports: [AgentRequestService],
})
export class AgentRequestModule {}
