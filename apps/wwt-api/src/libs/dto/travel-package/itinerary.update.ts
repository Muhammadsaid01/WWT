import { Field, InputType, Int } from '@nestjs/graphql';
import { IsMongoId, IsOptional, IsString, Length, Min } from 'class-validator';
import { ObjectId } from 'mongoose';

@InputType()
export class ItineraryUpdate {
  @IsMongoId()
  @Field(() => String)
  _id: ObjectId;

  @IsMongoId()
  @Field(() => String)
  packageId: ObjectId;

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
