import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { ArticleCategory } from '../../enums/community.enum';

@InputType()
export class BoardArticleUpdate {
  @IsOptional()
  @IsEnum(ArticleCategory)
  @Field(() => ArticleCategory, { nullable: true })
  articleCategory?: ArticleCategory;

  @IsOptional()
  @IsString()
  @Length(3, 200)
  @Field(() => String, { nullable: true })
  articleTitle?: string;

  @IsOptional()
  @IsString()
  @Length(10, 10000)
  @Field(() => String, { nullable: true })
  articleContent?: string;

  @IsOptional()
  @Field(() => [String], { nullable: true })
  articleImages?: string[];
}
