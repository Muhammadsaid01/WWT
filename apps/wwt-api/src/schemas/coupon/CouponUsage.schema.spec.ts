import CouponUsageSchema from './CouponUsage.schema';

describe('CouponUsage schema indexes', () => {
  it('allows repeated coupon/member pairs while preventing duplicate booking usage', () => {
    const indexes = CouponUsageSchema.indexes();
    const legacyIndex = indexes.find(
      ([fields]) => fields.couponId === 1 && fields.memberId === 1 && !fields.bookingId,
    );
    const intendedIndex = indexes.find(
      ([fields]) => fields.couponId === 1 && fields.memberId === 1 && fields.bookingId === 1,
    );

    expect(legacyIndex).toBeUndefined();
    expect(intendedIndex?.[1].unique).toBe(true);
  });
});
