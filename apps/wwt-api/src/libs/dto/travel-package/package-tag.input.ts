import { Field, InputType } from '@nestjs/graphql';
import { IsMongoId, IsNotEmpty, IsString, Length } from 'class-validator';
import { ObjectId } from 'mongoose';

@InputType()
export class PackageTagInput {
  @IsNotEmpty()
  @Field(() => String)
  packageId: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  @Field(() => String)
  tagName: string;
}

@InputType()
export class DeletePackageTagInput {
  @IsMongoId()
  @Field(() => String)
  _id: ObjectId;
}
