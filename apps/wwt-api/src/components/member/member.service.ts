/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Agent } from '../../libs/dto/agent/agent';
import { ViewInput } from '../../libs/dto/community/view.input';
import { Member, Members } from '../../libs/dto/member/member';
import { LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input';
import { MemberUpdate, MemberUpdateByAdmin } from '../../libs/dto/member/member.update';
import { AgentStatus } from '../../libs/enums/agent.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ViewTargetType } from '../../libs/enums/community.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { AuthService } from '../auth/auth.service';
import { ViewService } from '../view/view.service';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel('Member') private readonly memberModel: Model<Member>,

    @InjectModel('Agent') private readonly agentModel: Model<Agent>,
    private authService: AuthService,
    private viewService: ViewService,
  ) {}

  public async signup(input: MemberInput): Promise<Member> {
    // Hashing the password and saving the member to the database
    input.memberPassword = await this.authService.hashPassword(input.memberPassword);
    try {
      const result = await this.memberModel.create(input);
      //Authentication via TOKEN
      result.accessToken = await this.authService.createToken(result);

      return result;
    } catch (err) {
      console.log('Error Service modelcreating member:', err);
      throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
    }
  }

  public async login(input: LoginInput): Promise<Member> {
    const { memberNick, memberPassword } = input;
    const response: Member = (await this.memberModel
      .findOne({ memberNick: memberNick })
      .select('+memberPassword')
      .exec()) as Member;

    if (!response || response.memberStatus === MemberStatus.DELETED) {
      throw new InternalServerErrorException(Message.NO_MEMBER_NICK);
    } else if (response.memberStatus === MemberStatus.BLOCKED) {
      throw new InternalServerErrorException(Message.BLOCKED_USER);
    }

    //Compare the provided password with the hashed password in the database
    const isMatch = await this.authService.comparePasswords(
      memberPassword,
      response.memberPassword,
    );
    if (!isMatch) throw new InternalServerErrorException(Message.WRONG_PASSWORD);
    response.accessToken = await this.authService.createToken(response);
    return response;
  }

  public async getMember(memberId: ObjectId, targetId: ObjectId): Promise<Member> {
    const search: T = {
      _id: targetId,
      memberStatus: MemberStatus.ACTIVE,
    };
    const targetMember = await this.memberModel.findOne(search).lean().exec();
    if (!targetMember) {
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    }

    if (memberId) {
      const viewInput: ViewInput = {
        viewerId: memberId,
        targetId: targetId,
        targetType: ViewTargetType.MEMBER,
      };
      const newView = await this.viewService.recordView(viewInput);
      if (newView) {
        await this.memberModel
          .findOneAndUpdate({ _id: targetId }, { $inc: { memberViewCount: 1 } }, { new: true })
          .exec();
        targetMember.memberViewCount++; // Increment the view count in the targetMember object
      }
    }
    return targetMember;
  }

  public async getMyProfile(memberId: ObjectId): Promise<Member> {
    const member = await this.memberModel
      .findOne({
        _id: memberId,
        memberStatus: MemberStatus.ACTIVE,
      })
      .lean()
      .exec();

    if (!member) {
      throw new NotFoundException(Message.NO_DATA_FOUND);
    }

    let agentData: Agent | null = null;

    if (member.memberType === MemberType.AGENT) {
      agentData = await this.agentModel
        .findOne({
          memberId,
          agentStatus: AgentStatus.ACTIVE,
        })
        .lean()
        .exec();
    }

    return {
      ...member,
      agentData,
    } as Member;
  }

  public async updateMember(memberId: ObjectId, input: MemberUpdate): Promise<Member> {
    const result = await this.memberModel
      .findOneAndUpdate(
        {
          _id: memberId,
          memberStatus: MemberStatus.ACTIVE,
        },
        input,
        { new: true },
      )
      .exec();
    if (!result) {
      throw new InternalServerErrorException(Message.UPDATE_FAILED);
    }

    result.accessToken = await this.authService.createToken(result);
    return result;
  }

  public async deleteMember(memberId: ObjectId): Promise<Member> {
    const deletedMember = await this.memberModel
      .findOneAndUpdate(
        {
          _id: memberId,
          memberStatus: {
            $ne: MemberStatus.DELETED,
          },
        },
        {
          $set: {
            memberStatus: MemberStatus.DELETED,
            memberDeletedAt: new Date(),
          },
        },
        {
          new: true,
        },
      )
      .lean()
      .exec();

    if (!deletedMember) {
      throw new NotFoundException(Message.NO_DATA_FOUND);
    }

    return deletedMember as Member;
  }

  public async getAllMembersByAdmin(input: MembersInquiry): Promise<Members> {
    const { memberStatus, memberType, text } = input.search ?? {};

    const match: T = {};

    const sort: T = {
      [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
    };

    if (memberStatus) {
      match.memberStatus = memberStatus;
    }

    if (memberType) {
      match.memberType = memberType;
    }

    if (text) {
      match.$or = [
        {
          memberNick: {
            $regex: text,
            $options: 'i',
          },
        },
        {
          memberFullName: {
            $regex: text,
            $options: 'i',
          },
        },
        {
          memberEmail: {
            $regex: text,
            $options: 'i',
          },
        },
        {
          memberPhone: {
            $regex: text,
            $options: 'i',
          },
        },
      ];
    }

    const result = await this.memberModel.aggregate([
      {
        $match: match,
      },
      {
        $sort: sort,
      },
      {
        $facet: {
          list: [
            {
              $skip: (input.page - 1) * input.limit,
            },
            {
              $limit: input.limit,
            },
          ],
          metaCounter: [
            {
              $count: 'total',
            },
          ],
        },
      },
    ]);

    return result[0];
  }
  public async updateMemberByAdmin(input: MemberUpdateByAdmin): Promise<Member> {
    const { memberId, ...updateData } = input;

    const updatedMember = await this.memberModel
      .findByIdAndUpdate(
        memberId,
        {
          $set: updateData,
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .lean()
      .exec();

    if (!updatedMember) {
      throw new NotFoundException(Message.NO_DATA_FOUND);
    }

    return updatedMember as Member;
  }

  public async findMemberById(memberId: ObjectId): Promise<Member> {
    const member = await this.memberModel.findById(memberId).lean().exec();

    if (!member) {
      throw new NotFoundException(Message.NO_DATA_FOUND);
    }

    return member;
  }

  public async memberStatsEditor(input: StatisticModifier): Promise<Member> {
    const { _id, targetKey, modifier } = input;
    const result = await this.memberModel
      .findByIdAndUpdate(
        _id,
        {
          $inc: { [targetKey]: modifier },
        },
        { new: true },
      )
      .exec();
    if (!result) {
      throw new InternalServerErrorException(Message.UPDATE_FAILED);
    }

    return result;
  }
}
