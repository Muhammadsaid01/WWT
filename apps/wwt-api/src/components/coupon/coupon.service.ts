import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, ObjectId } from 'mongoose';
import {
  lookupUsageBooking,
  lookupUsageCoupon,
  lookupUsageMember,
  unwindUsageBooking,
  unwindUsageCoupon,
  unwindUsageMember,
} from '../../libs/config';
import {
  Coupon,
  Coupons,
  CouponValidation,
  PublicCoupon,
  PublicCoupons,
} from '../../libs/dto/coupon/coupon';
import { CouponUsage, CouponUsages } from '../../libs/dto/coupon/coupon-usage';
import { CouponUsageInquiry } from '../../libs/dto/coupon/coupon-usage.input';
import {
  CouponInput,
  CouponInquiry,
  ValidateCouponInput,
} from '../../libs/dto/coupon/coupon.input';
import { CouponUpdate } from '../../libs/dto/coupon/coupon.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CouponStatus, CouponType } from '../../libs/enums/coupon.enum';

@Injectable()
export class CouponService {
  constructor(
    @InjectModel('Coupon')
    private readonly couponModel: Model<Coupon>,

    @InjectModel('CouponUsage')
    private readonly couponUsageModel: Model<CouponUsage>,
  ) {}

  public async createCoupon(input: CouponInput): Promise<Coupon> {
    const couponCode = input.couponCode.trim().toUpperCase();
    // coupon code unique
    const existingCoupon = await this.couponModel.findOne({
      couponCode: input.couponCode,
      couponDeletedAt: null,
    });

    if (existingCoupon) {
      throw new BadRequestException('Coupon code already exists.');
    }

    // date validation
    if (new Date(input.validFrom) >= new Date(input.validUntil)) {
      throw new BadRequestException('Start date must be before end date.');
    }

    // discount validation
    if (input.couponValue <= 0) {
      throw new BadRequestException('Discount value must be greater than zero.');
    }

    // percent coupon validation
    if (input.couponType === CouponType.PERCENT) {
      if (input.couponValue > 100) {
        throw new BadRequestException('Percentage discount cannot exceed 100%.');
      }

      if (input.maxDiscount === undefined || input.maxDiscount === null) {
        throw new BadRequestException('Maximum discount is required for percentage coupons.');
      }
    }

    return await this.couponModel.create({
      couponCode,
      couponTitle: input.couponTitle.trim(),

      couponType: input.couponType,

      couponValue: input.couponValue,
      minAmount: input.minAmount,
      maxDiscount: input.maxDiscount,

      usageLimit: input.usageLimit,
      usedCount: 0,
      perUserLimit: input.perUserLimit,

      validFrom: new Date(input.validFrom),
      validUntil: new Date(input.validUntil),

      isActive: true,
    });
  }

  public async getAllCoupons(input: CouponInquiry): Promise<Coupons> {
    const match: Record<string, any> = {
      couponDeletedAt: null,
    };

    const search = input.search;

    if (search?.text?.trim()) {
      const keyword = search.text.trim();

      match.$or = [
        {
          couponCode: {
            $regex: keyword,
            $options: 'i',
          },
        },
        {
          couponTitle: {
            $regex: keyword,
            $options: 'i',
          },
        },
        {
          couponDesc: {
            $regex: keyword,
            $options: 'i',
          },
        },
      ];
    }

    if (search?.couponType) {
      match.couponType = search.couponType;
    }

    if (search?.couponStatus) {
      match.couponStatus = search.couponStatus;
    }

    const result = await this.couponPagination(match, input);
    return result;
  }

  public async getCoupon(couponId: ObjectId): Promise<Coupon> {
    const coupon = await this.couponModel
      .findOne({
        _id: couponId,
        couponDeletedAt: null,
      })
      .lean()
      .exec();

    if (!coupon) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return coupon;
  }

