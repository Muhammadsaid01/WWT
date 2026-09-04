import { registerEnumType } from '@nestjs/graphql';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

registerEnumType(BookingStatus, {
  name: 'BookingStatus',
});
