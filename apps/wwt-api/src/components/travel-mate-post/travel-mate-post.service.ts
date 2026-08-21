import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { lookupTravelMateMember, unwindTravelMateMember } from '../../libs/config';
import { TravelMatePost, TravelMatePosts } from '../../libs/dto/community/travel-mate';
import {
  TravelMatePostInput,
  TravelMatePostsInquiry,
} from '../../libs/dto/community/travel-mate.input';
import { TravelMatePostUpdate } from '../../libs/dto/community/travel-mate.update';
import { ViewInput } from '../../libs/dto/community/view.input';
import { Direction, MemberPointAction, Message } from '../../libs/enums/common.enum';
import { TravelMatePostStatus, ViewTargetType } from '../../libs/enums/community.enum';
import { T } from '../../libs/types/common';
import { MemberService } from '../member/member.service';
import { ViewService } from '../view/view.service';

@Injectable()
export class TravelMatePostService {
  constructor(
    @InjectModel('TravelMatePost')
    private readonly travelMatePostModel: Model<TravelMatePost>,
    private readonly memberService: MemberService,
    private readonly viewService: ViewService,
  ) {}

  public async createTravelMatePost(
    memberId: ObjectId,
    input: TravelMatePostInput,
  ): Promise<TravelMatePost> {
    try {
      const result = await this.travelMatePostModel.create({
        ...input,
        memberId,
      });

      await this.memberService.memberStatsEditor({
        _id: memberId,
        targetKey: 'memberTravelMatePosts',
        modifier: 1,
      });

      await this.memberService.addMemberPoint(memberId, MemberPointAction.TRAVEL_MATE_POST);

      return result;
    } catch (error) {
      console.log('Error, Service createTravelMatePost:', error);

      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async getTravelMatePosts(input: TravelMatePostsInquiry): Promise<TravelMatePosts> {
    const { match, sort } = this.filterTravelMatePosts(input);
    match.matePostStatus = TravelMatePostStatus.ACTIVE;
    const result = await this.travelMatePostModel.aggregate([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },

            lookupTravelMateMember,
            unwindTravelMateMember,
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]);

    if (!result.length) throw new BadRequestException(Message.NO_DATA_FOUND);

    return result[0];
  }

  public async getTravelMatePost(
    memberId: ObjectId | null,
    post: ObjectId,
  ): Promise<TravelMatePost> {
    const targetPost = await this.travelMatePostModel.findOne({
      _id: post,
      matePostStatus: TravelMatePostStatus.ACTIVE,
    });

    if (!targetPost) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    if (memberId) {
      const viewInput: ViewInput = {
        viewerId: memberId,
        targetId: post,
        targetType: ViewTargetType.TRAVEL_MATE_POST,
      };

      const newView = await this.viewService.recordView(viewInput);

      if (newView) {
        await this.travelMatePostStatsEditor({
          _id: post,
          targetKey: 'matePostViewCount',
          modifier: 1,
        });

        targetPost.matePostViewCount++;
      }
    }

    targetPost.memberData = await this.memberService.getMember(null, targetPost.memberId);

    return targetPost;
  }

  public async getMyTravelMatePosts(
    memberId: ObjectId,
    input: TravelMatePostsInquiry,
  ): Promise<TravelMatePosts> {
    const { match, sort } = this.filterTravelMatePosts(input, memberId);

    const result = await this.travelMatePostModel.aggregate([
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
            lookupTravelMateMember,
            unwindTravelMateMember,
          ],
          metaCounter: [
            {
              $count: 'total',
            },
          ],
        },
      },
    ]);

    return result[0];
  }

  public async updateTravelMatePost(
    memberId: ObjectId,
    input: TravelMatePostUpdate,
  ): Promise<TravelMatePost> {
    const { _id } = input;

    const result = await this.travelMatePostModel
      .findOneAndUpdate(
        {
          _id,
          memberId,
          matePostStatus: TravelMatePostStatus.ACTIVE,
        },
        input,
        { new: true },
      )
      .exec();

    if (!result) {
      throw new BadRequestException(Message.UPDATE_FAILED);
    }

    return result;
  }

  public async deleteTravelMatePost(memberId: ObjectId, postId: ObjectId): Promise<TravelMatePost> {
    const targetPost = await this.travelMatePostModel.findOne({
      _id: postId,
      memberId,
    });

    if (!targetPost) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const deletedPost = await this.travelMatePostModel.findOneAndDelete({
      _id: postId,
      memberId,
    });

    if (!deletedPost) {
      throw new BadRequestException(Message.DELETE_FAILED);
    }

    await this.memberService.memberStatsEditor({
      _id: memberId,
      targetKey: 'memberTravelMatePosts',
      modifier: -1,
    });

    return deletedPost;
  }

  public async deleteTravelMatePostByAdmin(postId: ObjectId): Promise<TravelMatePost> {
    const targetPost = await this.travelMatePostModel.findById(postId).exec();

    if (!targetPost) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const result = await this.travelMatePostModel.findByIdAndDelete(postId).exec();

    if (!result) {
      throw new BadRequestException(Message.DELETE_FAILED);
    }

    await this.memberService.memberStatsEditor({
      _id: targetPost.memberId,
      targetKey: 'memberTravelMatePosts',
      modifier: -1,
    });

    return result;
  }

  public async travelMatePostStatsEditor(input: {
    _id: ObjectId;
    targetKey: string;
    modifier: number;
  }): Promise<TravelMatePost> {
    const result = await this.travelMatePostModel.findByIdAndUpdate(
      input._id,
      {
        $inc: {
          [input.targetKey]: input.modifier,
        },
      },
      {
        new: true,
      },
    );

    if (!result) {
      throw new BadRequestException(Message.UPDATE_FAILED);
    }

    return result;
  }

  private filterTravelMatePosts(
    input: TravelMatePostsInquiry,
    memberId?: ObjectId,
  ): { match: T; sort: T } {
    const { destinationCountry, destinationCity, matePostStatus, text } = input.search ?? {};

    const match: T = {};

    if (memberId) match.memberId = memberId;
    if (matePostStatus) match.matePostStatus = matePostStatus;
    if (destinationCountry) match.destinationCountry = destinationCountry;
    if (destinationCity) match.destinationCity = destinationCity;
    if (text) {
      match.matePostTitle = {
        $regex: new RegExp(text, 'i'),
      };
    }

    const sort: T = {
      [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
    };

    return { match, sort };
  }
}