  public async updateCoupon(couponId: ObjectId, input: CouponUpdate): Promise<Coupon> {
    const coupon = await this.couponModel.findOne({
      _id: couponId,
      couponDeletedAt: null,
    });

    if (!coupon) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    // Date validation
    const validFrom = input.validFrom ? new Date(input.validFrom) : coupon.validFrom;

    const validUntil = input.validUntil ? new Date(input.validUntil) : coupon.validUntil;

    if (validFrom >= validUntil) {
      throw new BadRequestException('Valid from must be before valid until.');
    }

    // Coupon value validation
    const couponType = input.couponType ?? coupon.couponType;

    const couponValue = input.couponValue ?? coupon.couponValue;

    if (couponValue <= 0) {
      throw new BadRequestException('Coupon value must be greater than zero.');
    }

    if (couponType === CouponType.PERCENT && couponValue > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%.');
    }

    // Usage limit validation
    if (input.usageLimit !== undefined && input.usageLimit < coupon.usedCount) {
      throw new BadRequestException('Usage limit cannot be less than used count.');
    }

    // Percent coupon requires maxDiscount
    if (
      couponType === CouponType.PERCENT &&
      input.maxDiscount !== undefined &&
      input.maxDiscount <= 0
    ) {
      throw new BadRequestException('Maximum discount must be greater than zero.');
    }

    // Prepare update object
    const updateData: Record<string, any> = {
      ...input,
    };

    // couponId update qilinmaydi
    delete updateData.couponId;

    // Date conversion
    if (input.validFrom) {
      updateData.validFrom = new Date(input.validFrom);
    }

    if (input.validUntil) {
      updateData.validUntil = new Date(input.validUntil);
    }

    // FIXED coupon uchun maxDiscount kerak emas
    if (couponType === CouponType.FIXED) {
      updateData.maxDiscount = null;
    }

    const updatedCoupon = await this.couponModel.findOneAndUpdate(
      {
        _id: couponId,
        couponDeletedAt: null,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedCoupon) {
      throw new BadRequestException(Message.UPDATE_FAILED);
    }

    return updatedCoupon;
  }

  public async deleteCoupon(couponId: ObjectId): Promise<Coupon> {
    const coupon = await this.couponModel.findOne({
      _id: couponId,
      couponDeletedAt: null,
    });

    if (!coupon) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const deletedCoupon = await this.couponModel.findOneAndUpdate(
      {
        _id: couponId,
        couponDeletedAt: null,
      },
      {
        $set: {
          couponDeletedAt: new Date(),
        },
      },
      {
        new: true,
      },
    );

    if (!deletedCoupon) {
      throw new BadRequestException(Message.DELETE_FAILED);
    }

    return deletedCoupon;
  }

  public async validateCoupon(
    memberId: ObjectId,
    input: ValidateCouponInput,
  ): Promise<CouponValidation> {
    const coupon = await this.findValidCoupon(memberId, input.couponCode, input.bookingAmount);

    const discountAmount = this.calculateDiscount(coupon, input.bookingAmount);

    const finalPrice = Math.max(input.bookingAmount - discountAmount, 0);

    return {
      valid: true,
      couponId: coupon._id.toString(),
      couponCode: coupon.couponCode,
      discountAmount,
      finalPrice,
      message: 'Coupon is valid.',
    };
  }

  public async getMyCouponUsages(
    memberId: ObjectId,
    input: CouponUsageInquiry,
  ): Promise<CouponUsages> {
    const sortField = input.sort ?? 'createdAt';

    const sortDirection = input.direction === Direction.ASC ? 1 : -1;

    const result = await this.couponUsageModel.aggregate([
      {
        $match: {
          memberId,
        },
      },
      {
        $facet: {
          list: [
            {
              $sort: {
                [sortField]: sortDirection,
              },
            },
            {
              $skip: (input.page - 1) * input.limit,
            },
            {
              $limit: input.limit,
            },

            lookupUsageCoupon,
            unwindUsageCoupon,

            lookupUsageBooking,
            unwindUsageBooking,
          ],

          metaCounter: [
            {
              $count: 'total',
            },
          ],
        },
      },
    ]);

    return {
      list: result[0]?.list ?? [],
      metaCounter: result[0]?.metaCounter ?? [],
    };
  }

  public async getCouponUsages(
    couponId: ObjectId,
    input: CouponUsageInquiry,
  ): Promise<CouponUsages> {
    const targetCoupon = await this.couponModel
      .findOne({
        _id: couponId,
        couponDeletedAt: null,
      })
      .lean()
      .exec();

    if (!targetCoupon) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const sortField = input.sort ?? 'createdAt';

    const sortDirection = input.direction === Direction.ASC ? 1 : -1;

    const result = await this.couponUsageModel.aggregate([
      {
        $match: {
          couponId,
        },
      },
      {
        $facet: {
          list: [
            {
              $sort: {
                [sortField]: sortDirection,
              },
            },
            {
              $skip: (input.page - 1) * input.limit,
            },
            {
              $limit: input.limit,
            },

            lookupUsageCoupon,
            unwindUsageCoupon,

            lookupUsageBooking,
            unwindUsageBooking,

            lookupUsageMember,
            unwindUsageMember,
          ],

          metaCounter: [
            {
              $count: 'total',
            },
          ],
        },
      },
    ]);

    return {
      list: result[0]?.list ?? [],
      metaCounter: result[0]?.metaCounter ?? [],
    };
  }

  public async getPublicCoupons(input: CouponInquiry): Promise<PublicCoupons> {
    const now = new Date();

    const match: Record<string, any> = {
      couponDeletedAt: null,
      couponStatus: CouponStatus.ACTIVE,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $expr: {
        $or: [{ $eq: ['$usageLimit', 0] }, { $lt: ['$usedCount', '$usageLimit'] }],
      },
    };

    return this.couponPagination(match, input);
  }

  public async getPublicCoupon(couponCode: string): Promise<PublicCoupon> {
    const now = new Date();

    const coupon = await this.couponModel
      .findOne({
        couponCode: couponCode.trim().toUpperCase(),
        couponDeletedAt: null,
        couponStatus: CouponStatus.ACTIVE,
        validFrom: { $lte: now },
        validUntil: { $gte: now },
      })
      .lean()
      .exec();

    if (!coupon) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return {
      couponCode: coupon.couponCode,
      couponTitle: coupon.couponTitle,
      couponDesc: coupon.couponDesc,
      couponType: coupon.couponType,
      couponValue: coupon.couponValue,
      minAmount: coupon.minAmount,
      maxDiscount: coupon.maxDiscount,
      validUntil: coupon.validUntil,
    };
  }
  //Helper

  private async couponPagination(
    match: Record<string, any>,
    input: CouponInquiry,
  ): Promise<Coupons> {
    const { page, limit } = input;

    const sortField = input.sort ?? 'createdAt';
    const sortDirection = input.direction === Direction.ASC ? 1 : -1;

    const result = await this.couponModel.aggregate([
      {
        $match: match,
      },
      {
        $facet: {
          list: [
            {
              $sort: {
                [sortField]: sortDirection,
              },
            },
            {
              $skip: (page - 1) * limit,
            },
            {
              $limit: limit,
            },
          ],
          metaCounter: [
            {
              $count: 'total',
            },
          ],
        },
      },
    ]);

    return {
      list: result[0]?.list ?? [],
      metaCounter: result[0]?.metaCounter ?? [],
    };
  }

  private async findValidCoupon(
    memberId: ObjectId,
    couponCode: string,
    bookingAmount: number,
    session?: ClientSession,
  ): Promise<Coupon> {
    const normalizedCode = couponCode.trim().toUpperCase();

    const coupon = await this.couponModel
      .findOne({
        couponCode: normalizedCode,
        couponStatus: CouponStatus.ACTIVE,
        couponDeletedAt: null,
      })
      .session(session ?? null)
      .lean()
      .exec();

    if (!coupon) {
      throw new BadRequestException('Coupon not found or inactive.');
    }

    const now = new Date();

    if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) {
      throw new BadRequestException('Coupon is not currently valid.');
    }

    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit has been reached.');
    }

