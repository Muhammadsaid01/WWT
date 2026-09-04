import { Field, InputType } from '@nestjs/graphql';
import { IsMongoId, IsNotEmpty, IsString, Length } from 'class-validator';
import { ObjectId } from 'mongoose';

@InputType()
export class PackagePolicyInput {
  @IsNotEmpty()
  @Field(() => String)
  packageId: string;

  @IsNotEmpty()
  @IsString()
  @Length(10, 3000)
  @Field(() => String)
  cancelPolicy: string;

  @IsNotEmpty()
  @IsString()
  @Length(10, 3000)
  @Field(() => String)
  refundPolicy: string;
}

@InputType()
export class DeletePackagePolicyInput {
  @IsMongoId()
  @Field(() => String)
  _id: ObjectId;
}
