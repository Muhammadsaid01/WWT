import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AgentRequest, AgentRequests } from '../../libs/dto/agent-request/agent-request';
import {
  AgentRequestInput,
  AgentRequestRejectInput,
  AgentRequestsInquiry,
} from '../../libs/dto/agent-request/agent-request.input';
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
  @Mutation(() => AgentRequest)
  public async createAgentRequest(
    @AuthMember() authMember: Member,
    @Args('input') input: AgentRequestInput,
  ): Promise<AgentRequest> {
    console.log('Authenticated USER:', authMember.memberType);
    console.log('Mutation createAgentRequest');
    return this.agentRequestService.createAgentRequest(authMember._id, input);
  }

  /** Auth User gets his Agent Request **/
  @Roles(MemberType.USER, MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Query(() => AgentRequest, { nullable: true })
  public async getMyAgentRequest(@AuthMember() authMember: Member): Promise<AgentRequest | null> {
    console.log('Authenticated USER:', authMember.memberType);
    console.log('Query getMyAgentRequest');

    return this.agentRequestService.getMyAgentRequest(authMember._id);
  }

  /** Admin gets all Agent Requests **/
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => AgentRequests)
  public async getAllAgentRequestsByAdmin(
    @AuthMember() authMember: Member,
    @Args('input') input: AgentRequestsInquiry,
  ): Promise<AgentRequests> {
    console.log('Authenticated Admin:', authMember.memberType);
    console.log('Query getAllAgentRequestsByAdmin');

    return this.agentRequestService.getAllAgentRequestsByAdmin(input);
  }

  /** Admin approves Agent Request **/
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => AgentRequest)
  public async approveAgentRequestByAdmin(
    @AuthMember() authMember: Member,
    @Args('agentRequestId') agentRequestId: string,
  ): Promise<AgentRequest> {
    console.log('Authenticated Admin:', authMember.memberType);
    console.log('Mutation approveAgentRequestAdmin');

    return this.agentRequestService.approveAgentRequestByAdmin(agentRequestId, authMember._id);
  }

  /** Admin rejects Agent Request **/
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => AgentRequest)
  public async rejectAgentRequestByAdmin(
    @AuthMember() authMember: Member,
    @Args('agentRequestId', { type: () => String })
    agentRequestId: string,

    @Args('input')
    input: AgentRequestRejectInput,
  ): Promise<AgentRequest> {
    console.log('Authenticated Admin:', authMember.memberType);
    console.log('Mutation rejectAgentRequestByAdmin');

    return this.agentRequestService.rejectAgentRequestByAdmin(
      agentRequestId,
      authMember._id,
      input,
    );
  }
}
