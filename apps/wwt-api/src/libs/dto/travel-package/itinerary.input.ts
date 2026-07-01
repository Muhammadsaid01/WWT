import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Length, Min } from 'class-validator';

@InputType()
export class ItineraryInput {
  @IsNotEmpty()
  @Field(() => String)
  packageId: string;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  dayNumber: number;

  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  @Field(() => String)
  title: string;

  @IsNotEmpty()
  @IsString()
  @Length(5, 2000)
  @Field(() => String)
  description: string;
}
