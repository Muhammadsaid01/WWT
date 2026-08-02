import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import {
  Coupon,
  Coupons,
  CouponValidation,
  PublicCoupon,
  PublicCoupons,
} from '../../libs/dto/coupon/coupon';
import { CouponUsages } from '../../libs/dto/coupon/coupon-usage';
import { CouponUsageInquiry } from '../../libs/dto/coupon/coupon-usage.input';
import {
  CouponInput,
  CouponInquiry,
  ValidateCouponInput,
} from '../../libs/dto/coupon/coupon.input';
import { CouponUpdate } from '../../libs/dto/coupon/coupon.update';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { CouponService } from './coupon.service';

@Resolver()
export class CouponResolver {
  constructor(private readonly couponService: CouponService) {}

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Coupon)
  public async createCoupon(@Args('input') input: CouponInput): Promise<Coupon> {
    console.log('Mutation: createCoupon');

    return await this.couponService.createCoupon(input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Coupons)
  public async getAllCoupons(@Args('input') input: CouponInquiry): Promise<Coupons> {
    console.log('Query: getAllCoupons');

    return await this.couponService.getAllCoupons(input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Coupon)
  public async getCoupon(
    @Args('couponId', { type: () => String })
    couponId: string,
  ): Promise<Coupon> {
    console.log('Query: getCoupon');

    const targetCouponId = shapeIntoMongoObjectId(couponId);

    return await this.couponService.getCoupon(targetCouponId);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Coupon)
  public async updateCoupon(@Args('input') input: CouponUpdate): Promise<Coupon> {
    console.log('Mutation: updateCoupon');

    const couponId = shapeIntoMongoObjectId(input.couponId);

    return await this.couponService.updateCoupon(couponId, input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Coupon)
  public async deleteCoupon(
    @Args('couponId', { type: () => String })
    couponId: string,
  ): Promise<Coupon> {
    console.log('Mutation: deleteCoupon');

    const targetCouponId = shapeIntoMongoObjectId(couponId);

    return await this.couponService.deleteCoupon(targetCouponId);
  }

  @Roles(MemberType.USER)
  @UseGuards(RolesGuard)
  @Query(() => CouponValidation)
  public async validateCoupon(
    @AuthMember('_id') memberId: ObjectId,
    @Args('input') input: ValidateCouponInput,
  ): Promise<CouponValidation> {
    console.log('Query: validateCoupon');

    return await this.couponService.validateCoupon(shapeIntoMongoObjectId(memberId), input);
  }

  @Roles(MemberType.USER)
  @UseGuards(RolesGuard)
  @Query(() => CouponUsages)
  public async getMyCouponUsages(
    @AuthMember('_id') memberId: ObjectId,
    @Args('input') input: CouponUsageInquiry,
  ): Promise<CouponUsages> {
    console.log('Query: getMyCouponUsages');

    return this.couponService.getMyCouponUsages(shapeIntoMongoObjectId(memberId), input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => CouponUsages)
  public async getCouponUsages(
    @Args('couponId', { type: () => String })
    couponId: string,

    @Args('input')
    input: CouponUsageInquiry,
  ): Promise<CouponUsages> {
    console.log('Query: getCouponUsages');

    const targetCouponId = shapeIntoMongoObjectId(couponId);

    return this.couponService.getCouponUsages(targetCouponId, input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => PublicCoupons)
  public async getPublicCoupons(@Args('input') input: CouponInquiry): Promise<PublicCoupons> {
    return this.couponService.getPublicCoupons(input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => PublicCoupon)
  public async getPublicCoupon(
    @Args('couponCode', { type: () => String })
    couponCode: string,
  ): Promise<PublicCoupon> {
    console.log('Query: getPublicCoupon');

    return await this.couponService.getPublicCoupon(couponCode);
  }
}
