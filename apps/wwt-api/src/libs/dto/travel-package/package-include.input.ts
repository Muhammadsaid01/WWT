import { Field, InputType } from '@nestjs/graphql';
import { IsMongoId, IsNotEmpty, IsString, Length } from 'class-validator';
import { ObjectId } from 'mongoose';

@InputType()
export class PackageIncludeInput {
  @IsNotEmpty()
  @Field(() => String)
  packageId: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 200)
  @Field(() => String)
  content: string;
}

@InputType()
export class DeletePackageIncludeInput {
  @IsMongoId()
  @Field(() => String)
  _id: ObjectId;
}
