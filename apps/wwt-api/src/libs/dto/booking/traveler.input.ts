import { Field, InputType, OmitType } from '@nestjs/graphql';
import { IsDateString, IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { TravelerGender } from '../../enums/traveler.enum';

@InputType()
export class TravelerInput {
  @IsNotEmpty()
  @Field(() => String)
  bookingId: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  @Field(() => String)
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  @Field(() => String)
  lastName: string;

  @IsNotEmpty()
  @IsDateString()
  @Field(() => String)
  dateOfBirth: string;

  @IsNotEmpty()
  @IsEnum(TravelerGender)
  @Field(() => TravelerGender)
  gender: TravelerGender;

  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  nationality: string;

  @IsNotEmpty()
  @IsString()
  @Field(() => String)
  passportNumber: string;

  @IsNotEmpty()
  @IsDateString()
  @Field(() => String)
  passportExpireDate: string;
}

@InputType()
export class BookingTravelerInput extends OmitType(TravelerInput, ['bookingId'] as const) {}
