/* eslint-disable prettier/prettier */
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';

import { Booking, Bookings } from '../../libs/dto/booking/booking';

import {
  BookingInput,
  BookingsInquiry,
  CancelBookingInput,
  UpdateBookingStatusInput,
} from '../../libs/dto/booking/booking.input';
import { BookingService } from './booking.service';

import { shapeIntoMongoObjectId } from '../../libs/config';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class BookingResolver {
  constructor(private readonly bookingService: BookingService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => Booking)
  public async createBooking(
    @AuthMember('_id') memberId: ObjectId,
    @Args('input') input: BookingInput,
  ): Promise<Booking> {
    console.log('Mutation: createBooking');

    return await this.bookingService.createBooking(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Booking)
  public async cancelBooking(
    @AuthMember('_id') memberId: ObjectId,
    @Args('input') input: CancelBookingInput,
  ): Promise<Booking> {
    console.log('Mutation: cancelBooking');

    const targetBookingId = shapeIntoMongoObjectId(input._id);

    return await this.bookingService.cancelBooking(memberId, targetBookingId);
  }

  @UseGuards(AuthGuard)
  @Query(() => Bookings)
  public async getMyBookings(
    @AuthMember('_id') memberId: ObjectId,
    @Args('input') input: BookingsInquiry,
  ): Promise<Bookings> {
    console.log('Query: getMyBookings');

    const targetMemberId = shapeIntoMongoObjectId(memberId);

    return await this.bookingService.getMyBookings(targetMemberId, input);
  }

  @UseGuards(AuthGuard)
  @Query(() => Booking)
  public async getMyBooking(
    @AuthMember('_id') memberId: ObjectId,
    @Args('bookingId', { type: () => String }) bookingId: string,
  ): Promise<Booking> {
    console.log('Query: getMyBooking');

    const targetMemberId = shapeIntoMongoObjectId(memberId);
    const targetBookingId = shapeIntoMongoObjectId(bookingId);

    return await this.bookingService.getMyBooking(targetMemberId, targetBookingId);
  }

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Query(() => Bookings)
  public async getBookingsByAgent(
    @AuthMember('_id') memberId: ObjectId,
    @Args('input') input: BookingsInquiry,
  ): Promise<Bookings> {
    console.log('Query: getBookingsByAgent');

    const targetMemberId = shapeIntoMongoObjectId(memberId);

    return await this.bookingService.getBookingsByAgent(targetMemberId, input);
  }

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Query(() => Booking)
  public async getBookingByAgent(
    @AuthMember('_id') memberId: ObjectId,
    @Args('bookingId', { type: () => String }) bookingId: string,
  ): Promise<Booking> {
    console.log('Query: getBookingByAgent');

    const targetMemberId = shapeIntoMongoObjectId(memberId);

    const targetBookingId = shapeIntoMongoObjectId(bookingId);

    return this.bookingService.getBookingByAgent(targetMemberId, targetBookingId);
  }

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => Booking)
  public async updateBookingStatus(
    @AuthMember('_id') memberId: ObjectId,
    @Args('input') input: UpdateBookingStatusInput,
  ): Promise<Booking> {
    console.log('Mutation: updateBookingStatus');

    const targetMemberId = shapeIntoMongoObjectId(memberId);

    const targetBookingId = shapeIntoMongoObjectId(input.bookingId);

    return this.bookingService.updateBookingStatus(
      targetMemberId,
      targetBookingId,
      input.bookingStatus,
    );
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Bookings)
  public async getAllBookingsByAdmin(@Args('input') input: BookingsInquiry): Promise<Bookings> {
    console.log('Query: getAllBookingsByAdmin');

    return await this.bookingService.getAllBookingsByAdmin(input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Booking)
  public async getBookingByAdmin(
    @Args('bookingId', { type: () => String }) bookingId: string,
  ): Promise<Booking> {
    console.log('Query: getBookingByAdmin');

    const targetBookingId = shapeIntoMongoObjectId(bookingId);

    return await this.bookingService.getBookingByAdmin(targetBookingId);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Booking)
  public async updateBookingByAdmin(
    @Args('input') input: UpdateBookingStatusInput,
  ): Promise<Booking> {
    console.log('Mutation: updateBookingByAdmin');

    const bookingId = shapeIntoMongoObjectId(input.bookingId);

    return await this.bookingService.updateBookingByAdmin(bookingId, input.bookingStatus);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Booking)
  public async deleteBookingByAdmin(
    @Args('bookingId', { type: () => String }) bookingId: string,
  ): Promise<Booking> {
    console.log('Mutation: deleteBookingByAdmin');

    const targetBookingId = shapeIntoMongoObjectId(bookingId);

    return await this.bookingService.deleteBookingByAdmin(targetBookingId);
  }
}
