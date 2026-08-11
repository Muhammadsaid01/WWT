import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';
import { FaqCategory } from '../../enums/faq.enum';

@InputType()
export class FaqInput {
  @IsNotEmpty()
  @IsEnum(FaqCategory)
  @Field(() => FaqCategory)
  faqCategory: FaqCategory;

  @IsNotEmpty()
  @IsString()
  @Length(3, 300)
  @Field(() => String)
  faqQuestion: string;

  @IsNotEmpty()
  @IsString()
  @Length(5, 5000)
  @Field(() => String)
  faqAnswer: string;

  @IsOptional()
  @Min(0)
  @Field(() => Int, { nullable: true })
  faqOrder?: number;
}

@InputType()
class FaqSearch {
  @IsOptional()
  @IsEnum(FaqCategory)
  @Field(() => FaqCategory, { nullable: true })
  faqCategory?: FaqCategory;

  @IsOptional()
  @Field(() => String, { nullable: true })
  text?: string;
}

@InputType()
export class FaqsInquiry {
  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  page: number;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  limit: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  sort?: string;

  @IsOptional()
  @Field(() => Direction, { nullable: true })
  direction?: Direction;

  @IsOptional()
  @Field(() => FaqSearch, { nullable: true })
  search?: FaqSearch;
}
