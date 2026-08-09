import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { TravelMateJoin, TravelMateJoins } from '../../libs/dto/community/travel-mate-join';

// eslint-disable-next-line prettier/prettier
import {
  TravelMateJoinInput,
  TravelMateJoinsInquiry,
} from '../../libs/dto/community/travel-mate-join.input';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { TravelMateJoinService } from './travel-mate-join.service';

@Resolver()
export class TravelMateJoinResolver {
  constructor(private readonly travelMateJoinService: TravelMateJoinService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => TravelMateJoin)
  public async joinTravelMate(
    @Args('input') input: TravelMateJoinInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<TravelMateJoin> {
    console.log('Mutation: joinTravelMate');

    return this.travelMateJoinService.joinTravelMate(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => TravelMateJoin)
  public async approveTravelMateJoin(
    @Args('joinId', { type: () => String })
    joinId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<TravelMateJoin> {
    console.log('Mutation: approveTravelMateJoin');

    return this.travelMateJoinService.approveTravelMateJoin(
      memberId,
      shapeIntoMongoObjectId(joinId),
    );
  }

  @UseGuards(AuthGuard)
  @Mutation(() => TravelMateJoin)
  public async rejectTravelMateJoin(
    @Args('joinId', { type: () => String })
    joinId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<TravelMateJoin> {
    console.log('Mutation: rejectTravelMateJoin');

    return this.travelMateJoinService.rejectTravelMateJoin(
      memberId,
      shapeIntoMongoObjectId(joinId),
    );
  }

  @UseGuards(AuthGuard)
  @Mutation(() => TravelMateJoin)
  public async leaveTravelMate(
    @Args('joinId') joinId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<TravelMateJoin> {
    console.log('Mutation: leaveTravelMate');

    return await this.travelMateJoinService.leaveTravelMate(
      memberId,
      shapeIntoMongoObjectId(joinId),
    );
  }

  @UseGuards(WithoutGuard)
  @Query(() => TravelMateJoins)
  public async getTravelMateParticipants(
    @Args('input') input: TravelMateJoinsInquiry,
  ): Promise<TravelMateJoins> {
    console.log('Query: getTravelMateParticipants');

    if (input.search?.travelMatePostId) {
      input.search.travelMatePostId = shapeIntoMongoObjectId(input.search.travelMatePostId) as any;
    }

    return this.travelMateJoinService.getTravelMateParticipants(input);
  }

  @UseGuards(AuthGuard)
  @Query(() => TravelMateJoins)
  public async getMyJoinedTravelMates(
    @Args('input') input: TravelMateJoinsInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<TravelMateJoins> {
    console.log('Query: getMyJoinedTravelMates');

    return this.travelMateJoinService.getMyJoinedTravelMates(memberId, input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => TravelMateJoin)
  public async deleteTravelMateJoinByAdmin(
    @Args('joinId', { type: () => String })
    joinId: string,
  ): Promise<TravelMateJoin> {
    console.log('Mutation: deleteTravelMateJoinByAdmin');

    return this.travelMateJoinService.deleteTravelMateJoinByAdmin(shapeIntoMongoObjectId(joinId));
  }
}
