import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, ObjectId, PipelineStage } from 'mongoose';
import { lookupUsageMember, unwindUsageMember } from '../../libs/config';
import { Agent, Agents } from '../../libs/dto/agent/agent';
import { AgentsInquiry } from '../../libs/dto/agent/agent.input';
import { AgentUpdate, UpdateAgentByAdmin } from '../../libs/dto/agent/agent.update';
import { ViewInput } from '../../libs/dto/community/view.input';
import { Member } from '../../libs/dto/member/member';
import { AgentStatus, AgentVerificationStatus } from '../../libs/enums/agent.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ViewTargetType } from '../../libs/enums/community.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { AuthService } from '../auth/auth.service';
import { ViewService } from '../view/view.service';

@Injectable()
export class AgentService {
  constructor(
    @InjectModel('Agent') private readonly agentModel: Model<Agent>,
    @InjectModel('Member') private readonly memberModel: Model<Member>,
    private authService: AuthService,
    private viewService: ViewService,
  ) {}

  public async getAgent(authMemberId: ObjectId | null, agentId: ObjectId): Promise<Agent> {
    const targetAgent = await this.agentModel
      .findOne({
        _id: agentId,
        agentStatus: AgentStatus.ACTIVE,
      })
      .lean()
      .exec();

    if (!targetAgent) {
      throw new NotFoundException(Message.NO_DATA_FOUND);
    }

    const memberData = await this.memberModel.findById(targetAgent.memberId).lean().exec();

    if (!memberData) {
      throw new NotFoundException(Message.NO_DATA_FOUND);
    }

    if (authMemberId) {
      const viewInput: ViewInput = {
        viewerId: authMemberId,
        targetId: targetAgent.memberId,
        targetType: ViewTargetType.MEMBER,
      };

      const newView = await this.viewService.recordView(viewInput);

      if (newView) {
        await this.memberModel
          .findByIdAndUpdate(targetAgent.memberId, {
            $inc: { memberViewCount: 1 },
          })
          .exec();

        memberData.memberViewCount += 1;
      }
    }

    return {
      ...targetAgent,
      memberData,
    } as Agent;
  }

  public async getAgents(input: AgentsInquiry): Promise<Agents> {
    const { page, limit, search, sort, direction } = input;
    const match: T = { agentStatus: AgentStatus.ACTIVE };
    if (search?.verificationStatus) match.verificationStatus = search.verificationStatus;

    const allowedSorts = ['agentRank', 'agentRating', 'agentReviewCount', 'createdAt'];
    const sortField = sort && allowedSorts.includes(sort) ? sort : 'agentRank';
    const sortOrder = direction === Direction.ASC ? 1 : -1;
    const pipeline: PipelineStage[] = [{ $match: match }, lookupUsageMember, unwindUsageMember];
    const text = search?.text?.trim();
    if (text) {
      // Treat search as literal text, not a user-supplied regular expression.
      const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const fields = [
        'companyName',
        'agentDesc',
        'officeAddress',
        'companyEmail',
        'memberData.memberFullName',
        'memberData.memberNick',
        'memberData.memberCountry',
        'memberData.memberCity',
      ];
      pipeline.push({
        $match: {
          $or: fields.map((field) => ({ [field]: { $regex: escaped, $options: 'i' } })),
        },
      });
    }
    pipeline.push(
      // A unique tie-breaker keeps equal ranks/ratings stable across pages.
      { $sort: { [sortField]: sortOrder, _id: sortOrder } },
      {
        $facet: {
          list: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          metaCounter: [{ $count: 'total' }],
        },
      },
    );
    const [result] = await this.agentModel.aggregate<Agents>(pipeline).exec();
    return result ?? { list: [], metaCounter: [] };
  }

  public async updateAgent(memberId: ObjectId, input: AgentUpdate): Promise<Agent> {
    try {
      const updatedAgent = await this.agentModel
        .findOneAndUpdate(
          {
            memberId,
            agentStatus: AgentStatus.ACTIVE,
          },
          {
            $set: input,
          },
          {
            new: true,
          },
        )
        .lean()
        .exec();

      if (!updatedAgent) {
        throw new NotFoundException(Message.NO_DATA_FOUND);
      }

      return updatedAgent as Agent;
    } catch (err) {
      console.error('Error updating agent:', err);

      throw new InternalServerErrorException(Message.UPDATE_FAILED);
    }
  }

  public async getAllAgentsByAdmin(input: AgentsInquiry): Promise<Agents> {
    const { page, limit, sort, direction, search } = input;

    const match: T = {};

    if (search?.agentStatus) {
      match.agentStatus = search.agentStatus;
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
          companyEmail: {
            $regex: search.text,
            $options: 'i',
          },
        },
      ];
    }

    const sortField = sort || 'createdAt';
    const sortOrder = direction === Direction.ASC ? 1 : -1;

    const result = await this.agentModel
      .find(match)
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();

    for (const agent of result) {
      agent.memberData = await this.memberModel.findById(agent.memberId).lean().exec();
    }

    const total = await this.agentModel.countDocuments(match);

    return {
      list: result as Agent[],
      metaCounter: [{ total }],
    };
  }

  public async updateAgentByAdmin(input: UpdateAgentByAdmin): Promise<Agent> {
    const { agentId, ...updateData } = input;

    const updatedAgent = await this.agentModel
      .findByIdAndUpdate(
        agentId,
        {
          $set: updateData,
        },
        {
          new: true,
        },
      )
      .lean()
      .exec();

    if (!updatedAgent) {
      throw new NotFoundException(Message.NO_DATA_FOUND);
    }

    return updatedAgent as Agent;
  }

  public async findAgentByMemberId(memberId: ObjectId): Promise<Agent> {
    const agent = await this.agentModel
      .findOne({
        memberId,
        agentStatus: AgentStatus.ACTIVE,
        verificationStatus: AgentVerificationStatus.APPROVED,
      })
      .exec();

    if (!agent) {
      throw new BadRequestException('Active and approved agent profile not found');
    }

    return agent;
  }

  public async agentStatsEditor(input: StatisticModifier, session?: ClientSession): Promise<Agent> {
    const { _id, targetKey, modifier } = input;
    const match: T = { _id };

    if (targetKey === 'agentPackageCount' && modifier < 0) {
      match.agentPackageCount = { $gte: Math.abs(modifier) };
    }

    const result = await this.agentModel
      .findOneAndUpdate(
        match,
        {
          $inc: { [targetKey]: modifier },
        },
        { new: true, session },
      )
      .exec();
    if (!result) {
      throw new InternalServerErrorException(Message.UPDATE_FAILED);
    }

    return result;
  }

  public async findAgentById(agentId: ObjectId): Promise<Agent> {
    const agent = await this.agentModel
      .findOne({
        _id: agentId,
        agentStatus: AgentStatus.ACTIVE,
      })
      .lean()
      .exec();

    if (!agent) {
      throw new NotFoundException(Message.NO_DATA_FOUND);
    }

    return agent;
  }

  public async findAgentMemberId(agentId: ObjectId): Promise<ObjectId> {
    const agent = await this.agentModel.findById(agentId).select('memberId').lean().exec();

    if (!agent) {
      throw new NotFoundException(Message.NO_DATA_FOUND);
    }

    return agent.memberId;
  }
}
