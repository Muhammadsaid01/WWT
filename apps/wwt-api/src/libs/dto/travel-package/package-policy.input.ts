import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Length } from 'class-validator';

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
