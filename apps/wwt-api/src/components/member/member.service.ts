/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../../libs/dto/member/member';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';
import { Message } from '../../libs/enums/common.enum';
import { MemberStatus } from '../../libs/enums/member.enum';

@Injectable()
export class MemberService {
  constructor(@InjectModel('Member') private readonly memberModel: Model<Member>) {}

  public async signup(input: MemberInput): Promise<Member> {
    //TODO: Hashing the password and saving the member to the database

    try {
      const result = await this.memberModel.create(input);
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

    //TODO: Compare the provided password with the hashed password in the database

    // eslint-disable-next-line prettier/prettier
    const isMatch = memberPassword === response.memberPassword;
    if (!isMatch) {
      throw new InternalServerErrorException(Message.WRONG_PASSWORD);
    }
    return response;
  }

  public async updateMember(): Promise<string> {
    return 'updateMember executed!';
  }

  public async getMember(): Promise<string> {
    return 'getMember executed!';
  }
}
