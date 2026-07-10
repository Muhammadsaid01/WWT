/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { ViewInput } from '../../libs/dto/community/view.input';
import { Member } from '../../libs/dto/member/member';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import { Message } from '../../libs/enums/common.enum';
import { ViewTargetType } from '../../libs/enums/community.enum';
import { MemberStatus } from '../../libs/enums/member.enum';
import { T } from '../../libs/types/common';
import { AuthService } from '../auth/auth.service';
import { ViewService } from '../view/view.service';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel('Member') private readonly memberModel: Model<Member>,
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

  public async getAllMembersByAdmin(): Promise<string> {
    return 'getAllMembersByAdmin executed!';
  }

  public async updateMemberByAdmin(): Promise<string> {
    return 'updateMemberByAdmin executed!';
  }
}
