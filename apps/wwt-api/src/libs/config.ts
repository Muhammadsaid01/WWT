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
