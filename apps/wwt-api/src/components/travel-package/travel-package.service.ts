/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import moment from 'moment';
import { FilterQuery, Model, ObjectId } from 'mongoose';
import { lookupAgent, unwindAgent } from '../../libs/config';
import { ViewInput } from '../../libs/dto/community/view.input';
import { TravelPackage, TravelPackages } from '../../libs/dto/travel-package/travel-package';
import {
  TravelPackageInput,
  TravelPackagesInquiry,
} from '../../libs/dto/travel-package/travel-package.input';
import { TravelPackageUpdate } from '../../libs/dto/travel-package/travel-package.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ViewTargetType } from '../../libs/enums/community.enum';
import { PackageStatus } from '../../libs/enums/package.enum';
import { StatisticModifier } from '../../libs/types/common';
import { AgentService } from '../agent/agent.service';
import { MemberService } from '../member/member.service';
import { ViewService } from '../view/view.service';

@Injectable()
export class TravelPackageService {
  constructor(
    @InjectModel('TravelPackage') private readonly packageModel: Model<TravelPackage>,
    private readonly agentService: AgentService,
    private readonly memberService: MemberService,
    private readonly viewService: ViewService,
  ) {}

  public async createTravelPackage(
    memberId: ObjectId,
    input: TravelPackageInput,
  ): Promise<TravelPackage> {
    try {
      const agent = await this.agentService.findAgentByMemberId(memberId);
      const packageSlug = `${this.generateSlug(input.packageTitle)}-${Date.now()}`;
      const result = await this.packageModel.create({
        ...input,
        agentId: agent._id,
        packageSlug,
      });
      await this.agentService.agentStatsEditor({
        _id: result.agentId,
        targetKey: 'agentPackageCount',
        modifier: 1,
      });
      return result;
    } catch (err) {
      console.log('Error, Service.model:', err);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async updateTravelPackage(
    memberId: ObjectId,
    input: TravelPackageUpdate,
  ): Promise<TravelPackage> {
    const agent = await this.agentService.findAgentByMemberId(memberId);

    let { soldAt, deletedAt } = input;
    const { packageStatus } = input;

    const search: FilterQuery<TravelPackage> = {
      _id: input._id,
      agentId: agent._id,
      packageStatus: PackageStatus.ACTIVE,
    };

    if (packageStatus === PackageStatus.SOLD) soldAt = moment().toDate();
    else if (packageStatus === PackageStatus.DELETED) deletedAt = moment().toDate();
    const result = await this.packageModel
      .findOneAndUpdate(search, input, {
        new: true,
      })
      .exec();

    if (!result) {
      throw new NotFoundException(Message.UPDATE_FAILED);
    }

    // Agar status o'zgarsa, shu yerda statistikalarni yangilashing mumkin.
    // Masalan:

    if (soldAt || deletedAt) {
      await this.agentService.agentStatsEditor({
        _id: agent._id,
        targetKey: 'agentPackageCount',
        modifier: -1,
      });
    }

    return result;
  }

  public async deleteTravelPackage(): Promise<string> {
    return 'deleteTravelPackage executed!';
  }

  public async getMyTravelPackages(): Promise<string> {
    return 'getMyTravelPackages executed!';
  }

  public async getTravelPackage(
    memberId: ObjectId | null,
    packageId: ObjectId,
  ): Promise<TravelPackage> {
    const search: FilterQuery<TravelPackage> = {
      _id: packageId,
      packageStatus: PackageStatus.ACTIVE,
    };

    const targetPackage = await this.packageModel.findOne(search).lean().exec();

    if (!targetPackage) {
      throw new NotFoundException(Message.NO_DATA_FOUND);
    }

    if (memberId) {
      const viewInput: ViewInput = {
        viewerId: memberId,
        targetId: packageId,
        targetType: ViewTargetType.PACKAGE,
      };

      const newView = await this.viewService.recordView(viewInput);

      if (newView) {
        await this.packageStatsEditor({
          _id: packageId,
          targetKey: 'packageViewCount',
          modifier: 1,
        });

        targetPackage.packageViewCount = (targetPackage.packageViewCount ?? 0) + 1;
      }

      // TODO: meLiked
    }

    const agent = await this.agentService.findAgentById(targetPackage.agentId);

    agent.memberData = await this.memberService.findMemberById(agent.memberId);

    targetPackage.agentData = agent;

    return targetPackage;
  }

  public async getTravelPackages(
    memberId: ObjectId | null,
    input: TravelPackagesInquiry,
  ): Promise<TravelPackages> {
    const match: FilterQuery<TravelPackage> = {
      packageStatus: PackageStatus.ACTIVE,
    };

    const sort: Record<string, 1 | -1> = {
      [input.sort ?? 'createdAt']: input.direction === Direction.ASC ? 1 : -1,
    };

    this.shapeMatchQuery(match, input);

    console.log('match:', match);

    const result = await this.packageModel
      .aggregate([
        { $match: match },
        { $sort: sort },
        {
          $facet: {
            list: [
              { $skip: (input.page - 1) * input.limit },
              { $limit: input.limit },

              // TODO: meLiked
              lookupAgent,
              unwindAgent,
            ],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ])
      .exec();

    return (
      result[0] ?? {
        list: [],
        metaCounter: [],
      }
    );
  }

  private shapeMatchQuery(match: FilterQuery<TravelPackage>, input: TravelPackagesInquiry): void {
    const search = input.search;

    if (!search) return;

    const {
      packageCategory,
      destinationCountry,
      destinationCity,
      pricesRange,
      periodsRange,
      text,
    } = search;

    if (packageCategory) {
      match.packageCategory = packageCategory;
    }

    if (destinationCountry?.trim()) {
      match.destinationCountry = {
        $regex: new RegExp(`^${destinationCountry.trim()}$`, 'i'),
      };
    }

    if (destinationCity?.trim()) {
      match.destinationCity = {
        $regex: new RegExp(`^${destinationCity.trim()}$`, 'i'),
      };
    }

    if (pricesRange) {
      match.packagePrice = {
        $gte: pricesRange.start,
        $lte: pricesRange.end,
      };
    }

    if (periodsRange) {
      match.createdAt = {
        $gte: periodsRange.start,
        $lte: periodsRange.end,
      };
    }

    if (text?.trim()) {
      const regex = new RegExp(text.trim(), 'i');

      match.$or = [
        { packageTitle: regex },
        { packageShortDesc: regex },
        { packageDesc: regex },
        { destinationCountry: regex },
        { destinationCity: regex },
      ];
    }
  }

  public async getAllTravelPackagesByAdmin(): Promise<string> {
    return 'getAllTravelPackagesByAdmin executed!';
  }

  public async updateTravelPackageByAdmin(): Promise<string> {
    return 'updateTravelPackageByAdmin executed!';
  }

  public async deleteTravelPackageByAdmin(): Promise<string> {
    return 'deleteTravelPackageByAdmin executed!';
  }

  //Schedule

  public async createPackageSchedule(): Promise<string> {
    return 'createPackageSchedule executed!';
  }

  public async updatePackageSchedule(): Promise<string> {
    return 'updatePackageSchedule executed!';
  }

  public async deletePackageSchedule(): Promise<string> {
    return 'deletePackageSchedule executed!';
  }

  public async getAllPackageSchedulesByAdmin(): Promise<string> {
    return 'getAllPackageSchedulesByAdmin executed!';
  }

  public async updatePackageScheduleByAdmin(): Promise<string> {
    return 'updatePackageScheduleByAdmin executed!';
  }

  public async getPackageSchedules(): Promise<string> {
    return 'getPackageSchedules executed!';
  }

  //Itinerary

  public async createItinerary(): Promise<string> {
    return 'createItinerary executed!';
  }

  public async updateItinerary(): Promise<string> {
    return 'updateItinerary executed!';
  }

  public async deleteItinerary(): Promise<string> {
    return 'deletePackageSchedule executed!';
  }

  public async getItineraries(): Promise<string> {
    return 'getItineraries executed!';
  }

  public async getAllItinerariesByAdmin(): Promise<string> {
    return 'updatePackageScheduleByAdmin executed!';
  }

  public async updateItineraryByAdmin(): Promise<string> {
    return 'getPackageSchedules executed!';
  }

  //PackageInclude

  public async getPackageIncludes(): Promise<string> {
    return 'getPackageIncludes executed!';
  }

  public async createPackageInclude(): Promise<string> {
    return 'createPackageInclude executed!';
  }

  public async deletePackageInclude(): Promise<string> {
    return 'deletePackageInclude executed!';
  }

  public async getAllPackageIncludesByAdmin(): Promise<string> {
    return 'getAllPackageIncludesByAdmin executed!';
  }

  //PackageExclude

  public async getPackageExcludes(): Promise<string> {
    return 'getPackageExcludes executed!';
  }

  public async createPackageExclude(): Promise<string> {
    return 'createPackageExclude executed!';
  }

  public async deletePackageExclude(): Promise<string> {
    return 'deletePackageExclude executed!';
  }

  public async getAllPackageExcludesByAdmin(): Promise<string> {
    return 'getAllPackageExcludesByAdmin executed!';
  }

  //PackageTag

  public async getPackageTags(): Promise<string> {
    return 'getPackageTags executed!';
  }

  public async createPackageTag(): Promise<string> {
    return 'updateItinerary executed!';
  }

  public async deletePackageTag(): Promise<string> {
    return 'deletePackageSchedule executed!';
  }

  public async getAllPackageTagsByAdmin(): Promise<string> {
    return 'getAllPackageTagsByAdmin executed!';
  }

  //PackagePolicy

  public async createPackagePolicy(): Promise<string> {
    return 'createPackagePolicy executed!';
  }

  public async updatePackagePolicy(): Promise<string> {
    return 'updatePackagePolicy executed!';
  }

  public async deletePackagePolicy(): Promise<string> {
    return 'deletePackagePolicy executed!';
  }

  public async getPackagePolicy(): Promise<string> {
    return 'getPackagePolicy executed!';
  }

  public async getAllPackagePoliciesByAdmin(): Promise<string> {
    return 'getAllPackagePoliciesByAdmin executed!';
  }

  public async updatePackagePolicyByAdmin(): Promise<string> {
    return 'updatePackagePolicyByAdmin executed!';
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  public async packageStatsEditor(input: StatisticModifier): Promise<TravelPackage> {
    const { _id, targetKey, modifier } = input;
    const result = await this.packageModel
      .findByIdAndUpdate(
        _id,
        {
          $inc: { [targetKey]: modifier },
        },
        { new: true },
      )
      .exec();
    if (!result) {
      throw new InternalServerErrorException(Message.UPDATE_FAILED);
    }

    return result;
  }
}
