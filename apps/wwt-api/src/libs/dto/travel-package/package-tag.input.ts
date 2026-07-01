import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Length } from 'class-validator';

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
