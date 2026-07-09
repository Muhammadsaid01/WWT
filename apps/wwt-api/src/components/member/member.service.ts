/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Member } from '../../libs/dto/member/member';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import { Message } from '../../libs/enums/common.enum';
import { MemberStatus } from '../../libs/enums/member.enum';
import { T } from '../../libs/types/common';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel('Member') private readonly memberModel: Model<Member>,
    private readonly authService: AuthService,
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

  public async getMember(targetId: ObjectId): Promise<Member> {
    const search: T = {
      _id: targetId,
      memberStatus: MemberStatus.ACTIVE,
    };
    const targetMember = await this.memberModel.findOne(search).exec();
    if (!targetMember) {
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);
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
