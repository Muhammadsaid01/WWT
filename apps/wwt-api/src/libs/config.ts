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
