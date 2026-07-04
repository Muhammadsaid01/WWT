/* eslint-disable @typescript-eslint/no-unused-vars */
import { InternalServerErrorException } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Member } from '../../libs/dto/member/member';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';
import { MemberService } from './member.service';

@Resolver()
export class MemberResolver {
  constructor(private readonly memberService: MemberService) {}

  @Mutation(() => Member)
  public async signup(@Args('input') input: MemberInput): Promise<Member> {
    try {
      console.log('Mutation signup');
      console.log('Input:', input);
      return this.memberService.signup(input);
    } catch (err) {
      console.log('Error in signup mutation:', err);
      throw new InternalServerErrorException(err);
    }
  }

  @Mutation(() => Member)
  public async login(@Args('input') input: LoginInput): Promise<Member> {
    try {
      console.log('Mutation login');
      console.log('Input:', input);
      return this.memberService.login(input);
    } catch (err) {
      console.log('Error in login mutation:', err);
      throw new InternalServerErrorException(err);
    }
  }

  @Mutation(() => String)
  public async updateMember(): Promise<string> {
    console.log('Mutation updateMember');
    return this.memberService.updateMember();
  }

  @Query(() => String)
  public async getMember(): Promise<string> {
    console.log('Query getMember');
    return this.memberService.getMember();
  }
}
