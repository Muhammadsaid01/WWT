import { Types, type ObjectId } from 'mongoose';

jest.mock('uuid', () => ({ v4: () => 'coupon-service-test-uuid' }));

import { CouponService } from './coupon.service';
import { CouponType } from '../../libs/enums/coupon.enum';

const objectId = () => new Types.ObjectId() as unknown as ObjectId;

describe('CouponService', () => {
  it('rejects a whitespace-only coupon code before querying or writing', async () => {
    const couponModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };
    const service = new CouponService(couponModel as any, {} as any);

    await expect(service.createCoupon({ couponCode: '   ' } as any)).rejects.toThrow(
      'Coupon code is required.',
    );
    expect(couponModel.findOne).not.toHaveBeenCalled();
    expect(couponModel.create).not.toHaveBeenCalled();
  });

  it('normalizes duplicate checks and preserves the optional description on create', async () => {
    const couponModel = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
    };
    const service = new CouponService(couponModel as any, {} as any);

    await service.createCoupon({
      couponCode: ' save10 ',
      couponTitle: ' Save ten ',
      couponDesc: '  Ten dollars off  ',
      couponType: CouponType.FIXED,
      couponValue: 10,
      perUserLimit: 1,
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T00:00:00.000Z',
    });

    expect(couponModel.findOne).toHaveBeenCalledWith({
      couponCode: 'SAVE10',
      couponDeletedAt: null,
    });
    expect(couponModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        couponCode: 'SAVE10',
        couponDesc: 'Ten dollars off',
      }),
    );
  });

  it('requires a maximum discount when changing a fixed coupon to percent', async () => {
    const couponModel = {
      findOne: jest.fn().mockResolvedValue({
        validFrom: new Date('2026-01-01T00:00:00.000Z'),
        validUntil: new Date('2026-12-31T00:00:00.000Z'),
        couponType: CouponType.FIXED,
        couponValue: 10,
        maxDiscount: null,
        usedCount: 0,
      }),
      findOneAndUpdate: jest.fn(),
    };
    const service = new CouponService(couponModel as any, {} as any);

    await expect(
      service.updateCoupon(objectId(), { couponType: CouponType.PERCENT } as any),
    ).rejects.toThrow('Maximum discount is required for percentage coupons.');
    expect(couponModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('does not expose an exhausted coupon through the public single-coupon lookup', async () => {
    const queryResult: any = {
      lean: () => queryResult,
      exec: jest.fn().mockResolvedValue({
        couponCode: 'SAVE10',
        couponTitle: 'Save ten',
        couponType: CouponType.FIXED,
        couponValue: 10,
        minAmount: 0,
        validUntil: new Date('2026-12-31T00:00:00.000Z'),
      }),
    };
    const couponModel = {
      findOne: jest.fn().mockReturnValue(queryResult),
    };
    const service = new CouponService(couponModel as any, {} as any);

    await service.getPublicCoupon(' save10 ');

    expect(couponModel.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        couponCode: 'SAVE10',
        $expr: {
          $or: [{ $eq: ['$usageLimit', 0] }, { $lt: ['$usedCount', '$usageLimit'] }],
        },
      }),
    );
  });
});
