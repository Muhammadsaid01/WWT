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

export enum FaqStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

registerEnumType(FaqCategory, {
  name: 'FaqCategory',
});

registerEnumType(FaqStatus, {
  name: 'FaqStatus',
});
