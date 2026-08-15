import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { lookupFavorite } from '../../libs/config';
import { Like, MeLiked } from '../../libs/dto/community/like';
import { LikeInput } from '../../libs/dto/community/like.input';
import { TravelPackages } from '../../libs/dto/travel-package/travel-package';
import { OrdinaryInquiry } from '../../libs/dto/travel-package/travel-package.input';
import { Message } from '../../libs/enums/common.enum';
import { LikeTargetType } from '../../libs/enums/community.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class LikesService {
  constructor(@InjectModel('Like') private readonly likeModel: Model<Like>) {}

  public async toggleLike(input: LikeInput): Promise<number> {
    const search: T = {
      memberId: input.memberId,
      targetId: input.targetId,
      targetType: input.targetType,
    };

    const existingLike = await this.likeModel.findOne(search).exec();

    let modifier = 1;

    if (existingLike) {
      await this.likeModel.findOneAndDelete(search).exec();

      modifier = -1;
    } else {
      try {
        await this.likeModel.create({
          memberId: input.memberId,
          targetId: input.targetId,
          targetType: input.targetType,
        });
      } catch (error) {
        console.log('ERROR, LikeService model:', error);

        throw new BadRequestException(Message.CREATE_FAILED);
      }
    }

    console.log(`- Like modifier ${modifier} -`);

    return modifier;
  }

  public async checkLikeExistence(input: LikeInput): Promise<MeLiked[]> {
    const { memberId, targetId, targetType } = input;

    const result = await this.likeModel
      .findOne({
        memberId,
        targetId,
        targetType,
      })
      .exec();

    return result
      ? [
          {
            memberId,
            targetId,
            targetType,
            meLiked: true,
          },
        ]
      : [];
  }

  public async getFavoritePackages(
    memberId: ObjectId,
    input: OrdinaryInquiry,
  ): Promise<TravelPackages> {
    const { page, limit } = input;
    const match: T = { targetType: LikeTargetType.PACKAGE, memberId: memberId };

    const data: T = await this.likeModel
      .aggregate([
        { $match: match },
        { $sort: { updateAt: -1 } },
        {
          $lookup: {
            from: 'travelPackages',
            localField: 'targetId',
            foreignField: '_id',
            as: 'favoritePackage',
          },
        },
        { $unwind: '$favoritePackage' },
        {
          $facet: {
            list: [
              { $skip: (page - 1) * limit },
              { $limit: limit },
              lookupFavorite,
              { $unwind: '$favoritePackage.agentData' },
            ],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ])
      .exec();

    console.log(data[0].list[0]);
    console.log('======================');
    const result: TravelPackages = { list: [], metaCounter: data[0].metaCounter };
    result.list = data[0].list.map((ele) => ele.favoritePackage);
    console.log(result);
    return result;
  }
}
