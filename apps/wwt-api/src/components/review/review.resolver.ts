import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Review, Reviews } from '../../libs/dto/community/review';
import { ReviewInput, ReviewsInquiry } from '../../libs/dto/community/review.input';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { ReviewService } from './review.service';

@Resolver()
export class ReviewResolver {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(AuthGuard)
  @UseGuards(RolesGuard)
  @Mutation(() => Review)
  public async createReview(
    @AuthMember('_id') memberId: ObjectId,
    @Args('input') input: ReviewInput,
  ): Promise<Review> {
    console.log('Mutation: createReview');

    const targetMemberId = shapeIntoMongoObjectId(memberId);

    return this.reviewService.createReview(targetMemberId, input);
  }

  @UseGuards(AuthGuard)
  @Query(() => Reviews)
  public async getPackageReviews(
    @Args('packageId', { type: () => String })
    packageId: string,

    @Args('input')
    input: ReviewsInquiry,
  ): Promise<Reviews> {
    console.log('Query: getPackageReviews');

    const targetPackageId = shapeIntoMongoObjectId(packageId);

    return this.reviewService.getPackageReviews(targetPackageId, input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Review)
  public async getReview(
    @AuthMember('_id') memberId: ObjectId,
    @Args('reviewId', { type: () => String })
    reviewId: string,
  ): Promise<Review> {
    console.log('Query: getReview');

    const targetMemberId = shapeIntoMongoObjectId(memberId);

    const targetReviewId = shapeIntoMongoObjectId(reviewId);

    return this.reviewService.getReview(targetMemberId, targetReviewId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Review)
  public async likeTargetReview(
    @Args('reviewId', { type: () => String })
    reviewId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Review> {
    console.log('Mutation: likeTargetReview');

    const targetReviewId = shapeIntoMongoObjectId(reviewId);

    return this.reviewService.likeTargetReview(memberId, targetReviewId);
  }

  @UseGuards(AuthGuard)
  @UseGuards(RolesGuard)
  @Query(() => Reviews)
  public async getMyReviews(
    @AuthMember('_id') memberId: ObjectId,
    @Args('input') input: ReviewsInquiry,
  ): Promise<Reviews> {
    console.log('Query: getMyReviews');

    const targetMemberId = shapeIntoMongoObjectId(memberId);

    return this.reviewService.getMyReviews(targetMemberId, input);
  }

  @UseGuards(AuthGuard)
  @UseGuards(RolesGuard)
  @Mutation(() => Review)
  public async deleteReview(
    @AuthMember('_id') memberId: ObjectId,
    @Args('reviewId', { type: () => String })
    reviewId: string,
  ): Promise<Review> {
    console.log('Mutation: deleteReview');

    const targetMemberId = shapeIntoMongoObjectId(memberId);

    const targetReviewId = shapeIntoMongoObjectId(reviewId);

    return this.reviewService.deleteReview(targetMemberId, targetReviewId);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Reviews)
  public async getAllReviewsByAdmin(@Args('input') input: ReviewsInquiry): Promise<Reviews> {
    console.log('Query: getAllReviewsByAdmin');

    return this.reviewService.getAllReviewsByAdmin(input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Review)
  public async getReviewByAdmin(
    @Args('reviewId', { type: () => String })
    reviewId: string,
  ): Promise<Review> {
    console.log('Query: getReviewByAdmin');

    return this.reviewService.getReviewByAdmin(shapeIntoMongoObjectId(reviewId));
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Review)
  public async deleteReviewByAdmin(
    @Args('reviewId', { type: () => String })
    reviewId: string,
  ): Promise<Review> {
    console.log('Mutation: deleteReviewByAdmin');

    const targetReviewId = shapeIntoMongoObjectId(reviewId);

    return this.reviewService.deleteReviewByAdmin(targetReviewId);
  }
}
