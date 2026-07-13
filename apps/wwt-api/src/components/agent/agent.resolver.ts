import { UseGuards } from '@nestjs/common';
import { Mutation, Query, Resolver } from '@nestjs/graphql';
import { MemberType } from '../../libs/enums/member.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { AgentService } from './agent.service';

@Resolver()
export class AgentResolver {
  constructor(private readonly agentService: AgentService) {}
  /** No Authentication **/

  @UseGuards(WithoutGuard)
  @Query(() => String)
  public async getAgent(): Promise<string> {
    return this.agentService.getAgent();
  }

  @UseGuards(WithoutGuard)
  @Query(() => String)
  public async getAgents(): Promise<string> {
    return this.agentService.getAgents();
  }

  /** Authenticated : AGENT **/
  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Query(() => String)
  public async getMyAgentProfile(): Promise<string> {
    return this.agentService.getMyAgentProfile();
  }

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => String)
  public async updateAgent(): Promise<string> {
    return this.agentService.updateAgent();
  }

  /** AUTHORIZED : ADMIN **/

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Query(() => String)
  public async getAllAgentsByAdmin(): Promise<string> {
    return this.agentService.getAllAgentsByAdmin();
  }

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => String)
  public async updateAgentByAdmin(): Promise<string> {
    return this.agentService.updateAgentByAdmin();
  }
}
