import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { NoticeStatus } from '../../enums/notice.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class Notice {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  adminId: ObjectId;

  @Field(() => String)
  noticeTitle: string;

  @Field(() => String)
  noticeContent: string;

  @Field(() => [String])
  noticeImages: string[];

  @Field(() => Int)
  noticeViewCount: number;

  @Field(() => Boolean)
  noticePinned: boolean;

  @Field(() => NoticeStatus)
  noticeStatus: NoticeStatus;

  @Field(() => Date, { nullable: true })
  noticeDeletedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class Notices {
  @Field(() => [Notice])
  list: Notice[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
