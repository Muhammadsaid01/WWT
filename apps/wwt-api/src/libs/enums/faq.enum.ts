import { registerEnumType } from '@nestjs/graphql';

export enum FaqCategory {
  GENERAL = 'GENERAL',
  ACCOUNT = 'ACCOUNT',
  BOOKING = 'BOOKING',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  AGENT = 'AGENT',
  PACKAGE = 'PACKAGE',
  TRAVEL_MATE = 'TRAVEL_MATE',
}

registerEnumType(FaqCategory, {
  name: 'FaqCategory',
});
