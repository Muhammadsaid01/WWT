import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Traveler } from '../../libs/dto/booking/traveler';
import { TravelerInput } from '../../libs/dto/booking/traveler.input';
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
}
