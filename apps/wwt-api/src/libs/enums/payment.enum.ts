import { registerEnumType } from '@nestjs/graphql';

export enum PaymentMethod {
  CARD = 'CARD',
  KAKAOPAY = 'KAKAOPAY',
  TOSSPAY = 'TOSSPAY',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
}
registerEnumType(PaymentMethod, {
  name: 'PaymentMethod',
});
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}
registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
});
