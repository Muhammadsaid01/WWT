import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDateString, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';

@InputType()
export class TravelMatePostUpdate {
  @IsNotEmpty()
  @Field(() => String)
  _id: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  departureCountry?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  departureCity?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  destinationCountry?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  destinationCity?: string;

  @IsOptional()
  @IsDateString()
  @Field(() => String, { nullable: true })
  travelDate?: string;

  @IsOptional()
  @Min(2)
  @Field(() => Int, { nullable: true })
  maxMembers?: number;

  @IsOptional()
  @IsString()
  @Length(3, 200)
  @Field(() => String, { nullable: true })
  matePostTitle?: string;

  @IsOptional()
  @IsString()
  @Length(10, 5000)
  @Field(() => String, { nullable: true })
  matePostContent?: string;
}
