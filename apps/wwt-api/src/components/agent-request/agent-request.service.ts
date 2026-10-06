import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, isValidObjectId, Model, ObjectId } from 'mongoose';
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
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { NotificationReferenceType, NotificationType } from '../../libs/enums/notification.enum';
import { NotificationService } from '../notification/notification.service';

type DuplicateKeyError = {
  code?: number;
  keyPattern?: Record<string, unknown>;
  keyValue?: Record<string, unknown>;
};

const agentRequestSortFields = new Set([
  'createdAt',
  'updatedAt',
  'companyName',
  'requestStatus',
  'reviewedAt',
]);

function duplicateKeyField(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;

  const duplicate = error as DuplicateKeyError;
  if (duplicate.code !== 11000) return null;

  return Object.keys(duplicate.keyPattern ?? duplicate.keyValue ?? {})[0] ?? null;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class AgentRequestService {
  private readonly logger = new Logger(AgentRequestService.name);

  constructor(
    @InjectModel('AgentRequest')
    private readonly agentRequestModel: Model<AgentRequest>,
    @InjectModel('Agent')
    private readonly agentModel: Model<Agent>,

    @InjectModel('Member')
    private readonly memberModel: Model<Member>,
    private readonly notificationService: NotificationService,
  ) {}

  public async createAgentRequest(
    memberId: ObjectId,
    input: AgentRequestInput,
  ): Promise<AgentRequest> {
    const member = await this.memberModel.findById(memberId).lean().exec();

    if (!member) {
      throw new NotFoundException(Message.NO_DATA_FOUND);
    }

    if (member.memberStatus !== MemberStatus.ACTIVE || member.memberType !== MemberType.USER) {
      throw new BadRequestException('Only active USER members can submit an agent request.');
    }

    const existingRequest = await this.agentRequestModel
      .findOne({
        memberId,
        requestStatus: AgentRequestStatus.PENDING,
      })
      .lean()
      .exec();

    if (existingRequest) {
      throw new BadRequestException(Message.SENDED_REQUEST);
    }

    try {
      return await this.agentRequestModel.create({
        ...input,
        memberId,
      });
    } catch (error) {
      if (duplicateKeyField(error)) {
        throw new BadRequestException(Message.SENDED_REQUEST);
      }

      this.logger.error(
        'Agent request creation failed',
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(Message.CREATE_FAILED);
    }
  }

  public async getMyAgentRequest(memberId: ObjectId): Promise<AgentRequest | null> {
    return (await this.agentRequestModel
      .findOne({ memberId })
      .sort({ createdAt: -1 })
      .lean()
      .exec()) as AgentRequest | null;
  }

  public async getAllAgentRequestsByAdmin(input: AgentRequestsInquiry): Promise<AgentRequests> {
    const { page, limit, sort, direction, search } = input;
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const match: FilterQuery<AgentRequest> = {};

    if (search?.requestStatus) {
      match.requestStatus = search.requestStatus;
    }

    const text = search?.text?.trim();
    if (text) {
      const escapedText = escapeRegex(text);
      match.$or = ['companyName', 'businessNumber', 'licenseNumber'].map((field) => ({
        [field]: {
          $regex: escapedText,
          $options: 'i',
        },
      }));
    }

    const sortField = sort && agentRequestSortFields.has(sort) ? sort : 'createdAt';
    const sortDirection = direction === Direction.ASC ? 1 : -1;

    const [list, total] = await Promise.all([
      this.agentRequestModel
        .find(match)
        .sort({ [sortField]: sortDirection, _id: sortDirection })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
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
    this.assertValidRequestId(agentRequestId);

    let approvedRequest: AgentRequest;

    try {
      approvedRequest = await this.agentRequestModel.db.transaction(
        async (session) => {
          const reviewedAt = new Date();
          const request = await this.agentRequestModel
            .findOneAndUpdate(
              {
                _id: agentRequestId,
                requestStatus: AgentRequestStatus.PENDING,
              },
              {
                $set: {
                  requestStatus: AgentRequestStatus.APPROVED,
                  reviewedBy: adminId,
                  reviewedAt,
                  rejectReason: null,
                },
              },
              {
                new: true,
                runValidators: true,
                session,
              },
            )
            .exec();

          if (!request) {
            const existingRequest = await this.agentRequestModel
              .findById(agentRequestId)
              .session(session)
              .lean()
              .exec();

            if (!existingRequest) {
              throw new NotFoundException('Agent request not found!');
            }

            throw new BadRequestException('This agent request has already been reviewed!');
          }

          const member = await this.memberModel
            .findById(request.memberId)
            .session(session)
            .lean()
            .exec();

          if (!member) {
            throw new NotFoundException('Agent request member not found!');
          }

          if (
            member.memberStatus !== MemberStatus.ACTIVE ||
            member.memberType !== MemberType.USER
          ) {
            throw new BadRequestException(
              'Only an active USER member can be promoted through an agent request.',
            );
          }

          const conflictingAgent = await this.agentModel
            .findOne({
              $or: [
                { memberId: request.memberId },
                { businessNumber: request.businessNumber },
                { licenseNumber: request.licenseNumber },
              ],
            })
            .session(session)
            .lean()
            .exec();

          if (conflictingAgent) {
            if (conflictingAgent.memberId.toString() === request.memberId.toString()) {
              throw new BadRequestException('This member is already an agent!');
            }
            if (conflictingAgent.businessNumber === request.businessNumber) {
              throw new BadRequestException('An agent with this business number already exists.');
            }
            throw new BadRequestException('An agent with this license number already exists.');
          }

          await this.agentModel.create(
            [
              {
                memberId: request.memberId,
                companyName: request.companyName,
                businessNumber: request.businessNumber,
                licenseNumber: request.licenseNumber,
                agentDesc: request.agentDescription,
              },
            ],
            { session },
          );

          const promotedMember = await this.memberModel
            .findOneAndUpdate(
              {
                _id: request.memberId,
                memberStatus: MemberStatus.ACTIVE,
                memberType: MemberType.USER,
              },
              {
                $set: {
                  memberType: MemberType.AGENT,
                },
              },
              {
                new: true,
                runValidators: true,
                session,
              },
            )
            .exec();

          if (!promotedMember) {
            throw new BadRequestException('The member is no longer eligible for agent promotion.');
          }

          return request as AgentRequest;
        },
        {
          readConcern: { level: 'snapshot' },
          writeConcern: { w: 'majority' },
          readPreference: 'primary',
        },
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;

      const duplicateField = duplicateKeyField(error);
      if (duplicateField === 'businessNumber') {
        throw new BadRequestException('An agent with this business number already exists.');
      }
      if (duplicateField === 'licenseNumber') {
        throw new BadRequestException('An agent with this license number already exists.');
      }
      if (duplicateField === 'memberId') {
        throw new BadRequestException('This member is already an agent!');
      }

      this.logger.error(
        'Agent request approval transaction failed',
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(Message.UPDATE_FAILED);
    }

    try {
      await this.notificationService.createNotification({
        receiverId: approvedRequest.memberId,
        senderId: adminId,
        notificationType: NotificationType.AGENT_REQUEST_APPROVED,
        notificationTitle: 'Agent request approved',
        notificationMessage: 'Congratulations! Your agent request has been approved.',
        referenceType: NotificationReferenceType.AGENT_REQUEST,
        referenceId: approvedRequest._id,
      });
    } catch (error) {
      this.logger.error(
        'Post-approval notification failed',
        error instanceof Error ? error.stack : undefined,
      );
    }

    return approvedRequest;
  }

  public async rejectAgentRequestByAdmin(
    agentRequestId: string,
    adminId: ObjectId,
    input: AgentRequestRejectInput,
  ): Promise<AgentRequest> {
    this.assertValidRequestId(agentRequestId);

    const rejectedRequest = await this.agentRequestModel
      .findOneAndUpdate(
        {
          _id: agentRequestId,
          requestStatus: AgentRequestStatus.PENDING,
        },
        {
          $set: {
            requestStatus: AgentRequestStatus.REJECTED,
            rejectReason: input.rejectReason,
            reviewedBy: adminId,
            reviewedAt: new Date(),
          },
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .exec();

    if (!rejectedRequest) {
      const existingRequest = await this.agentRequestModel.findById(agentRequestId).lean().exec();

      if (!existingRequest) {
        throw new NotFoundException('Agent request not found!');
      }

      throw new BadRequestException('This agent request has already been reviewed!');
    }

    try {
      await this.notificationService.createNotification({
        receiverId: rejectedRequest.memberId,
        senderId: adminId,
        notificationType: NotificationType.AGENT_REQUEST_REJECTED,
        notificationTitle: 'Agent request rejected',
        notificationMessage: rejectedRequest.rejectReason
          ? `Your agent request has been rejected. Reason: ${rejectedRequest.rejectReason}`
          : 'Your agent request has been rejected.',
        referenceType: NotificationReferenceType.AGENT_REQUEST,
        referenceId: rejectedRequest._id,
      });
    } catch (error) {
      this.logger.error(
        'Post-rejection notification failed',
        error instanceof Error ? error.stack : undefined,
      );
    }

    return rejectedRequest as AgentRequest;
  }

  private assertValidRequestId(agentRequestId: string): void {
    if (!isValidObjectId(agentRequestId)) {
      throw new NotFoundException('Agent request not found!');
    }
  }
}
