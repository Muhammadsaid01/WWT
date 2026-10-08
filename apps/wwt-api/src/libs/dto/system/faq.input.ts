import { Field, InputType, Int } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Direction } from '../../enums/common.enum';
import { FaqCategory, FaqStatus } from '../../enums/faq.enum';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

@InputType()
export class FaqInput {
  @IsEnum(FaqCategory)
  @Field(() => FaqCategory)
  faqCategory: FaqCategory;

  @IsOptional()
  @IsEnum(FaqStatus)
  @Field(() => FaqStatus, { nullable: true })
  faqStatus?: FaqStatus;

  @Transform(trim)
  @IsNotEmpty()
  @IsString()
  @Length(3, 300)
  @Field(() => String)
  faqQuestion: string;

  @Transform(trim)
  @IsNotEmpty()
  @IsString()
  @Length(5, 5000)
  @Field(() => String)
  faqAnswer: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  @Field(() => Int, { nullable: true })
  faqOrder?: number;
}

@InputType()
export class FaqUpdate {
  @IsMongoId()
  @Field(() => String)
  _id: string;

  @IsOptional()
  @IsEnum(FaqCategory)
  @Field(() => FaqCategory, { nullable: true })
  faqCategory?: FaqCategory;

  @IsOptional()
  @IsEnum(FaqStatus)
  @Field(() => FaqStatus, { nullable: true })
  faqStatus?: FaqStatus;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @Length(3, 300)
  @Field(() => String, { nullable: true })
  faqQuestion?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @Length(5, 5000)
  @Field(() => String, { nullable: true })
  faqAnswer?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
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
  @IsEnum(FaqStatus)
  @Field(() => FaqStatus, { nullable: true })
  faqStatus?: FaqStatus;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @Length(1, 200)
  @Field(() => String, { nullable: true })
  text?: string;
}

@InputType()
export class FaqsInquiry {
  @IsInt()
  @Min(1)
  @Field(() => Int)
  page: number;

  @IsInt()
  @Min(1)
  @Max(100)
  @Field(() => Int)
  limit: number;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  sort?: string;

  @IsOptional()
  @IsEnum(Direction)
  @Field(() => Direction, { nullable: true })
  direction?: Direction;

  @IsOptional()
  @Field(() => FaqSearch, { nullable: true })
  search?: FaqSearch;
}
