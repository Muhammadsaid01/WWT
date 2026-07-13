import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Agent } from '../../libs/dto/agent/agent';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AgentService {
  constructor(
    @InjectModel('Agent') private readonly memberModel: Model<Agent>,
    private authService: AuthService,
  ) {}

  public async getAgent(): Promise<string> {
    return 'getAgent executed';
  }

  public async getAgents(): Promise<string> {
    return 'getAgent executed';
  }

  public async getMyAgentProfile(): Promise<string> {
    return 'getAgent executed';
  }

  public async updateAgent(): Promise<string> {
    return 'getAgent executed';
  }

  public async getAllAgentsByAdmin(): Promise<string> {
    return 'getAgent executed';
  }

  public async updateAgentByAdmin(): Promise<string> {
    return 'getAgent executed';
  }
}
