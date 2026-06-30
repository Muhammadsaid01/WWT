import { registerEnumType } from '@nestjs/graphql';

//Traveler enum
export enum TravelerGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

registerEnumType(TravelerGender, {
  name: 'TravelerGender',
});
