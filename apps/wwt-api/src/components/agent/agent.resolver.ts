import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Agent, Agents } from '../../libs/dto/agent/agent';
import { AgentsInquiry } from '../../libs/dto/agent/agent.input';
import { AgentUpdate, UpdateAgentByAdmin } from '../../libs/dto/agent/agent.update';
import { Member } from '../../libs/dto/member/member';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { AgentService } from './agent.service';

@Resolver()
export class AgentResolver {
  constructor(private readonly agentService: AgentService) {}
  /** No Authentication **/

  @UseGuards(WithoutGuard)
  @Query(() => Agent)
  public async getAgent(
    @Args('agentId', { type: () => String }) input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Agent> {
    console.log('Query getAgent');
    console.log('Authenticated memberId:', memberId);
    console.log('Input agentId:', input);

    const targetId = shapeIntoMongoObjectId(input);

    return this.agentService.getAgent(memberId, targetId);
  }
  @UseGuards(WithoutGuard)
  @Query(() => Agents)
  public async getAgents(@Args('input') input: AgentsInquiry): Promise<Agents> {
    console.log('Query getAgents');
    console.log(input);

    return this.agentService.getAgents(input);
  }

  /** Authenticated : AGENT **/

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => Agent)
  public async updateAgent(
    @AuthMember('_id') memberId: ObjectId,
    @Args('input') input: AgentUpdate,
  ): Promise<Agent> {
    console.log('Mutation updateAgent');

    return this.agentService.updateAgent(memberId, input);
  }

  /** AUTHORIZED : ADMIN **/

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Agents)
  public async getAllAgentsByAdmin(
    @AuthMember() authMember: Member,
    @Args('input') input: AgentsInquiry,
  ): Promise<Agents> {
    console.log('Authenticated Admin:', authMember.memberType);
    console.log('Query getAllAgentsByAdmin');

    return this.agentService.getAllAgentsByAdmin(input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Agent)
  public async updateAgentByAdmin(@Args('input') input: UpdateAgentByAdmin): Promise<Agent> {
    console.log('Mutation updateAgentByAdmin');

    return this.agentService.updateAgentByAdmin(input);
  }
}
