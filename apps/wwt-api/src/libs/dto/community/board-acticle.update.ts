import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ObjectId } from 'mongoose';
import { ArticleCategory, ArticleStatus } from '../../enums/community.enum';

@InputType()
export class BoardArticleUpdate {
  @IsNotEmpty()
  @Field(() => String)
  _id: ObjectId;

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

  @IsOptional()
  @IsEnum(ArticleStatus)
  @Field(() => ArticleStatus, { nullable: true })
  articleStatus?: ArticleStatus;
}