    if (bookingAmount < coupon.minAmount) {
      throw new BadRequestException(`Minimum booking amount is ${coupon.minAmount}.`);
    }

    const memberUsageCount = await this.couponUsageModel
      .countDocuments({
        couponId: coupon._id,
        memberId,
      })
      .session(session ?? null);

    if (memberUsageCount >= coupon.perUserLimit) {
      throw new BadRequestException('You have reached the usage limit for this coupon.');
    }

    return coupon;
  }

  private calculateDiscount(coupon: Coupon, bookingAmount: number): number {
    let discountAmount = 0;

    if (coupon.couponType === CouponType.PERCENT) {
      discountAmount = (bookingAmount * coupon.couponValue) / 100;

      if (coupon.maxDiscount !== null && coupon.maxDiscount !== undefined) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    }

    if (coupon.couponType === CouponType.FIXED) {
      discountAmount = coupon.couponValue;
    }

    return Math.min(Math.max(discountAmount, 0), bookingAmount);
  }

  public async applyCoupon(
    memberId: ObjectId,
    couponCode: string,
    bookingAmount: number,
    session?: ClientSession,
  ): Promise<{
    couponId: ObjectId;
    discountAmount: number;
    finalPrice: number;
  }> {
    const coupon = await this.findValidCoupon(memberId, couponCode, bookingAmount, session);

    const discountAmount = this.calculateDiscount(coupon, bookingAmount);

    const finalPrice = Math.max(bookingAmount - discountAmount, 0);

    return {
      couponId: coupon._id,
      discountAmount,
      finalPrice,
    };
  }

  public async createCouponUsage(
    input: {
      couponId: ObjectId;
      memberId: ObjectId;
      bookingId: ObjectId;
      discountAmount: number;
    },
    session?: ClientSession,
  ): Promise<CouponUsage> {
    const existingUsage = await this.couponUsageModel
      .findOne({
        couponId: input.couponId,
        memberId: input.memberId,
        bookingId: input.bookingId,
      })
      .session(session ?? null);

    if (existingUsage) {
      throw new BadRequestException('Coupon usage already exists for this booking.');
    }

    const [result] = await this.couponUsageModel.create(
      [
        {
          couponId: input.couponId,
          memberId: input.memberId,
          bookingId: input.bookingId,
          discountAmount: input.discountAmount,
          usedAt: new Date(),
        },
      ],
      { session },
    );

    return result;
  }

  public async increaseUsedCount(couponId: ObjectId, session?: ClientSession): Promise<void> {
    const result = await this.couponModel.findOneAndUpdate(
      {
        _id: couponId,
        couponDeletedAt: null,
        couponStatus: CouponStatus.ACTIVE,
        $expr: { $or: [{ $eq: ['$usageLimit', 0] }, { $lt: ['$usedCount', '$usageLimit'] }] },
      },
      {
        $inc: {
          usedCount: 1,
        },
      },
      {
        new: true,
        session,
      },
    );

    if (!result) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }
  }
}
