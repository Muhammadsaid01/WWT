import { registerEnumType } from '@nestjs/graphql';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
  REJECTED = 'REJECTED',
}

registerEnumType(BookingStatus, {
  name: 'BookingStatus',
});
