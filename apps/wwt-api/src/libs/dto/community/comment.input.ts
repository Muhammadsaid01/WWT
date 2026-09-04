import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';
import { CommentStatus } from '../../enums/community.enum';

@InputType()
export class CommentInput {
  @IsNotEmpty()
  @Field(() => String)
  articleId: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  parentCommentId?: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 2000)
  @Field(() => String)
  commentContent: string;
}

@InputType()
class CISearch {
  @IsOptional()
  @Field(() => String, { nullable: true })
  parentCommentId?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  articleId?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  memberId?: string;

  @IsOptional()
  @IsEnum(CommentStatus)
  @Field(() => CommentStatus, { nullable: true })
  commentStatus?: CommentStatus;
}

@InputType()
export class CommentsInquiry {
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
  @Field(() => CISearch, { nullable: true })
  search?: CISearch;
}

@InputType()
export class UpdateCommentStatusInput {
  @IsNotEmpty()
  @Field(() => String)
  commentId: string;

  @IsNotEmpty()
  @IsEnum(CommentStatus)
  @Field(() => CommentStatus)
  commentStatus: CommentStatus;
}
