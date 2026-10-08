import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { FaqCategory, FaqStatus } from '../../enums/faq.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class Faq {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  adminId: ObjectId;

  @Field(() => FaqCategory)
  faqCategory: FaqCategory;

  @Field(() => FaqStatus)
  faqStatus: FaqStatus;

  @Field(() => String)
  faqQuestion: string;

  @Field(() => String)
  faqAnswer: string;

  @Field(() => Int)
  faqOrder: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class Faqs {
  @Field(() => [Faq])
  list: Faq[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
