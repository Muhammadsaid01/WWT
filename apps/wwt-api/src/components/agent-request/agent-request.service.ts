import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AgentRequest } from '../../libs/dto/agent-request/agent-request';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AgentRequestService {
  constructor(
    @InjectModel('AgentRequest') private readonly memberModel: Model<AgentRequest>,
    private authService: AuthService,
  ) {}

  public async createAgentRequest(): Promise<string> {
    return 'createAgentRequest executed';
  }

  public async getMyAgentRequest(): Promise<string> {
    return 'getMyAgentRequest executed';
  }

  public async getAgentRequests(): Promise<string> {
    return 'getAgentRequests executed';
  }

  public async approveAgentRequest(): Promise<string> {
    return 'approveAgentRequest executed';
  }

  public async rejectAgentRequest(): Promise<string> {
    return 'rejectAgentRequest executed';
  }
}
