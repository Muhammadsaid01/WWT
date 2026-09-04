/* eslint-disable prettier/prettier */
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { TravelMatePost, TravelMatePosts } from '../../libs/dto/community/travel-mate';
import {
  TravelMatePostInput,
  TravelMatePostsInquiry,
} from '../../libs/dto/community/travel-mate.input';
import { TravelMatePostUpdate } from '../../libs/dto/community/travel-mate.update';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { TravelMatePostService } from './travel-mate-post.service';

@Resolver()
export class TravelMatePostResolver {
  constructor(private readonly travelMatePostService: TravelMatePostService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => TravelMatePost)
  public async createTravelMatePost(
    @Args('input') input: TravelMatePostInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<TravelMatePost> {
    console.log('Mutation: createTravelMatePost');

    return this.travelMatePostService.createTravelMatePost(memberId, input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => TravelMatePosts)
  public async getTravelMatePosts(
    @Args('input') input: TravelMatePostsInquiry,
  ): Promise<TravelMatePosts> {
    console.log('Query: getTravelMatePosts');

    return this.travelMatePostService.getTravelMatePosts(input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => TravelMatePost)
  public async getTravelMatePost(
    @Args('postId', { type: () => String })
    postId: string,
    @AuthMember('_id') memberId?: ObjectId,
  ): Promise<TravelMatePost> {
    console.log('Query: getTravelMatePost');
    const post = shapeIntoMongoObjectId(postId);
    return this.travelMatePostService.getTravelMatePost(memberId ?? null, post);
  }

  @UseGuards(AuthGuard)
  @Query(() => TravelMatePosts)
  public async getMyTravelMatePosts(
    @Args('input') input: TravelMatePostsInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<TravelMatePosts> {
    console.log('Query: getMyTravelMatePosts');

    return this.travelMatePostService.getMyTravelMatePosts(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => TravelMatePost)
  public async updateTravelMatePost(
    @Args('input') input: TravelMatePostUpdate,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<TravelMatePost> {
    console.log('Mutation: updateTravelMatePost');

    input._id = shapeIntoMongoObjectId(input._id);

    return await this.travelMatePostService.updateTravelMatePost(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => TravelMatePost)
  public async deleteTravelMatePost(
    @Args('postId', { type: () => String })
    postId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<TravelMatePost> {
    console.log('Mutation: deleteTravelMatePost');

    return this.travelMatePostService.deleteTravelMatePost(
      memberId,
      shapeIntoMongoObjectId(postId),
    );
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => TravelMatePost)
  public async deleteTravelMatePostByAdmin(
    @Args('postId') postId: string,
  ): Promise<TravelMatePost> {
    console.log('Mutation: deleteTravelMatePostByAdmin');

    return await this.travelMatePostService.deleteTravelMatePostByAdmin(
      shapeIntoMongoObjectId(postId),
    );
  }
}
