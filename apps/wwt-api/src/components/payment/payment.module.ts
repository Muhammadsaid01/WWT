import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import PaymentSchema from '../../schemas/bookings/Payment.schema';
import { AgentModule } from '../agent/agent.module';
import { AuthModule } from '../auth/auth.module';
import { BookingModule } from '../booking/booking.module';
import { NotificationModule } from '../notification/notification.module';
import { PaymentResolver } from './payment.resolver';
import { PaymentService } from './payment.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Payment',
        schema: PaymentSchema,
      },
    ]),

    BookingModule,
    AgentModule,
    AuthModule,
    NotificationModule,
  ],
  providers: [PaymentResolver, PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
