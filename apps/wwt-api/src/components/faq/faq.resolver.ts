import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Faq, Faqs } from '../../libs/dto/system/faq';
import { FaqInput, FaqsInquiry } from '../../libs/dto/system/faq.input';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { FaqService } from './faq.service';

@Resolver()
export class FaqResolver {
  constructor(private readonly faqService: FaqService) {}

  @UseGuards(RolesGuard)
  @Roles(MemberType.ADMIN)
  @Mutation(() => Faq)
  public async createFaq(
    @Args('input') input: FaqInput,
    @AuthMember('_id') adminId: ObjectId,
  ): Promise<Faq> {
    console.log('Mutation: createFaq');

    return await this.faqService.createFaq(adminId, input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Faqs)
  public async getFaqs(@Args('input') input: FaqsInquiry): Promise<Faqs> {
    console.log('Query: getFaqs');

    return this.faqService.getFaqs(input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Faq)
  public async getFaq(
    @Args('faqId', { type: () => String })
    faqId: string,
  ): Promise<Faq> {
    console.log('Query: getFaq');

    return this.faqService.getFaq(shapeIntoMongoObjectId(faqId));
  }

  @UseGuards(RolesGuard)
  @Roles(MemberType.ADMIN)
  @Mutation(() => Faq)
  public async deleteFaq(
    @Args('faqId', { type: () => String })
    faqId: string,
  ): Promise<Faq> {
    console.log('Mutation: deleteFaq');

    return this.faqService.deleteFaq(shapeIntoMongoObjectId(faqId));
  }
}
