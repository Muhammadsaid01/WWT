import { UseGuards } from '@nestjs/common';
import { Mutation, Query, Resolver } from '@nestjs/graphql';
import { Member } from '../../libs/dto/member/member';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AgentRequestService } from './agent-request.service';

@Resolver()
export class AgentRequestResolver {
  constructor(private readonly agentRequestService: AgentRequestService) {}
  /** Auth User create request to be Agent  **/

  @Roles(MemberType.USER)
  @UseGuards(RolesGuard)
  @Mutation(() => String)
  public async createAgentRequest(@AuthMember() authMember: Member): Promise<string> {
    console.log('Authenticated USER:', authMember.memberType);
    console.log('Mutation createAgentRequest');
    return this.agentRequestService.createAgentRequest();
  }

  /** Auth User gets his Agent Request **/
  @Roles(MemberType.USER, MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Query(() => String)
  public async getMyAgentRequest(@AuthMember() authMember: Member): Promise<string> {
    console.log('Authenticated USER:', authMember.memberType);
    console.log('Query getMyAgentRequest');
    return this.agentRequestService.getMyAgentRequest();
  }

  /** Admin gets Agent Request **/
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => String)
  public async getAgentRequests(@AuthMember() authMember: Member): Promise<string> {
    console.log('Authenticated Admin:', authMember.memberType);
    console.log('Mutation updateMemberByAdmin');
    return this.agentRequestService.getAgentRequests();
  }

  /** Admin approves Agent Request **/
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => String)
  public async approveAgentRequest(@AuthMember() authMember: Member): Promise<string> {
    console.log('Authenticated Admin:', authMember.memberType);
    console.log('Mutation approveAgentRequest');
    return this.agentRequestService.approveAgentRequest();
  }

  /** Admin Rejects Agent Request  */
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => String)
  public async rejectAgentRequest(@AuthMember() authMember: Member): Promise<string> {
    console.log('Authenticated Admin:', authMember.memberType);
    console.log('Mutation rejectAgentRequest');
    return this.agentRequestService.rejectAgentRequest();
  }
}
