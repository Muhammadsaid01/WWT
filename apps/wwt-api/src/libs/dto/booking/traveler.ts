import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { TravelerGender } from '../../enums/traveler.enum';

@ObjectType()
export class Traveler {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  bookingId: ObjectId;

  @Field(() => String)
  firstName: string;

  @Field(() => String)
  lastName: string;

  @Field(() => Date)
  dateOfBirth: Date;

  @Field(() => TravelerGender)
  gender: TravelerGender;

  @Field(() => String)
  nationality: string;

  @Field(() => String)
  passportNumber: string;

  @Field(() => Date)
  passportExpireDate: Date;

  @Field(() => Date, { nullable: true })
  travelerDeletedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
