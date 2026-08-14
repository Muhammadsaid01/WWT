/* eslint-disable prettier/prettier */
import { ObjectId } from 'bson';
import { T } from './types/common';

export const availablePackageOptions = [
  'packageStatus',
  'packageType',
  'packageCategory',
  'packageLevel',
];

export const availablePackageSorts = [
  'createdAt',
  'updatedAt',
  'packagePrice',
  'packageViewCount',
  'packageLikeCount',
  'packageBookingCount',
  'packageRating',
];

export const availableBookingSorts = [
  'createdAt',
  'updatedAt',
  'bookingCode',
  'bookingStatus',
  'peopleCount',
  'totalPrice',
  'finalPrice',
];

export const availableBoardArticleSorts = [
  'createdAt',
  'updatedAt',
  'articleLikes',
  'articleViews',
];

// IMAGE CONFIGURATION (config.js)
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];

export const validImageExtensions = ['.png', '.jpg', '.jpeg'];

export const getSerialForImage = (filename: string) => {
  const ext = path.parse(filename).ext.toLowerCase();

  return uuidv4() + ext;
};

export const validateImage = (filename: string, mimetype: string): boolean => {
  // Normal client
  if (validMimeTypes.includes(mimetype)) {
    return true;
  }

  // Postman application/octet-stream yuborsa
  if (mimetype === 'application/octet-stream') {
    const ext = path.parse(filename).ext.toLowerCase();

    return validImageExtensions.includes(ext);
  }

  return false;
};

export const shapeIntoMongoObjectId = (target: any) => {
  return typeof target === 'string' ? new ObjectId(target) : target;
};

export const lookupAuthMemberLiked = (memberId: T, targetRefId: string = '$_id') => {
  return {
    $lookup: {
      from: 'likes',
      let: {
        localLikeRefId: targetRefId,
        localMemberId: memberId,
        localMyFavorite: true,
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$likeRefId', '$$localLikeRefId'] },
                { $eq: ['$memberId', '$$localMemberId'] },
              ],
            },
          },
        },
        {
          $project: {
            _id: 0,
            memberId: 1,
            likeRefId: 1,
            myFavorite: '$$localMyFavorite',
          },
        },
      ],
      as: 'meLiked',
    },
  };
};

interface LookupAuthMemberFollowed {
  followerId: T;
  followingId: string;
}

export const lookupAuthMemberFollowed = (input: LookupAuthMemberFollowed) => {
  const { followerId, followingId } = input;
  return {
    $lookup: {
      from: 'follows',
      let: {
        localFollowerId: followerId,
        localFollowingId: followingId,
        localMyFavorite: true,
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$followerId', '$$localFollowerId'] },
                { $eq: ['$followingId', '$$localFollowingId'] },
              ],
            },
          },
        },
        {
          $project: {
            _id: 0,
            followerId: 1,
            followingId: 1,
            myFollowing: '$$localMyFavorite',
          },
        },
      ],
      as: 'meFollowed',
    },
  };
};

export const lookupAgent = {
  $lookup: {
    from: 'agents',
    localField: 'agentId',
    foreignField: '_id',
    as: 'agentData',
  },
};

export const unwindAgent = {
  $unwind: {
    path: '$agentData',
    preserveNullAndEmptyArrays: true,
  },
};

export const lookupMember = {
  $lookup: {
    from: 'members',
    localField: 'agentData.memberId',
    foreignField: '_id',
    as: 'memberData',
  },
};

export const unwindMember = {
  $unwind: {
    path: '$memberData',
    preserveNullAndEmptyArrays: true,
  },
};

//BOOKING

export const lookupBookingPackage = {
  $lookup: {
    from: 'travelPackages',
    localField: 'packageId',
    foreignField: '_id',
    as: 'packageData',
  },
};

export const unwindBookingPackage = {
  $unwind: {
    path: '$packageData',
    preserveNullAndEmptyArrays: true,
  },
};

export const lookupBookingSchedule = {
  $lookup: {
    from: 'packageSchedules',
    localField: 'scheduleId',
    foreignField: '_id',
    as: 'scheduleData',
  },
};

export const unwindBookingSchedule = {
  $unwind: {
    path: '$scheduleData',
    preserveNullAndEmptyArrays: true,
  },
};

export const lookupBookingCustomer = {
  $lookup: {
    from: 'members',
    localField: 'memberId',
    foreignField: '_id',
    as: 'customerData',
  },
};

export const unwindBookingCustomer = {
  $unwind: {
    path: '$customerData',
    preserveNullAndEmptyArrays: true,
  },
};

export const lookupUsageCoupon = {
  $lookup: {
    from: 'coupons',
    localField: 'couponId',
    foreignField: '_id',
    as: 'couponData',
  },
};

export const unwindUsageCoupon = {
  $unwind: {
    path: '$couponData',
    preserveNullAndEmptyArrays: true,
  },
};

export const lookupUsageBooking = {
  $lookup: {
    from: 'bookings',
    localField: 'bookingId',
    foreignField: '_id',
    as: 'bookingData',
  },
};

export const unwindUsageBooking = {
  $unwind: {
    path: '$bookingData',
    preserveNullAndEmptyArrays: true,
  },
};

export const lookupUsageMember = {
  $lookup: {
    from: 'members',
    localField: 'memberId',
    foreignField: '_id',
    as: 'memberData',
  },
};

export const unwindUsageMember = {
  $unwind: {
    path: '$memberData',
    preserveNullAndEmptyArrays: true,
  },
};

export const lookupReviewMember = {
  $lookup: {
    from: 'members',
    localField: 'memberId',
    foreignField: '_id',
    as: 'memberData',
  },
};

export const unwindReviewMember = {
  $unwind: {
    path: '$memberData',
    preserveNullAndEmptyArrays: true,
  },
};

export const lookupReviewPackage = {
  $lookup: {
    from: 'travelPackages',
    localField: 'packageId',
    foreignField: '_id',
    as: 'packageData',
  },
};

export const unwindReviewPackage = {
  $unwind: {
    path: '$packageData',
    preserveNullAndEmptyArrays: true,
  },
};

export const lookupReviewBooking = {
  $lookup: {
    from: 'bookings',
    localField: 'bookingId',
    foreignField: '_id',
    as: 'bookingData',
  },
};

export const unwindReviewBooking = {
  $unwind: {
    path: '$bookingData',
    preserveNullAndEmptyArrays: true,
  },
};

export const lookupCommentArticle = {
  $lookup: {
    from: 'boardArticles',
    localField: 'articleId',
    foreignField: '_id',
    as: 'articleData',
  },
};

export const lookupFollowingData = {
  $lookup: {
    from: 'members',
    localField: 'followingId',
    foreignField: '_id',
    as: 'followingData',
  },
};
export const lookupFollowerData = {
  $lookup: {
    from: 'members',
    localField: 'followerId',
    foreignField: '_id',
    as: 'followerData',
  },
};

export const lookupTravelMateMember = {
  $lookup: {
    from: 'members',
    localField: 'memberId',
    foreignField: '_id',
    as: 'memberData',
  },
};

export const unwindTravelMateMember = {
  $unwind: {
    path: '$memberData',
    preserveNullAndEmptyArrays: true,
  },
};

export const lookupTravelMatePost = {
  $lookup: {
    from: 'travelMatePosts',
    localField: 'travelMatePostId',
    foreignField: '_id',
    as: 'travelMatePostData',
  },
};
