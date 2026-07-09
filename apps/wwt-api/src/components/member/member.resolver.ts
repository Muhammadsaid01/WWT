import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Member } from '../../libs/dto/member/member';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
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

  @Query(() => Member)
  public async getMember(@Args('memberId') input: string): Promise<Member> {
    console.log('Query getMember');
    const targetId = shapeIntoMongoObjectId(input);
    return this.memberService.getMember(targetId);
  }

  //** ADMIN **/

  //AUTHORIZED : Admin
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => String)
  public async getAllMembersByAdmin(@AuthMember() authMember: Member): Promise<string> {
    console.log('Authenticated Admin:', authMember.memberType);
    console.log('Mutation getAllMembersByAdmin');
    return this.memberService.getAllMembersByAdmin();
  }
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => String)
  public async updateMemberByAdmin(@AuthMember() authMember: Member): Promise<string> {
    console.log('Authenticated Admin:', authMember.memberType);
    console.log('Mutation updateMemberByAdmin');
    return this.memberService.updateMemberByAdmin();
  }
}
