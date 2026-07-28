import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Traveler } from '../../libs/dto/booking/traveler';
import { TravelerInput } from '../../libs/dto/booking/traveler.input';
import { TravelerUpdate } from '../../libs/dto/booking/traveler.update';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TravelerService } from './traveler.service';

@Resolver(() => Traveler)
export class TravelerResolver {
  constructor(private readonly travelerService: TravelerService) {}

  @Roles(MemberType.USER)
  @UseGuards(RolesGuard)
  @Mutation(() => Traveler)
  public async createTraveler(
    @AuthMember('_id') memberId: ObjectId,
    @Args('input') input: TravelerInput,
  ): Promise<Traveler> {
    console.log('Mutation: createTraveler');

    const targetMemberId = shapeIntoMongoObjectId(memberId);

    return await this.travelerService.createTraveler(targetMemberId, input);
  }

  @Roles(MemberType.USER)
  @UseGuards(RolesGuard)
  @Mutation(() => Traveler)
  public async updateTraveler(
    @AuthMember('_id') memberId: ObjectId,
    @Args('travelerId', { type: () => String })
    travelerId: string,
    @Args('input') input: TravelerUpdate,
  ): Promise<Traveler> {
    console.log('Mutation: updateTraveler');

    const targetMemberId = shapeIntoMongoObjectId(memberId);

    const targetTravelerId = shapeIntoMongoObjectId(travelerId);

    return this.travelerService.updateTraveler(targetMemberId, targetTravelerId, input);
  }

  @Roles(MemberType.USER)
  @UseGuards(RolesGuard)
  @Mutation(() => Traveler)
  public async deleteTraveler(
    @AuthMember('_id') memberId: ObjectId,
    @Args('travelerId', { type: () => String })
    travelerId: string,
  ): Promise<Traveler> {
    console.log('Mutation: deleteTraveler');

    const targetMemberId = shapeIntoMongoObjectId(memberId);

    const targetTravelerId = shapeIntoMongoObjectId(travelerId);

    return await this.travelerService.deleteTraveler(targetMemberId, targetTravelerId);
  }

  @Roles(MemberType.USER)
  @UseGuards(RolesGuard)
  @Query(() => [Traveler])
  public async getMyTravelersByBooking(
    @AuthMember('_id') memberId: ObjectId,
    @Args('bookingId', { type: () => String })
    bookingId: string,
  ): Promise<Traveler[]> {
    console.log('Query: getMyTravelersByBooking');

    const targetMemberId = shapeIntoMongoObjectId(memberId);

    const targetBookingId = shapeIntoMongoObjectId(bookingId);

    return this.travelerService.getMyTravelersByBooking(targetMemberId, targetBookingId);
  }

  @Roles(MemberType.USER)
  @UseGuards(RolesGuard)
  @Query(() => Traveler)
  public async getTraveler(
    @AuthMember('_id') memberId: ObjectId,
    @Args('travelerId', { type: () => String })
    travelerId: string,
  ): Promise<Traveler> {
    console.log('Query: getTraveler');

    const targetMemberId = shapeIntoMongoObjectId(memberId);

    const targetTravelerId = shapeIntoMongoObjectId(travelerId);

    return this.travelerService.getTraveler(targetMemberId, targetTravelerId);
  }

  //AGENT

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Query(() => [Traveler])
  public async getTravelersByBooking(
    @AuthMember('_id') memberId: ObjectId,
    @Args('bookingId', { type: () => String })
    bookingId: string,
  ): Promise<Traveler[]> {
    console.log('Query: getTravelersByBooking');

    const targetMemberId = shapeIntoMongoObjectId(memberId);

    const targetBookingId = shapeIntoMongoObjectId(bookingId);

    return this.travelerService.getTravelersByBooking(targetMemberId, targetBookingId);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => [Traveler])
  public async getTravelersByAdmin(
    @Args('bookingId', { type: () => String })
    bookingId: string,
  ): Promise<Traveler[]> {
    console.log('Query: getTravelersByAdmin');

    const targetBookingId = shapeIntoMongoObjectId(bookingId);

    return await this.travelerService.getTravelersByAdmin(targetBookingId);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Traveler)
  public async deleteTravelerByAdmin(
    @Args('travelerId', { type: () => String })
    travelerId: string,
  ): Promise<Traveler> {
    console.log('Mutation: deleteTravelerByAdmin');

    const targetTravelerId = shapeIntoMongoObjectId(travelerId);

    return await this.travelerService.deleteTravelerByAdmin(targetTravelerId);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Traveler)
  public async getTravelerByAdmin(
    @Args('travelerId', { type: () => String })
    travelerId: string,
  ): Promise<Traveler> {
    console.log('Query: getTravelerByAdmin');

    const targetTravelerId = shapeIntoMongoObjectId(travelerId);

    return this.travelerService.getTravelerByAdmin(targetTravelerId);
  }
}
