/* eslint-disable prettier/prettier */
import { ObjectId } from 'bson';

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

export const shapeIntoMongoObjectId = (target: any) => {
  return typeof target === 'string' ? new ObjectId(target) : target;
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
export const availableBookingSorts = [
  'createdAt',
  'updatedAt',
  'bookingCode',
  'bookingStatus',
  'peopleCount',
  'totalPrice',
  'finalPrice',
];

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

export const availableBoardArticleSorts = [
  'createdAt',
  'updatedAt',
  'articleLikes',
  'articleViews',
];

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
