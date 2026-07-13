import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Member, Members } from '../../libs/dto/member/member';
import { LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input';
import { MemberUpdate, MemberUpdateByAdmin } from '../../libs/dto/member/member.update';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { MemberService } from './member.service';

@Resolver()
export class MemberResolver {
  constructor(private readonly memberService: MemberService) {}
  //** MEMBER **/ //SignUp,
  @Mutation(() => Member)
  public async signup(@Args('input') input: MemberInput): Promise<Member> {
    console.log('Mutation signup');
    console.log('Input:', input);
    return this.memberService.signup(input);
  }
  //Login
  @Mutation(() => Member)
  public async login(@Args('input') input: LoginInput): Promise<Member> {
    console.log('Mutation login');
    console.log('Input:', input);
    return this.memberService.login(input);
  }

  //Checking Authenticated Member
  @UseGuards(AuthGuard)
  @Query(() => String)
  public async checkAuth(@AuthMember('memberNick') memberNick: string): Promise<string> {
    console.log('Query: checkAuth');
    console.log('memberNick:', memberNick);
    return `Hi, ${memberNick}`;
  }
  @Roles(MemberType.AGENT, MemberType.USER)
  @UseGuards(RolesGuard)
  @Query(() => String)
  public async checkAuthRoles(@AuthMember() authMember: Member): Promise<string> {
    console.log('Query: checkAuth');
    console.log('memberNick:', authMember.memberNick);
    return `Hi, ${authMember.memberNick} you are ${authMember.memberType}, and your role is authorized! your Id is ${authMember._id}`;
  }

  @UseGuards(WithoutGuard)
  @Query(() => Member)
  public async getMember(
    @Args('memberId') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Member> {
    console.log('Query getMember');
    console.log('Input memberId:', memberId);
    const targetId = shapeIntoMongoObjectId(input);
    return this.memberService.getMember(memberId, targetId);
  }

  // Authenticated
  @UseGuards(AuthGuard)
  @Mutation(() => Member)
  public async updateMember(
    @Args('input') input: MemberUpdate,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Member> {
    console.log('Mutation updateMember');
    delete input._id;
    console.log('Authenticated Member:', memberId);
    return this.memberService.updateMember(memberId, input);
  }

  @Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Member)
  public async getMyProfile(@AuthMember('_id') memberId: ObjectId): Promise<Member> {
    console.log('Query getMyProfile');

    return this.memberService.getMyProfile(memberId);
  }

  @Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Member)
  public async deleteMember(@AuthMember('_id') memberId: ObjectId): Promise<Member> {
    console.log('Mutation deleteMember');

    return this.memberService.deleteMember(memberId);
  }

  //** ADMIN **/

  // AUTHORIZED: Admin
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Members)
  public async getAllMembersByAdmin(
    @AuthMember() authMember: Member,
    @Args('input') input: MembersInquiry,
  ): Promise<Members> {
    console.log('Authenticated Admin:', authMember.memberType);
    console.log('Query getAllMembersByAdmin');

    return this.memberService.getAllMembersByAdmin(input);
  }
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Member)
  public async updateMemberByAdmin(
    @AuthMember() authMember: Member,
    @Args('input') input: MemberUpdateByAdmin,
  ): Promise<Member> {
    console.log('Authenticated Admin:', authMember.memberType);
    console.log('Mutation updateMemberByAdmin');

    return this.memberService.updateMemberByAdmin(input);
  }
}
