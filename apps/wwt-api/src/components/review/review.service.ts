/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import {
  lookupReviewBooking,
  lookupReviewMember,
  lookupReviewPackage,
  shapeIntoMongoObjectId,
  unwindReviewBooking,
  unwindReviewMember,
  unwindReviewPackage,
} from '../../libs/config';
import { Review, Reviews } from '../../libs/dto/community/review';
import { ReviewInput, ReviewsInquiry } from '../../libs/dto/community/review.input';
import { TravelPackage } from '../../libs/dto/travel-package/travel-package';
import { BookingStatus } from '../../libs/enums/booking.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { PackageStatus } from '../../libs/enums/package.enum';
import { BookingService } from '../booking/booking.service';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel('Review')
    private readonly reviewModel: Model<Review>,

    @InjectModel('TravelPackage')
    private readonly packageModel: Model<TravelPackage>,

    private readonly bookingService: BookingService,
  ) {}

  public async createReview(memberId: ObjectId, input: ReviewInput): Promise<Review> {
    const bookingId = shapeIntoMongoObjectId(input.bookingId);

    const booking = await this.bookingService.findActiveBookingById(bookingId);

    if (booking.memberId.toString() !== memberId.toString()) {
      throw new UnauthorizedException(Message.NOT_AUTHORIZED);
    }

    if (booking.bookingStatus !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Only completed bookings can be reviewed.');
    }

    const existingReview = await this.reviewModel.findOne({
      bookingId,
      reviewDeletedAt: null,
    });

    if (existingReview) {
      throw new BadRequestException('A review already exists for this booking.');
    }

    const createdReview = await this.reviewModel.create({
      ...input,
      bookingId,
      memberId,
      packageId: booking.packageId,
      agentId: booking.agentId,
    });

    await this.recalculatePackageRating(booking.packageId);

    return createdReview;
  }

  public async getPackageReviews(packageId: ObjectId, input: ReviewsInquiry): Promise<Reviews> {
    const targetPackage = await this.packageModel.findOne({
      _id: packageId,
      packageStatus: PackageStatus.ACTIVE,
    });

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const match: Record<string, any> = {
      packageId,
      reviewDeletedAt: null,
    };

    if (input.search?.reviewRating) {
      match.reviewRating = input.search.reviewRating;
    }

    const sortField = input.sort ?? 'createdAt';

    const sortDirection = input.direction === Direction.ASC ? 1 : -1;

    const result = await this.reviewModel.aggregate([
      {
        $match: match,
      },
      {
        $facet: {
          list: [
            {
              $sort: {
                [sortField]: sortDirection,
              },
            },
            {
              $skip: (input.page - 1) * input.limit,
            },
            {
              $limit: input.limit,
            },

            lookupReviewMember,
            unwindReviewMember,
          ],

          metaCounter: [
            {
              $count: 'total',
            },
          ],
        },
      },
    ]);

    return {
      list: result[0]?.list ?? [],
      metaCounter: result[0]?.metaCounter ?? [],
    };
  }

  public async getReview(memberId: ObjectId, reviewId: ObjectId): Promise<Review> {
    const result = await this.reviewModel.aggregate([
      {
        $match: {
          _id: reviewId,
          memberId,
          reviewDeletedAt: null,
        },
      },

      lookupReviewMember,
      unwindReviewMember,

      lookupReviewPackage,
      unwindReviewPackage,
    ]);

    if (!result.length) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return result[0];
  }

  public async getMyReviews(memberId: ObjectId, input: ReviewsInquiry): Promise<Reviews> {
    const match: Record<string, any> = {
      memberId,
      reviewDeletedAt: null,
    };

    if (input.search?.reviewRating) {
      match.reviewRating = input.search.reviewRating;
    }

    const sortField = input.sort ?? 'createdAt';

    const sortDirection = input.direction === Direction.ASC ? 1 : -1;

    const result = await this.reviewModel.aggregate([
      {
        $match: match,
      },
      {
        $facet: {
          list: [
            {
              $sort: {
                [sortField]: sortDirection,
              },
            },
            {
              $skip: (input.page - 1) * input.limit,
            },
            {
              $limit: input.limit,
            },

            lookupReviewPackage,
            unwindReviewPackage,
          ],

          metaCounter: [
            {
              $count: 'total',
            },
          ],
        },
      },
    ]);

    return {
      list: result[0]?.list ?? [],
      metaCounter: result[0]?.metaCounter ?? [],
    };
  }

  public async deleteReview(memberId: ObjectId, reviewId: ObjectId): Promise<Review> {
    const targetReview = await this.reviewModel.findOne({
      _id: reviewId,
      memberId,
      reviewDeletedAt: null,
    });

    if (!targetReview) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const deletedReview = await this.reviewModel.findOneAndUpdate(
      {
        _id: reviewId,
        memberId,
        reviewDeletedAt: null,
      },
      {
        $set: {
          reviewDeletedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!deletedReview) {
      throw new BadRequestException(Message.DELETE_FAILED);
    }

    await this.recalculatePackageRating(targetReview.packageId);

    return deletedReview;
  }

  public async getAllReviewsByAdmin(input: ReviewsInquiry): Promise<Reviews> {
    const match: Record<string, any> = {
      reviewDeletedAt: null,
    };

    const search = input.search;

    if (search?.reviewRating !== undefined) {
      match.reviewRating = search.reviewRating;
    }

    if (search?.memberId) {
      match.memberId = shapeIntoMongoObjectId(search.memberId);
    }

    if (search?.packageId) {
      match.packageId = shapeIntoMongoObjectId(search.packageId);
    }

    if (search?.agentId) {
      match.agentId = shapeIntoMongoObjectId(search.agentId);
    }

    if (search?.text?.trim()) {
      const escapedText = search.text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      match.$or = [
        {
          reviewTitle: {
            $regex: escapedText,
            $options: 'i',
          },
        },
        {
          reviewContent: {
            $regex: escapedText,
            $options: 'i',
          },
        },
      ];
    }

    const allowedSorts = ['createdAt', 'updatedAt', 'reviewRating'];

    const sortField = input.sort && allowedSorts.includes(input.sort) ? input.sort : 'createdAt';

    const sortDirection = input.direction === Direction.ASC ? 1 : -1;

    const result = await this.reviewModel.aggregate([
      {
        $match: match,
      },
      {
        $facet: {
          list: [
            {
              $sort: {
                [sortField]: sortDirection,
              },
            },
            {
              $skip: (input.page - 1) * input.limit,
            },
            {
              $limit: input.limit,
            },

            lookupReviewMember,
            unwindReviewMember,

            lookupReviewPackage,
            unwindReviewPackage,

            lookupReviewBooking,
            unwindReviewBooking,
          ],

          metaCounter: [
            {
              $count: 'total',
            },
          ],
        },
      },
    ]);

    return {
      list: result[0]?.list ?? [],
      metaCounter: result[0]?.metaCounter ?? [],
    };
  }

  public async getReviewByAdmin(reviewId: ObjectId): Promise<Review> {
    const result = await this.reviewModel.aggregate([
      {
        $match: {
          _id: reviewId,
          reviewDeletedAt: null,
        },
      },

      lookupReviewMember,
      unwindReviewMember,

      lookupReviewPackage,
      unwindReviewPackage,

      lookupReviewBooking,
      unwindReviewBooking,
    ]);

    if (!result.length) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return result[0];
  }

  public async deleteReviewByAdmin(reviewId: ObjectId): Promise<Review> {
    const targetReview = await this.reviewModel.findOne({
      _id: reviewId,
      reviewDeletedAt: null,
    });

    if (!targetReview) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const deletedReview = await this.reviewModel.findOneAndUpdate(
      {
        _id: reviewId,
        reviewDeletedAt: null,
      },
      {
        $set: {
          reviewDeletedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!deletedReview) {
      throw new BadRequestException(Message.DELETE_FAILED);
    }

    await this.recalculatePackageRating(targetReview.packageId);

    return deletedReview;
  }
  // Helper

  private async recalculatePackageRating(packageId: ObjectId): Promise<void> {
    const result = await this.reviewModel.aggregate([
      {
        $match: {
          packageId,
          reviewDeletedAt: null,
        },
      },
      {
        $group: {
          _id: '$packageId',
          averageRating: {
            $avg: '$reviewRating',
          },
          reviewCount: {
            $sum: 1,
          },
        },
      },
    ]);

    const averageRating = result[0]?.averageRating ?? 0;

    const reviewCount = result[0]?.reviewCount ?? 0;

    const updatedPackage = await this.packageModel.findByIdAndUpdate(
      packageId,
      {
        $set: {
          packageRating: Number(averageRating.toFixed(1)),
          packageReviewCount: reviewCount,
        },
      },
      {
        new: true,
      },
    );

    if (!updatedPackage) {
      throw new BadRequestException(Message.UPDATE_FAILED);
    }
  }
}
