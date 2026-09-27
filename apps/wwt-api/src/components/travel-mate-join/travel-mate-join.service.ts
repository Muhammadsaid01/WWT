import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { lookupMember, lookupTravelMatePost, shapeIntoMongoObjectId } from '../../libs/config';
import { TravelMatePost } from '../../libs/dto/community/travel-mate';
import { TravelMateJoin, TravelMateJoins } from '../../libs/dto/community/travel-mate-join';
// eslint-disable-next-line prettier/prettier
import {
  TravelMateJoinInput,
  TravelMateJoinsInquiry,
} from '../../libs/dto/community/travel-mate-join.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { TravelMateJoinStatus, TravelMatePostStatus } from '../../libs/enums/community.enum';
import { NotificationReferenceType, NotificationType } from '../../libs/enums/notification.enum';
import { T } from '../../libs/types/common';
import { MemberService } from '../member/member.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class TravelMateJoinService {
  constructor(
    @InjectModel('TravelMateJoin')
    private readonly travelMateJoinModel: Model<TravelMateJoin>,

    @InjectModel('TravelMatePost')
    private readonly travelMatePostModel: Model<TravelMatePost>,

    private readonly memberService: MemberService,
    private readonly notificationService: NotificationService,
  ) {}

  public async joinTravelMate(
    memberId: ObjectId,
    input: TravelMateJoinInput,
  ): Promise<TravelMateJoin> {
    const postId = shapeIntoMongoObjectId(input.travelMatePostId);

    const targetPost = await this.travelMatePostModel.findOne({
      _id: postId,
      matePostStatus: TravelMatePostStatus.ACTIVE,
    });

    if (!targetPost) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    // Post owner o‘z postiga join qila olmaydi
    if (targetPost.memberId.toString() === memberId.toString()) {
      throw new BadRequestException('You cannot join your own travel mate post.');
    }

    // Group allaqachon to‘lsa yangi request qabul qilmaymiz
    if (targetPost.currentMembers >= targetPost.maxMembers) {
      throw new BadRequestException('Travel mate group is already full.');
    }

    const existingJoin = await this.travelMateJoinModel.findOne({
      travelMatePostId: postId,
      memberId,
    });

    if (existingJoin) {
      throw new BadRequestException('You have already sent a join request.');
    }

    const result = await this.travelMateJoinModel.create({
      travelMatePostId: postId,
      memberId,
      message: input.message ?? null,
      joinStatus: TravelMateJoinStatus.PENDING,
    });

    await this.notificationService.createNotification({
      receiverId: targetPost.memberId,
      senderId: memberId,

      notificationType: NotificationType.TRAVEL_MATE_JOIN_REQUEST,

      notificationTitle: 'New travel mate request',

      notificationMessage: 'Someone requested to join your travel group.',

      referenceType: NotificationReferenceType.TRAVEL_MATE_POST,

      referenceId: targetPost._id,
    });

    return result;
  }

  public async approveTravelMateJoin(
    memberId: ObjectId,
    joinId: ObjectId,
  ): Promise<TravelMateJoin> {
    const targetJoin = await this.travelMateJoinModel.findOne({
      _id: joinId,
      joinStatus: TravelMateJoinStatus.PENDING,
    });

    if (!targetJoin) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const targetPost = await this.travelMatePostModel.findOne({
      _id: targetJoin.travelMatePostId,
      matePostStatus: TravelMatePostStatus.ACTIVE,
    });

    if (!targetPost) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    if (targetPost.memberId.toString() !== memberId.toString()) {
      throw new ForbiddenException('Only the post owner can approve join requests.');
    }

    if (targetPost.currentMembers >= targetPost.maxMembers) {
      throw new BadRequestException('Travel mate group is already full.');
    }

    const approvedJoin = await this.travelMateJoinModel.findOneAndUpdate(
      {
        _id: joinId,
        joinStatus: TravelMateJoinStatus.PENDING,
      },
      {
        $set: {
          joinStatus: TravelMateJoinStatus.APPROVED,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!approvedJoin) {
      throw new BadRequestException(Message.UPDATE_FAILED);
    }

    await this.travelMatePostModel.findByIdAndUpdate(targetPost._id, {
      $inc: {
        currentMembers: 1,
      },
    });

    await this.notificationService.createNotification({
      receiverId: targetJoin.memberId,
      senderId: memberId,

      notificationType: NotificationType.TRAVEL_MATE_JOIN_APPROVED,

      notificationTitle: 'Join request approved',

      notificationMessage: 'Your travel mate join request has been approved.',

      referenceType: NotificationReferenceType.TRAVEL_MATE_POST,

      referenceId: targetPost._id,
    });

    return approvedJoin;
  }

  public async rejectTravelMateJoin(memberId: ObjectId, joinId: ObjectId): Promise<TravelMateJoin> {
    const targetJoin = await this.travelMateJoinModel.findOne({
      _id: joinId,
      joinStatus: TravelMateJoinStatus.PENDING,
    });

    if (!targetJoin) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const targetPost = await this.travelMatePostModel.findOne({
      _id: targetJoin.travelMatePostId,
      matePostStatus: TravelMatePostStatus.ACTIVE,
    });

    if (!targetPost) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    if (targetPost.memberId.toString() !== memberId.toString()) {
      throw new ForbiddenException('Only the post owner can reject join requests.');
    }

    const rejectedJoin = await this.travelMateJoinModel.findOneAndUpdate(
      {
        _id: joinId,
        joinStatus: TravelMateJoinStatus.PENDING,
      },
      {
        $set: {
          joinStatus: TravelMateJoinStatus.REJECTED,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!rejectedJoin) {
      throw new BadRequestException(Message.UPDATE_FAILED);
    }

    await this.notificationService.createNotification({
      receiverId: targetJoin.memberId,
      senderId: memberId,

      notificationType: NotificationType.TRAVEL_MATE_JOIN_REJECTED,

      notificationTitle: 'Join request rejected',

      notificationMessage: 'Your travel mate join request has been rejected.',

      referenceType: NotificationReferenceType.TRAVEL_MATE_POST,

      referenceId: targetPost._id,
    });

    return rejectedJoin;
  }

  public async leaveTravelMate(memberId: ObjectId, joinId: ObjectId): Promise<TravelMateJoin> {
    const targetJoin = await this.travelMateJoinModel
      .findOne({
        _id: joinId,
        memberId,
      })
      .exec();

    if (!targetJoin) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const result = await this.travelMateJoinModel.findByIdAndDelete(joinId).exec();

    if (!result) {
      throw new BadRequestException(Message.DELETE_FAILED);
    }

    if (targetJoin.joinStatus === TravelMateJoinStatus.APPROVED) {
      await this.travelMatePostModel.findByIdAndUpdate(targetJoin.travelMatePostId, {
        $inc: {
          currentMembers: -1,
        },
      });
    }

    return result;
  }

  public async getTravelMateParticipants(input: TravelMateJoinsInquiry): Promise<TravelMateJoins> {
    const search = input.search ?? {};

    if (!search.travelMatePostId) {
      throw new BadRequestException(Message.BAD_REQUEST);
    }

    const match: T = {
      travelMatePostId: search.travelMatePostId,
      joinStatus: TravelMateJoinStatus.APPROVED,
    };

    const sort: T = {
      [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
    };

    const result = await this.travelMateJoinModel.aggregate([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            {
              $skip: (input.page - 1) * input.limit,
            },
            {
              $limit: input.limit,
            },

            lookupMember,

            {
              $unwind: {
                path: '$memberData',
                preserveNullAndEmptyArrays: true,
              },
            },
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

  public async getMyJoinedTravelMates(
    memberId: ObjectId,
    input: TravelMateJoinsInquiry,
  ): Promise<TravelMateJoins> {
    const search = input.search ?? {};

    const match: T = {
      memberId,
    };

    if (search.joinStatus) {
      match.joinStatus = search.joinStatus;
    }

    if (search.travelMatePostId) {
      match.travelMatePostId = shapeIntoMongoObjectId(search.travelMatePostId);
    }

    const sort: T = {
      [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
    };

    const result = await this.travelMateJoinModel.aggregate([
      { $match: match },
      { $sort: sort },

      {
        $facet: {
          list: [
            {
              $skip: (input.page - 1) * input.limit,
            },
            {
              $limit: input.limit,
            },

            lookupTravelMatePost,

            {
              $unwind: {
                path: '$travelMatePostData',
                preserveNullAndEmptyArrays: true,
              },
            },
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

  public async getMyIncomingTravelMateJoinRequests(
    memberId: ObjectId,
    input: TravelMateJoinsInquiry,
  ): Promise<TravelMateJoins> {
    const search = input.search ?? {};

    const match: T = {};

    if (search.joinStatus) {
      match.joinStatus = search.joinStatus;
    }

    if (search.travelMatePostId) {
      match.travelMatePostId = shapeIntoMongoObjectId(search.travelMatePostId);
    }

    const sort: T = {
      [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
    };

    const result = await this.travelMateJoinModel.aggregate([
      {
        $match: match,
      },

      lookupTravelMatePost,

      {
        $unwind: {
          path: '$travelMatePostData',
          preserveNullAndEmptyArrays: false,
        },
      },

      // IMPORTANT:
      // only requests belonging to posts owned by logged-in member
      {
        $match: {
          'travelMatePostData.memberId': memberId,
        },
      },

      {
        $sort: sort,
      },

      {
        $facet: {
          list: [
            {
              $skip: (input.page - 1) * input.limit,
            },
            {
              $limit: input.limit,
            },

            // Join requests reference their requester directly through memberId.
            {
              $lookup: {
                ...lookupMember.$lookup,
                localField: 'memberId',
              },
            },

            {
              $unwind: {
                path: '$memberData',
                preserveNullAndEmptyArrays: true,
              },
            },
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

  public async deleteTravelMateJoinByAdmin(joinId: ObjectId): Promise<TravelMateJoin> {
    const targetJoin = await this.travelMateJoinModel.findById(joinId);

    if (!targetJoin) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const deletedJoin = await this.travelMateJoinModel.findByIdAndDelete(joinId);

    if (!deletedJoin) {
      throw new BadRequestException(Message.DELETE_FAILED);
    }

    if (targetJoin.joinStatus === TravelMateJoinStatus.APPROVED) {
      await this.travelMatePostModel.findOneAndUpdate(
        {
          _id: targetJoin.travelMatePostId,
          currentMembers: { $gt: 1 },
        },
        {
          $inc: {
            currentMembers: -1,
          },
        },
      );
    }

    return deletedJoin;
  }
}
