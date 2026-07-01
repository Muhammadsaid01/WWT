import { Field, InputType } from '@nestjs/graphql';
import { IsDateString, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { TravelerGender } from '../../enums/traveler.enum';

@InputType()
export class TravelerUpdate {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  @Field(() => String, { nullable: true })
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  @Field(() => String, { nullable: true })
  lastName?: string;

  @IsOptional()
  @IsDateString()
  @Field(() => String, { nullable: true })
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(TravelerGender)
  @Field(() => TravelerGender, { nullable: true })
  gender?: TravelerGender;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  nationality?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  passportNumber?: string;

  @IsOptional()
  @IsDateString()
  @Field(() => String, { nullable: true })
  passportExpireDate?: string;
}
