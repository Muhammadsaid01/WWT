import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString, Length, Min } from 'class-validator';
import { FaqCategory } from '../../enums/faq.enum';

@InputType()
export class FaqUpdate {
  @IsOptional()
  @IsEnum(FaqCategory)
  @Field(() => FaqCategory, { nullable: true })
  faqCategory?: FaqCategory;

  @IsOptional()
  @IsString()
  @Length(3, 300)
  @Field(() => String, { nullable: true })
  faqQuestion?: string;

  @IsOptional()
  @IsString()
  @Length(5, 5000)
  @Field(() => String, { nullable: true })
  faqAnswer?: string;

  @IsOptional()
  @Min(0)
  @Field(() => Int, { nullable: true })
  faqOrder?: number;
}
