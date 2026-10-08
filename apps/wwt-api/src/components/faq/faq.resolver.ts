import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { Faq, Faqs } from '../../libs/dto/system/faq';
import { FaqInput, FaqsInquiry, FaqUpdate } from '../../libs/dto/system/faq.input';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { FaqService } from './faq.service';

@Resolver()
export class FaqResolver {
  constructor(private readonly faqService: FaqService) {}

  @UseGuards(WithoutGuard)
  @Query(() => Faqs)
  public getFaqs(@Args('input') input: FaqsInquiry): Promise<Faqs> {
    return this.faqService.getFaqs(input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Faq)
  public getFaq(@Args('faqId', { type: () => String }) faqId: string): Promise<Faq> {
    return this.faqService.getFaq(faqId);
  }

  @UseGuards(RolesGuard)
  @Roles(MemberType.ADMIN)
  @Query(() => Faqs)
  public getAllFaqsByAdmin(@Args('input') input: FaqsInquiry): Promise<Faqs> {
    return this.faqService.getAllFaqsByAdmin(input);
  }

  @UseGuards(RolesGuard)
  @Roles(MemberType.ADMIN)
  @Query(() => Faq)
  public getFaqByAdmin(@Args('faqId', { type: () => String }) faqId: string): Promise<Faq> {
    return this.faqService.getFaqByAdmin(faqId);
  }

  @UseGuards(RolesGuard)
  @Roles(MemberType.ADMIN)
  @Mutation(() => Faq)
  public createFaq(
    @Args('input') input: FaqInput,
    @AuthMember('_id') adminId: ObjectId,
  ): Promise<Faq> {
    return this.faqService.createFaq(adminId, input);
  }

  @UseGuards(RolesGuard)
  @Roles(MemberType.ADMIN)
  @Mutation(() => Faq)
  public updateFaq(@Args('input') input: FaqUpdate): Promise<Faq> {
    return this.faqService.updateFaq(input);
  }

  @UseGuards(RolesGuard)
  @Roles(MemberType.ADMIN)
  @Mutation(() => Faq)
  public deleteFaq(@Args('faqId', { type: () => String }) faqId: string): Promise<Faq> {
    return this.faqService.deleteFaq(faqId);
  }
}
