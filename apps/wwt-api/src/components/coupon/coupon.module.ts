import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import CouponSchema from '../../schemas/coupon/Coupon.schema';
import CouponUsageSchema from '../../schemas/coupon/CouponUsage.schema';
import { AuthModule } from '../auth/auth.module';
import { CouponResolver } from './coupon.resolver';
import { CouponService } from './coupon.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Coupon',
        schema: CouponSchema,
      },
      {
        name: 'CouponUsage',
        schema: CouponUsageSchema,
      },
    ]),
    AuthModule,
  ],
  providers: [CouponResolver, CouponService],
  exports: [CouponService],
})
export class CouponModule {}
