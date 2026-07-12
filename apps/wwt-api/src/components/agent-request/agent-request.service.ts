import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { AgentRequest, AgentRequests } from '../../libs/dto/agent-request/agent-request';
import {
  AgentRequestInput,
  AgentRequestRejectInput,
  AgentRequestsInquiry,
} from '../../libs/dto/agent-request/agent-request.input';
import { Agent } from '../../libs/dto/agent/agent';
import { Member } from '../../libs/dto/member/member';
import { AgentRequestStatus } from '../../libs/enums/agent-request.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AgentRequestService {
  constructor(
    @InjectModel('AgentRequest') private readonly agentRequestModel: Model<AgentRequest>,
    @InjectModel('Agent')
    private readonly agentModel: Model<Agent>,

    @InjectModel('Member')
    private readonly memberModel: Model<Member>,
    private authService: AuthService,
  ) {}

  public async createAgentRequest(
    memberId: ObjectId,
    input: AgentRequestInput,
  ): Promise<AgentRequest> {
    const existingRequest = await this.agentRequestModel
      .findOne({
        memberId,
        requestStatus: AgentRequestStatus.PENDING,
      })
      .exec();

    if (existingRequest) {
      throw new BadRequestException(Message.SENDED_REQUEST);
    }
    try {
      return await this.agentRequestModel.create({
        ...input,
        memberId,
      });
    } catch (err) {
      console.log('Error creating agent request:', err);
      throw new InternalServerErrorException(Message.CREATE_FAILED);
    }
  }

  public async getMyAgentRequest(memberId: ObjectId): Promise<AgentRequest> {
    return await this.agentRequestModel.findOne({ memberId }).sort({ createdAt: -1 }).lean().exec();
  }

  public async getAllAgentRequestsByAdmin(input: AgentRequestsInquiry): Promise<AgentRequests> {
    const { page, limit, sort, direction, search } = input;

    const match: Record<string, any> = {};

    if (search?.requestStatus) {
      match.requestStatus = search.requestStatus;
    }

    if (search?.text) {
      match.$or = [
        {
          companyName: {
            $regex: search.text,
            $options: 'i',
          },
        },
        {
          businessNumber: {
            $regex: search.text,
            $options: 'i',
          },
        },
        {
          licenseNumber: {
            $regex: search.text,
            $options: 'i',
          },
        },
      ];
    }

    const sortField = sort || 'createdAt';
    const sortDirection = direction === Direction.ASC ? 1 : -1;

    const [list, total] = await Promise.all([
      this.agentRequestModel
        .find(match)
        .sort({ [sortField]: sortDirection })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),

      this.agentRequestModel.countDocuments(match),
    ]);

    return {
      list: list as AgentRequest[],
      metaCounter: [{ total }],
    };
  }

  public async approveAgentRequestByAdmin(
    agentRequestId: string,
    adminId: ObjectId,
  ): Promise<AgentRequest> {
    const request = await this.agentRequestModel.findById(agentRequestId);

    if (!request) {
      throw new NotFoundException('Agent request not found!');
    }

    if (request.requestStatus !== AgentRequestStatus.PENDING) {
      throw new BadRequestException('This agent request has already been reviewed!');
    }

    const existingAgent = await this.agentModel.findOne({
      memberId: request.memberId,
    });

    if (existingAgent) {
      throw new BadRequestException('This member is already an agent!');
    }

    await this.agentModel.create({
      memberId: request.memberId,
      companyName: request.companyName,
      businessNumber: request.businessNumber,
      licenseNumber: request.licenseNumber,
      agentDescription: request.agentDescription,
    });

    await this.memberModel.findByIdAndUpdate(request.memberId, {
      memberType: MemberType.AGENT,
    });

    request.requestStatus = AgentRequestStatus.APPROVED;
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    request.rejectReason = null;

    return await request.save();
  }

  public async rejectAgentRequestByAdmin(
    agentRequestId: string,
    adminId: ObjectId,
    input: AgentRequestRejectInput,
  ): Promise<AgentRequest> {
    const request = await this.agentRequestModel.findById(agentRequestId);

    if (!request) {
      throw new NotFoundException('Agent request not found!');
    }

    if (request.requestStatus !== AgentRequestStatus.PENDING) {
      throw new BadRequestException('This agent request has already been reviewed!');
    }

    request.requestStatus = AgentRequestStatus.REJECTED;

    request.rejectReason = input.rejectReason;
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();

    return request.save();
  }
}
