import { registerEnumType } from '@nestjs/graphql';

export enum FaqCategory {
  GENERAL = 'GENERAL',
  ACCOUNT = 'ACCOUNT',
  BOOKING = 'BOOKING',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  AGENT = 'AGENT',
  PACKAGE = 'PACKAGE',
}

registerEnumType(FaqCategory, {
  name: 'FaqCategory',
});
export enum FaqStatus {
  ACTIVE = 'ACTIVE',
  HIDDEN = 'HIDDEN',
  DELETED = 'DELETED',
}

registerEnumType(FaqStatus, {
  name: 'FaqStatus',
});
