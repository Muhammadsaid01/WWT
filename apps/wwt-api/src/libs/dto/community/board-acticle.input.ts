import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';
import { ArticleCategory, ArticleStatus } from '../../enums/community.enum';

@InputType()
export class BoardArticleInput {
  @IsNotEmpty()
  @IsEnum(ArticleCategory)
  @Field(() => ArticleCategory)
  articleCategory: ArticleCategory;

  @IsNotEmpty()
  @IsString()
  @Length(3, 200)
  @Field(() => String)
  articleTitle: string;

  @IsNotEmpty()
  @IsString()
  @Length(10, 10000)
  @Field(() => String)
  articleContent: string;

  @IsOptional()
  @Field(() => [String], { nullable: true })
  articleImages?: string[];
}

@InputType()
class BASearch {
  @IsOptional()
  @Field(() => String, { nullable: true })
  articleId?: string;

  @IsOptional()
  @IsEnum(ArticleCategory)
  @Field(() => ArticleCategory, { nullable: true })
  articleCategory?: ArticleCategory;

  @IsOptional()
  @IsEnum(ArticleStatus)
  @Field(() => ArticleStatus, { nullable: true })
  articleStatus?: ArticleStatus;

  @IsOptional()
  @Field(() => String, { nullable: true })
  memberId?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  text?: string;
}

@InputType()
export class BoardArticlesInquiry {
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
  @Field(() => BASearch, { nullable: true })
  search?: BASearch;
}

@InputType()
export class UpdateArticleStatusInput {
  @IsNotEmpty()
  @Field(() => String)
  articleId: string;

  @IsNotEmpty()
  @IsEnum(ArticleStatus)
  @Field(() => ArticleStatus)
  articleStatus: ArticleStatus;
}
