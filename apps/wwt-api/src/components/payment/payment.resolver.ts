import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Payment } from '../../libs/dto/booking/payment';
import { PaymentInput, UpdatePaymentStatusInput } from '../../libs/dto/booking/payment.input';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaymentService } from './payment.service';

@Resolver(() => Payment)
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}

  @Roles(MemberType.USER)
  @UseGuards(RolesGuard)
  @Mutation(() => Payment)
  public async createPayment(
    @AuthMember('_id') memberId: ObjectId,
    @Args('input') input: PaymentInput,
  ): Promise<Payment> {
    console.log('Mutation: createPayment');

    const targetMemberId = shapeIntoMongoObjectId(memberId);

    return await this.paymentService.createPayment(targetMemberId, input);
  }

  @Roles(MemberType.USER)
  @UseGuards(RolesGuard)
  @Query(() => [Payment])
  public async getMyPayments(@AuthMember('_id') memberId: ObjectId): Promise<Payment[]> {
    console.log('Query: getMyPayments');

    const targetMemberId = shapeIntoMongoObjectId(memberId);

    return await this.paymentService.getMyPayments(targetMemberId);
  }

  @Roles(MemberType.USER)
  @UseGuards(RolesGuard)
  @Query(() => Payment)
  public async getMyPayment(
    @AuthMember('_id') memberId: ObjectId,
    @Args('paymentId', { type: () => String })
    paymentId: string,
  ): Promise<Payment> {
    console.log('Query: getMyPayment');

    const targetMemberId = shapeIntoMongoObjectId(memberId);

    const targetPaymentId = shapeIntoMongoObjectId(paymentId);

    return await this.paymentService.getMyPayment(targetMemberId, targetPaymentId);
  }

  //AGENT

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Query(() => [Payment])
  public async getPaymentsByAgent(@AuthMember('_id') memberId: ObjectId): Promise<Payment[]> {
    console.log('Query: getPaymentsByAgent');

    const targetMemberId = shapeIntoMongoObjectId(memberId);

    return await this.paymentService.getPaymentsByAgent(targetMemberId);
  }

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Query(() => Payment)
  public async getPaymentByAgent(
    @AuthMember('_id') memberId: ObjectId,

    @Args('paymentId', { type: () => String })
    paymentId: string,
  ): Promise<Payment> {
    console.log('Query: getPaymentByAgent');

    const targetMemberId = shapeIntoMongoObjectId(memberId);

    const targetPaymentId = shapeIntoMongoObjectId(paymentId);

    return await this.paymentService.getPaymentByAgent(targetMemberId, targetPaymentId);
  }

  //ADMIN

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => [Payment])
  public async getAllPaymentsByAdmin(): Promise<Payment[]> {
    console.log('Query: getAllPaymentsByAdmin');

    return await this.paymentService.getAllPaymentsByAdmin();
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Payment)
  public async getPaymentByAdmin(
    @Args('paymentId', { type: () => String })
    paymentId: string,
  ): Promise<Payment> {
    console.log('Query: getPaymentByAdmin');

    const targetPaymentId = shapeIntoMongoObjectId(paymentId);

    return await this.paymentService.getPaymentByAdmin(targetPaymentId);
  }
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Payment)
  public async updatePaymentStatus(
    @Args('input') input: UpdatePaymentStatusInput,
  ): Promise<Payment> {
    console.log('Mutation: updatePaymentStatus');

    const paymentId = shapeIntoMongoObjectId(input.paymentId);

    return await this.paymentService.updatePaymentStatus(paymentId, input.paymentStatus);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Payment)
  public async deletePaymentByAdmin(
    @Args('paymentId', { type: () => String })
    paymentId: string,
  ): Promise<Payment> {
    console.log('Mutation: deletePaymentByAdmin');

    const targetPaymentId = shapeIntoMongoObjectId(paymentId);

    return await this.paymentService.deletePaymentByAdmin(targetPaymentId);
  }
}
