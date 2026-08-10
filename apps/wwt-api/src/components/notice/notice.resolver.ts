import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Notice, Notices } from '../../libs/dto/system/notice';
import { NoticeInput, NoticesInquiry } from '../../libs/dto/system/notice.input';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { NoticeService } from './notice.service';

@Resolver()
export class NoticeResolver {
  constructor(private readonly noticeService: NoticeService) {}

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Notice)
  public async createNotice(
    @Args('input') input: NoticeInput,
    @AuthMember('_id') adminId: ObjectId,
  ): Promise<Notice> {
    console.log('Mutation: createNotice');

    return await this.noticeService.createNotice(adminId, input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Notices)
  public async getNotices(@Args('input') input: NoticesInquiry): Promise<Notices> {
    console.log('Query: getNotices');

    return this.noticeService.getNotices(input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Notice)
  public async getNotice(
    @Args('noticeId', { type: () => String })
    noticeId: string,
    @AuthMember('_id') memberId?: ObjectId,
  ): Promise<Notice> {
    console.log('Query: getNotice');

    return this.noticeService.getNotice(memberId ?? null, shapeIntoMongoObjectId(noticeId));
  }

  @UseGuards(RolesGuard)
  @Roles(MemberType.ADMIN)
  @Mutation(() => Notice)
  public async deleteNotice(
    @Args('noticeId', { type: () => String })
    noticeId: string,
  ): Promise<Notice> {
    console.log('Mutation: deleteNotice');

    return this.noticeService.deleteNotice(shapeIntoMongoObjectId(noticeId));
  }
}
