import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Length } from 'class-validator';

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
