import { registerEnumType } from '@nestjs/graphql';

export enum CouponType {
  FIXED = 'FIXED',
  PERCENT = 'PERCENT',
}

registerEnumType(CouponType, {
  name: 'CouponType',
});

export enum CouponStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  DISABLED = 'DISABLED',
}

registerEnumType(CouponStatus, {
  name: 'CouponStatus',
});
