import { Field, InputType, Int } from '@nestjs/graphql';
import { IsMongoId, IsNotEmpty, IsString, Length, Min } from 'class-validator';
import { ObjectId } from 'mongoose';

@InputType()
export class ItineraryInput {
  @IsNotEmpty()
  @Field(() => String)
  packageId: ObjectId;

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

@InputType()
export class DeleteItineraryInput {
  @IsMongoId()
  @Field(() => String)
  _id: ObjectId;
}
