import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { lookupVisit } from '../../libs/config';
import { View } from '../../libs/dto/community/view';
import { ViewInput } from '../../libs/dto/community/view.input';
import { TravelPackages } from '../../libs/dto/travel-package/travel-package';
import { OrdinaryInquiry } from '../../libs/dto/travel-package/travel-package.input';
import { ViewTargetType } from '../../libs/enums/community.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class ViewService {
  constructor(@InjectModel('View') private readonly viewModel: Model<View>) {}

  public async recordView(input: ViewInput): Promise<View | null> {
    const viewExist = await this.checkViewExistance(input);
    if (!viewExist) {
      console.log('-New View Recorded-');
      return await this.viewModel.create(input);
    } else return null;
  }

  private async checkViewExistance(input: ViewInput): Promise<View> {
    const { viewerId, targetId } = input;
    const search: T = {
      viewerId: viewerId,
      targetId: targetId,
    };
    return await this.viewModel.findOne(search).exec();
  }

  public async getVisitedPackages(
    memberId: ObjectId,
    input: OrdinaryInquiry,
  ): Promise<TravelPackages> {
    const { page, limit } = input;
    const match: T = { targetType: ViewTargetType.PACKAGE, viewerId: memberId };

    const test = await this.viewModel.aggregate([
      {
        $match: {
          targetType: ViewTargetType.PACKAGE,
          memberId,
        },
      },
    ]);

    console.log('MATCH RESULT:', test);

    const data: T = await this.viewModel
      .aggregate([
        { $match: match },
        { $sort: { updatedAt: -1 } },
        {
          $lookup: {
            from: 'travelPackages',
            localField: 'targetId',
            foreignField: '_id',
            as: 'visitedPackage',
          },
        },
        { $unwind: '$visitedPackage' },
        {
          $facet: {
            list: [
              { $skip: (page - 1) * limit },
              { $limit: limit },
              lookupVisit,
              { $unwind: '$visitedPackage.agentData' },
            ],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ])
      .exec();

    const result: TravelPackages = { list: [], metaCounter: data[0].metaCounter };
    result.list = data[0].list.map((ele) => ele.visitedPackage);
    return result;
  }
}
