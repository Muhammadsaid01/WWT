/* eslint-disable @typescript-eslint/no-unused-vars */
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { Member } from '../../libs/dto/member/member';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { MemberService } from './member.service';

@Resolver()
export class MemberResolver {
  constructor(private readonly memberService: MemberService) {}

  @Mutation(() => Member)
  public async signup(@Args('input') input: MemberInput): Promise<Member> {
    console.log('Mutation signup');
    console.log('Input:', input);
    return this.memberService.signup(input);
  }

  @Mutation(() => Member)
  public async login(@Args('input') input: LoginInput): Promise<Member> {
    console.log('Mutation login');
    console.log('Input:', input);
    return this.memberService.login(input);
  }

  //Checking Authenticated Member
  @UseGuards(AuthGuard)
  @Query(() => String)
  public async checkAuth(@AuthMember('memberNick') memberNick: ObjectId): Promise<string> {
    console.log('Query: checkAuth');
    console.log('memberNick:', memberNick);
    return `Hi, ${memberNick}`;
  }
  // Authenticated
  @UseGuards(AuthGuard)
  @Mutation(() => String)
  public async updateMember(@AuthMember('_id') memberId: ObjectId): Promise<string> {
    console.log('Mutation updateMember');
    console.log('Authenticated Member:', memberId);
    return this.memberService.updateMember();
  }

  @Query(() => String)
  public async getMember(): Promise<string> {
    console.log('Query getMember');
    return this.memberService.getMember();
  }

  //** ADMIN **/

  //AUTHORIZED : Admin
  @Mutation(() => String)
  public async getAllMembersByAdmin(): Promise<string> {
    console.log('Mutation getAllMembersByAdmin');
    return this.memberService.getAllMembersByAdmin();
  }

  @Mutation(() => String)
  public async updateMemberByAdmin(): Promise<string> {
    console.log('Mutation updateMemberByAdmin');
    return this.memberService.updateMemberByAdmin();
  }
}
