import { Field, InputType } from '@nestjs/graphql';
import { IsMongoId, IsNotEmpty, IsString, Length } from 'class-validator';
import { ObjectId } from 'mongoose';

@InputType()
export class PackageExcludeInput {
  @IsNotEmpty()
  @Field(() => String)
  packageId: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 200)
  @Field(() => String)
  title: string;
}

@InputType()
export class DeletePackageExcludeInput {
  @IsMongoId()
  @Field(() => String)
  _id: ObjectId;
}
