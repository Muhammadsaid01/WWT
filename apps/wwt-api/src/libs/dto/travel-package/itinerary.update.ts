import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, IsString, Length, Min } from 'class-validator';

@InputType()
export class ItineraryUpdate {
  @IsOptional()
  @Min(1)
  @Field(() => Int, { nullable: true })
  dayNumber?: number;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  @Field(() => String, { nullable: true })
  title?: string;

  @IsOptional()
  @IsString()
  @Length(5, 2000)
  @Field(() => String, { nullable: true })
  description?: string;
}
