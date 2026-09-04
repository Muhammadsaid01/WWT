import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, Length } from 'class-validator';

@InputType()
export class PackagePolicyUpdate {
  @IsOptional()
  @IsString()
  @Length(10, 3000)
  @Field(() => String, { nullable: true })
  cancelPolicy?: string;

  @IsOptional()
  @IsString()
  @Length(10, 3000)
  @Field(() => String, { nullable: true })
  refundPolicy?: string;
}
