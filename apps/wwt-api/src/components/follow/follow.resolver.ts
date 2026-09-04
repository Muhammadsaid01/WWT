import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Follower, Followers, Followings } from '../../libs/dto/community/follow';
import { FollowInquiry } from '../../libs/dto/community/follow.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { FollowService } from './follow.service';

@Resolver()
export class FollowResolver {
  constructor(private readonly followService: FollowService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => Follower)
  public async subscribe(
    @Args('input') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Follower> {
    console.log('Mutation: subscribe');
    const followingid = shapeIntoMongoObjectId(input);
    return await this.followService.subscribe(memberId, followingid);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Follower)
  public async unsubscribe(
    @Args('input') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Follower> {
    console.log('Mutation: unsubscribe');
    const followingid = shapeIntoMongoObjectId(input);
    return await this.followService.unsubscribe(memberId, followingid);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Followings)
  public async getMemberFollowings(
    @Args('input') input: FollowInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Followings> {
    console.log('Query: getMemberFollowings');
    const { followerId } = input.search;
    input.search.followerId = shapeIntoMongoObjectId(followerId);
    return await this.followService.getMemberFollowings(memberId, input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Followers)
  public async getMemberFollowers(
    @Args('input') input: FollowInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Followers> {
    console.log('Query: getMemberFollowers');
    const { followingId } = input.search;
    input.search.followingId = shapeIntoMongoObjectId(followingId);
    return await this.followService.getMemberFollowers(memberId, input);
  }
}
