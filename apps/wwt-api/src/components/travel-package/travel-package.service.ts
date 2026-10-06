/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import moment from 'moment';
import { FilterQuery, Model, ObjectId } from 'mongoose';
import {
  lookupAgent,
  lookupAuthMemberLiked,
  shapeIntoMongoObjectId,
  unwindAgent,
} from '../../libs/config';
import { LikeInput } from '../../libs/dto/community/like.input';
import { ViewInput } from '../../libs/dto/community/view.input';
import { Itinerary } from '../../libs/dto/travel-package/itinerary';
import {
  DeleteItineraryInput,
  ItineraryInput,
} from '../../libs/dto/travel-package/itinerary.input';
import { ItineraryUpdate } from '../../libs/dto/travel-package/itinerary.update';
import { PackageExclude } from '../../libs/dto/travel-package/package-exclude';
import {
  DeletePackageExcludeInput,
  PackageExcludeInput,
} from '../../libs/dto/travel-package/package-exclude.input';
import { PackageInclude } from '../../libs/dto/travel-package/package-include';
import {
  DeletePackageIncludeInput,
  PackageIncludeInput,
} from '../../libs/dto/travel-package/package-include.input';
import { PackagePolicy } from '../../libs/dto/travel-package/package-policy';
import {
  DeletePackagePolicyInput,
  PackagePolicyInput,
} from '../../libs/dto/travel-package/package-policy.input';
import { PackagePolicyUpdate } from '../../libs/dto/travel-package/package-policy.update';
import { PackageSchedule } from '../../libs/dto/travel-package/package-schedule';
import {
  DeletePackageScheduleInput,
  PackageScheduleInput,
} from '../../libs/dto/travel-package/package-schedule.input';
import {
  PackageScheduleUpdate,
  PackageScheduleUpdateByAdmin,
} from '../../libs/dto/travel-package/package-schedule.update';
import { PackageTag } from '../../libs/dto/travel-package/package-tag';
import {
  DeletePackageTagInput,
  PackageTagInput,
} from '../../libs/dto/travel-package/package-tag.input';
import { TravelPackage, TravelPackages } from '../../libs/dto/travel-package/travel-package';
import {
  AgentTravelPackagesInquiry,
  AllTravelPackagesInquiry,
  OrdinaryInquiry,
  TravelPackageInput,
  TravelPackagesInquiry,
} from '../../libs/dto/travel-package/travel-package.input';
import {
  DeleteTravelPackageInput,
  TravelPackageUpdate,
} from '../../libs/dto/travel-package/travel-package.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { LikeTargetType, ViewTargetType } from '../../libs/enums/community.enum';
import { NotificationReferenceType, NotificationType } from '../../libs/enums/notification.enum';
import {
  PackageCategory,
  PackageLevel,
  PackageStatus,
  PackageType,
  ScheduleStatus,
  TransportType,
} from '../../libs/enums/package.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { AgentService } from '../agent/agent.service';
import { LikesService } from '../likes/likes.service';
import { MemberService } from '../member/member.service';
import { NotificationService } from '../notification/notification.service';
import { ViewService } from '../view/view.service';

@Injectable()
export class TravelPackageService {
  constructor(
    @InjectModel('TravelPackage') private readonly packageModel: Model<TravelPackage>,

    @InjectModel('PackageSchedule')
    private readonly packageScheduleModel: Model<PackageSchedule>,

    @InjectModel('Itinerary')
    private readonly itineraryModel: Model<Itinerary>,

    @InjectModel('PackageInclude')
    private readonly packageIncludeModel: Model<PackageInclude>,

    @InjectModel('PackageExclude')
    private readonly packageExcludeModel: Model<PackageExclude>,

    @InjectModel('PackageTag')
    private readonly packageTagModel: Model<PackageTag>,

    @InjectModel('PackagePolicy')
    private readonly packagePolicyModel: Model<PackagePolicy>,

    private readonly agentService: AgentService,
    private readonly memberService: MemberService,
    private readonly viewService: ViewService,
    private readonly likeService: LikesService,
    private readonly notificationService: NotificationService,
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

  public async deleteTravelPackage(
    memberId: ObjectId,
    input: DeleteTravelPackageInput,
  ): Promise<TravelPackage> {
    const agent = await this.agentService.findAgentByMemberId(memberId);

    const result = await this.packageModel.findOneAndUpdate(
      {
        _id: input._id,
        agentId: agent._id,
        packageStatus: { $ne: PackageStatus.DELETED },
      },
      {
        $set: {
          packageStatus: PackageStatus.DELETED,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!result) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    await this.agentService.agentStatsEditor({
      _id: agent._id,
      targetKey: 'agentPackageCount',
      modifier: -1,
    });

    return result;
  }

  public async getMyTravelPackages(
    memberId: ObjectId,
    input: AgentTravelPackagesInquiry,
  ): Promise<TravelPackages> {
    const agent = await this.agentService.findAgentByMemberId(memberId);

    const packageStatus = input.search?.packageStatus;

    if (packageStatus === PackageStatus.DELETED) {
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    }

    const match: FilterQuery<TravelPackage> = {
      agentId: agent._id,
      packageStatus: packageStatus ?? { $ne: PackageStatus.DELETED },
    };

    const sort = {
      [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC,
    };

    const result = await this.packageModel.aggregate([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            lookupAgent,
            unwindAgent,
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]);

    return result[0];
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
        const likeInput: LikeInput = {
          memberId,
          targetId: packageId,
          targetType: LikeTargetType.PACKAGE,
        };

        targetPackage.meLiked = await this.likeService.checkLikeExistence(likeInput);
      }
    }

    const agent = await this.agentService.findAgentById(targetPackage.agentId);

    agent.memberData = await this.memberService.findMemberById(agent.memberId);

    targetPackage.agentData = agent;

    return targetPackage;
  }

  public async likeTargetPackage(memberId: ObjectId, targetId: ObjectId): Promise<TravelPackage> {
    const target = await this.packageModel
      .findOne({
        _id: targetId,
        packageStatus: PackageStatus.ACTIVE,
        packageDeletedAt: null,
      })
      .exec();

    if (!target) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const input: LikeInput = {
      memberId,
      targetId,
      targetType: LikeTargetType.PACKAGE,
    };

    const modifier = await this.likeService.toggleLike(input);

    const result = await this.packageStatsEditor({
      _id: targetId,
      targetKey: 'packageLikeCount',
      modifier,
    });

    if (!result) {
      throw new BadRequestException(Message.UPDATE_FAILED);
    }

    if (modifier === 1) {
      const targetAgent = await this.agentService.findAgentById(target.agentId);

      if (targetAgent && targetAgent.memberId.toString() !== memberId.toString()) {
        await this.notificationService.createNotification({
          receiverId: targetAgent.memberId,
          senderId: memberId,

          notificationType: NotificationType.NEW_LIKE,

          notificationTitle: 'New like',

          notificationMessage: 'Someone liked your travel package.',

          referenceType: NotificationReferenceType.TRAVEL_PACKAGE,

          referenceId: target._id,
        });
      }
    }

    return result;
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

              lookupAuthMemberLiked(memberId),
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
      agentId,
      packageCategory,
      destinationCountry,
      destinationCity,
      pricesRange,
      periodsRange,
      text,
    } = search;

    if (agentId) {
      match.agentId = shapeIntoMongoObjectId(agentId);
    }

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
  public async getFavorities(memberId: ObjectId, input: OrdinaryInquiry): Promise<TravelPackages> {
    return await this.likeService.getFavoritePackages(memberId, input);
  }

  public async getVisited(memberId: ObjectId, input: OrdinaryInquiry): Promise<TravelPackages> {
    return await this.viewService.getVisitedPackages(memberId, input);
  }

  public async getAllTravelPackagesByAdmin(
    memberId: ObjectId,
    input: AllTravelPackagesInquiry,
  ): Promise<TravelPackages> {
    const { packageStatus, destinationCountryList } = input.search;
    const match: T = {};
    const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

    if (packageStatus) match.packageStatus = packageStatus;
    if (destinationCountryList) match.destinationCountryList = { $in: destinationCountryList };

    const result = await this.packageModel
      .aggregate([
        { $match: match },
        { $sort: sort },
        {
          $facet: {
            list: [
              { $skip: (input.page - 1) * input.limit },
              { $limit: input.limit },
              lookupAgent,
              unwindAgent,
            ],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ])
      .exec();
    if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result[0];
  }

  public async updateTravelPackageByAdmin(input: TravelPackageUpdate): Promise<TravelPackage> {
    return await this.packageModel.db.transaction(async (session) => {
      const targetPackage = await this.packageModel.findById(input._id).session(session).exec();

      if (!targetPackage) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      if (targetPackage.packageStatus !== PackageStatus.ACTIVE) {
        throw new BadRequestException('Only ACTIVE packages can be updated.');
      }

      const updateData: Partial<TravelPackageUpdate> = { ...input };
      delete updateData._id;
      delete updateData.soldAt;
      delete updateData.deletedAt;

      for (const key of Object.keys(updateData) as (keyof TravelPackageUpdate)[]) {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      }

      const nextStatus = input.packageStatus ?? targetPackage.packageStatus;
      const statusChanged = nextStatus !== targetPackage.packageStatus;

      if (statusChanged && nextStatus === PackageStatus.SOLD) {
        updateData.soldAt = new Date();
      } else if (statusChanged && nextStatus === PackageStatus.DELETED) {
        updateData.deletedAt = new Date();
      }

      const result = await this.packageModel
        .findOneAndUpdate(
          {
            _id: input._id,
            packageStatus: targetPackage.packageStatus,
          },
          { $set: updateData },
          {
            new: true,
            runValidators: true,
            session,
          },
        )
        .exec();

      if (!result) {
        throw new BadRequestException(Message.UPDATE_FAILED);
      }

      if (
        statusChanged &&
        this.packageContributesToAgentCount(targetPackage.packageStatus) &&
        !this.packageContributesToAgentCount(nextStatus)
      ) {
        await this.agentService.agentStatsEditor(
          {
            _id: result.agentId,
            targetKey: 'agentPackageCount',
            modifier: -1,
          },
          session,
        );
      }

      return result;
    });
  }

  public async deleteTravelPackageByAdmin(packageId: ObjectId): Promise<TravelPackage> {
    return await this.packageModel.db.transaction(async (session) => {
      const targetPackage = await this.packageModel.findById(packageId).session(session).exec();

      if (!targetPackage) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      const deletedPackage = await this.packageModel.findOneAndDelete(
        { _id: packageId },
        { session },
      );

      if (!deletedPackage) {
        throw new BadRequestException(Message.NO_DATA_FOUND);
      }

      await this.packageScheduleModel.deleteMany({ packageId }, { session });
      await this.itineraryModel.deleteMany({ packageId }, { session });
      await this.packageIncludeModel.deleteMany({ packageId }, { session });
      await this.packageExcludeModel.deleteMany({ packageId }, { session });
      await this.packageTagModel.deleteMany({ packageId }, { session });
      await this.packagePolicyModel.deleteMany({ packageId }, { session });

      if (this.packageContributesToAgentCount(targetPackage.packageStatus)) {
        await this.agentService.agentStatsEditor(
          {
            _id: targetPackage.agentId,
            targetKey: 'agentPackageCount',
            modifier: -1,
          },
          session,
        );
      }

      return deletedPackage;
    });
  }

  //Schedule

  public async createPackageSchedule(
    memberId: ObjectId,
    input: PackageScheduleInput,
  ): Promise<PackageSchedule> {
    const agent = await this.agentService.findAgentByMemberId(memberId);

    console.log('agent:', agent);
    const targetPackage = await this.packageModel.findOne({
      _id: input.packageId,
      packageStatus: PackageStatus.ACTIVE,
    });
    console.log('targetPackage:', targetPackage);

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    if (String(targetPackage.agentId) !== String(agent._id)) {
      throw new ForbiddenException(Message.NOT_AUTHORIZED);
    }

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be earlier than end date.');
    }
    const existing = await this.packageScheduleModel.findOne({
      packageId: input.packageId,
      startDate,
      endDate,
    });

    if (existing) {
      throw new BadRequestException('Package schedule already exists.');
    }

    const result = await this.packageScheduleModel.create({
      ...input,
      startDate,
      endDate,
    });
    return result;
  }

  public async getPackageSchedules(packageId: ObjectId): Promise<PackageSchedule[]> {
    const result = await this.packageScheduleModel
      .find({
        packageId,
        scheduleStatus: ScheduleStatus.OPEN,
      })
      .sort({ startDate: 1 })
      .lean();

    return result;
  }

  public async getPackageSchedule(scheduleId: ObjectId): Promise<PackageSchedule> {
    const result = await this.packageScheduleModel.findById(scheduleId);

    if (!result) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return result;
  }

  public async updatePackageSchedule(
    memberId: ObjectId,
    input: PackageScheduleUpdate,
  ): Promise<PackageSchedule> {
    const targetSchedule = await this.packageScheduleModel.findById(input._id);

    if (!targetSchedule) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const targetPackage = await this.packageModel.findById(targetSchedule.packageId);

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const agent = await this.agentService.findAgentByMemberId(memberId);

    if (String(targetPackage.agentId) !== String(agent._id)) {
      throw new ForbiddenException(Message.NOT_AUTHORIZED);
    }

    const startDate = input.startDate ? new Date(input.startDate) : targetSchedule.startDate;

    const endDate = input.endDate ? new Date(input.endDate) : targetSchedule.endDate;

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be earlier than end date.');
    }

    const result = await this.packageScheduleModel.findByIdAndUpdate(
      input._id,
      {
        $set: {
          ...input,
          startDate,
          endDate,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    return result;
  }

  public async deletePackageSchedule(
    memberId: ObjectId,
    input: DeletePackageScheduleInput,
  ): Promise<PackageSchedule> {
    const { _id } = input;
    const agent = await this.agentService.findAgentByMemberId(memberId);

    const targetSchedule = await this.packageScheduleModel.findById(_id);

    if (!targetSchedule) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const targetPackage = await this.packageModel.findById(targetSchedule.packageId);

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    if (targetPackage.agentId.toString() !== agent._id.toString()) {
      throw new ForbiddenException(Message.NOT_AUTHORIZED);
    }

    const deletedSchedule = await this.packageScheduleModel.findByIdAndDelete(_id);

    if (!deletedSchedule) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return deletedSchedule;
  }

  public async getPackageSchedulesByAdmin(packageId: ObjectId): Promise<PackageSchedule[]> {
    const targetPackage = await this.packageModel.findById(packageId);

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return this.packageScheduleModel
      .find({
        packageId,
      })
      .sort({
        startDate: 1,
      })
      .exec();
  }

  public async updatePackageScheduleByAdmin(
    scheduleId: ObjectId,
    input: PackageScheduleUpdateByAdmin,
  ): Promise<PackageSchedule> {
    const updatedSchedule = await this.packageScheduleModel.findByIdAndUpdate(scheduleId, input, {
      new: true,
      runValidators: true,
    });

    if (!updatedSchedule) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return updatedSchedule;
  }

  public async deletePackageScheduleByAdmin(scheduleId: ObjectId): Promise<PackageSchedule> {
    const deletedSchedule = await this.packageScheduleModel.findByIdAndDelete(scheduleId);

    if (!deletedSchedule) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return deletedSchedule;
  }

  // ================================
  // Itinerary
  // ================================

  public async createItinerary(memberId: ObjectId, input: ItineraryInput): Promise<Itinerary> {
    // 1. Agentni topamiz
    const agent = await this.agentService.findAgentByMemberId(memberId);

    // 2. Package mavjudligini tekshiramiz
    const targetPackage = await this.packageModel.findById(input.packageId);

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    // 3. Package shu agentniki ekanligini tekshiramiz
    if (targetPackage.agentId.toString() !== agent._id.toString()) {
      throw new ForbiddenException(Message.NOT_AUTHORIZED);
    }

    const existingItinerary = await this.itineraryModel.findOne({
      packageId: input.packageId,
      dayNumber: input.dayNumber,
    });

    if (existingItinerary) {
      throw new BadRequestException('Day number already exists.');
    }

    // 4. Itinerary yaratamiz
    const result = await this.itineraryModel.create(input);

    return result;
  }

  public async getItineraries(packageId: ObjectId): Promise<Itinerary[]> {
    const targetPackage = await this.packageModel.findOne({
      _id: packageId,
      packageStatus: PackageStatus.ACTIVE,
    });

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const result = this.itineraryModel
      .find({
        packageId,
      })
      .sort({
        dayNumber: 1,
      })
      .exec();
    return result;
  }

  public async getItinerary(targetId: ObjectId): Promise<Itinerary> {
    const result = await this.itineraryModel.findById(targetId);

    if (!result) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return result;
  }

  public async updateItinerary(memberId: ObjectId, input: ItineraryUpdate): Promise<Itinerary> {
    // 1. Agentni topamiz
    const agent = await this.agentService.findAgentByMemberId(memberId);

    // 2. Itinerary mavjudligini tekshiramiz
    const targetItinerary = await this.itineraryModel.findById(input._id);

    if (!targetItinerary) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }
    // 3. Package mavjudligini tekshiramiz
    const targetPackage = await this.packageModel.findById(targetItinerary.packageId);

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }
    // 4. Agent egasi ekanligini tekshiramiz
    if (targetPackage.agentId.toString() !== agent._id.toString()) {
      throw new ForbiddenException(Message.NOT_AUTHORIZED);
    }

    const result = await this.itineraryModel.findByIdAndUpdate(input._id, input, {
      new: true,
      runValidators: true,
    });

    if (!result) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return result;
  }

  public async deleteItinerary(
    memberId: ObjectId,
    input: DeleteItineraryInput,
  ): Promise<Itinerary> {
    // 1. Agentni topamiz
    const agent = await this.agentService.findAgentByMemberId(memberId);

    // 2. Itinerary mavjudligini tekshiramiz
    const targetItinerary = await this.itineraryModel.findById(input._id);

    if (!targetItinerary) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    // 3. Package mavjudligini tekshiramiz
    const targetPackage = await this.packageModel.findById(targetItinerary.packageId);

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    // 4. Agent egasi ekanligini tekshiramiz
    if (targetPackage.agentId.toString() !== agent._id.toString()) {
      throw new ForbiddenException(Message.NOT_AUTHORIZED);
    }

    // 5. O'chiramiz
    const result = await this.itineraryModel.findByIdAndDelete(input._id);

    if (!result) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return result;
  }

  public async getItinerariesByAdmin(packageId: ObjectId): Promise<Itinerary[]> {
    const targetPackage = await this.packageModel.findById(packageId);

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return await this.itineraryModel
      .find({
        packageId,
      })
      .sort({
        dayNumber: 1,
      });
  }

  public async updateItineraryByAdmin(input: ItineraryUpdate): Promise<Itinerary> {
    const updatedItinerary = await this.itineraryModel.findByIdAndUpdate(input._id, input, {
      new: true,
      runValidators: true,
    });

    if (!updatedItinerary) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return updatedItinerary;
  }

  public async deleteItineraryByAdmin(input: DeleteItineraryInput): Promise<Itinerary> {
    const deletedItinerary = await this.itineraryModel.findByIdAndDelete(input._id);

    if (!deletedItinerary) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return deletedItinerary;
  }
  //PackageInclude

  public async createPackageInclude(
    memberId: ObjectId,
    input: PackageIncludeInput,
  ): Promise<PackageInclude> {
    // 1. Agentni topamiz
    const agent = await this.agentService.findAgentByMemberId(memberId);

    // 2. Package mavjudligini tekshiramiz
    const targetPackage = await this.packageModel.findById(input.packageId);

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    // 3. Package shu agentniki ekanligini tekshiramiz
    if (targetPackage.agentId.toString() !== agent._id.toString()) {
      throw new ForbiddenException(Message.NOT_AUTHORIZED);
    }

    // 4. PackageInclude yaratamiz
    const result = await this.packageIncludeModel.create(input);

    return result;
  }

  public async getPackageIncludes(packageId: ObjectId): Promise<PackageInclude[]> {
    const targetPackage = await this.packageModel.findOne({
      _id: packageId,
      packageStatus: PackageStatus.ACTIVE,
    });

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const result = await this.packageIncludeModel
      .find({
        packageId,
      })
      .sort({
        createdAt: 1,
      })
      .exec();

    return result;
  }
  public async deletePackageInclude(
    memberId: ObjectId,
    input: DeletePackageIncludeInput,
  ): Promise<PackageInclude> {
    // 1. Agentni topamiz
    const agent = await this.agentService.findAgentByMemberId(memberId);

    // 2. Itinerary mavjudligini tekshiramiz
    const targetInclude = await this.packageIncludeModel.findById(input._id);

    if (!targetInclude) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    // 3. Package mavjudligini tekshiramiz
    const targetPackage = await this.packageModel.findById(targetInclude.packageId);

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    // 4. Agent egasi ekanligini tekshiramiz
    if (targetPackage.agentId.toString() !== agent._id.toString()) {
      throw new ForbiddenException(Message.NOT_AUTHORIZED);
    }

    // 5. O'chiramiz
    const result = await this.packageIncludeModel.findByIdAndDelete(input._id);

    if (!result) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }
    return result;
  }

  public async getAllPackageIncludesByAdmin(packageId: ObjectId): Promise<PackageInclude[]> {
    const targetPackage = await this.packageModel.findById(packageId);

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    return await this.packageIncludeModel
      .find({
        packageId,
      })
      .sort({
        createdAt: 1,
      })
      .exec();
  }
  //PackageExclude

  public async createPackageExclude(
    memberId: ObjectId,
    input: PackageExcludeInput,
  ): Promise<PackageExclude> {
    // 1. Agentni topamiz
    const agent = await this.agentService.findAgentByMemberId(memberId);

    // 2. Package mavjudligini tekshiramiz
    const targetPackage = await this.packageModel.findById(input.packageId);

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    // 3. Package shu agentniki ekanligini tekshiramiz
    if (targetPackage.agentId.toString() !== agent._id.toString()) {
      throw new ForbiddenException(Message.NOT_AUTHORIZED);
    }

    // 4. PackageInclude yaratamiz
    const result = await this.packageExcludeModel.create(input);

    return result;
  }

  public async getPackageExcludes(packageId: ObjectId): Promise<PackageExclude[]> {
    const targetPackage = await this.packageModel.findOne({
      _id: packageId,
      packageStatus: PackageStatus.ACTIVE,
    });

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const result = await this.packageExcludeModel
      .find({
        packageId,
      })
      .sort({
        createdAt: 1,
      })
      .exec();

    return result;
  }

  public async deletePackageExclude(
    memberId: ObjectId,
    input: DeletePackageExcludeInput,
  ): Promise<PackageExclude> {
    // 1. Agentni topamiz
    const agent = await this.agentService.findAgentByMemberId(memberId);

    // 2. Itinerary mavjudligini tekshiramiz
    const targetInclude = await this.packageExcludeModel.findById(input._id);

    if (!targetInclude) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    // 3. Package mavjudligini tekshiramiz
    const targetPackage = await this.packageModel.findById(targetInclude.packageId);

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    // 4. Agent egasi ekanligini tekshiramiz
    if (targetPackage.agentId.toString() !== agent._id.toString()) {
      throw new ForbiddenException(Message.NOT_AUTHORIZED);
    }

    // 5. O'chiramiz
    const result = await this.packageExcludeModel.findByIdAndDelete(input._id);

    if (!result) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }
    return result;
  }

  public async getAllPackageExcludesByAdmin(packageId: ObjectId): Promise<PackageExclude[]> {
    const targetPackage = await this.packageModel.findById(packageId);

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const result = await this.packageExcludeModel
      .find({
        packageId,
      })
      .sort({
        createdAt: 1,
      })
      .exec();

    return result;
  }

  //PackageTag

  public async createPackageTag(memberId: ObjectId, input: PackageTagInput): Promise<PackageTag> {
    // 1. Agentni topamiz
    const agent = await this.agentService.findAgentByMemberId(memberId);

    // 2. Package mavjudligini tekshiramiz
    const targetPackage = await this.packageModel.findById(input.packageId);

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    // 3. Package shu agentniki ekanligini tekshiramiz
    if (targetPackage.agentId.toString() !== agent._id.toString()) {
      throw new ForbiddenException(Message.NOT_AUTHORIZED);
    }

    // 4. PackageInclude yaratamiz
    const result = await this.packageTagModel.create(input);

    return result;
  }

  public async getPackageTags(packageId: ObjectId): Promise<PackageTag[]> {
    const targetPackage = await this.packageModel.findOne({
      _id: packageId,
      packageStatus: PackageStatus.ACTIVE,
    });

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const result = await this.packageTagModel
      .find({
        packageId,
      })
      .sort({
        createdAt: 1,
      })
      .exec();

    return result;
  }

  public async deletePackageTag(
    memberId: ObjectId,
    input: DeletePackageTagInput,
  ): Promise<PackageTag> {
    // 1. Agentni topamiz
    const agent = await this.agentService.findAgentByMemberId(memberId);

    // 2. Itinerary mavjudligini tekshiramiz
    const targetTag = await this.packageTagModel.findById(input._id);

    if (!targetTag) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    // 3. Package mavjudligini tekshiramiz
    const targetPackage = await this.packageModel.findById(targetTag.packageId);

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    // 4. Agent egasi ekanligini tekshiramiz
    if (targetPackage.agentId.toString() !== agent._id.toString()) {
      throw new ForbiddenException(Message.NOT_AUTHORIZED);
    }

    // 5. O'chiramiz
    const result = await this.packageTagModel.findByIdAndDelete(input._id);

    if (!result) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }
    return result;
  }

  public async getAllPackageTagByAdmin(packageId: ObjectId): Promise<PackageTag[]> {
    const targetPackage = await this.packageModel.findById(packageId);

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const result = await this.packageTagModel
      .find({
        packageId,
      })
      .sort({
        createdAt: 1,
      })
      .exec();

    return result;
  }

  //PackagePolicy

  public async createPackagePolicy(
    memberId: ObjectId,
    input: PackagePolicyInput,
  ): Promise<PackagePolicy> {
    // 1. Agentni topamiz
    const agent = await this.agentService.findAgentByMemberId(memberId);

    // 2. Package mavjudligini tekshiramiz
    const targetPackage = await this.packageModel.findById(input.packageId);

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    // 3. Package shu agentniki ekanligini tekshiramiz
    if (targetPackage.agentId.toString() !== agent._id.toString()) {
      throw new ForbiddenException(Message.NOT_AUTHORIZED);
    }

    // 4. PackageInclude yaratamiz
    const result = await this.packagePolicyModel.create(input);

    return result;
  }

  public async updatePackagePolicy(
    memberId: ObjectId,
    policyId: ObjectId,
    input: PackagePolicyUpdate,
  ): Promise<PackagePolicy> {
    const agent = await this.agentService.findAgentByMemberId(memberId);

    const targetPolicy = await this.packagePolicyModel.findById(policyId);

    if (!targetPolicy) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const targetPackage = await this.packageModel.findById(targetPolicy.packageId);

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    if (String(targetPackage.agentId) !== String(agent._id)) {
      throw new ForbiddenException(Message.NOT_AUTHORIZED);
    }

    const result = await this.packagePolicyModel.findByIdAndUpdate(
      policyId,
      { $set: input },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!result) {
      throw new BadRequestException(Message.UPDATE_FAILED);
    }

    return result;
  }

  public async deletePackagePolicy(
    memberId: ObjectId,
    input: DeletePackagePolicyInput,
  ): Promise<PackagePolicy> {
    // 1. Agentni topamiz
    const agent = await this.agentService.findAgentByMemberId(memberId);

    // 2. Itinerary mavjudligini tekshiramiz
    const targetTag = await this.packagePolicyModel.findById(input._id);

    if (!targetTag) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    // 3. Package mavjudligini tekshiramiz
    const targetPackage = await this.packageModel.findById(targetTag.packageId);

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    // 4. Agent egasi ekanligini tekshiramiz
    if (targetPackage.agentId.toString() !== agent._id.toString()) {
      throw new ForbiddenException(Message.NOT_AUTHORIZED);
    }

    // 5. O'chiramiz
    const result = await this.packagePolicyModel.findByIdAndDelete(input._id);

    if (!result) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }
    return result;
  }

  public async getPackagePolicy(packageId: ObjectId): Promise<PackagePolicy[]> {
    const targetPackage = await this.packageModel.findOne({
      _id: packageId,
      packageStatus: PackageStatus.ACTIVE,
    });

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const result = await this.packagePolicyModel
      .find({
        packageId,
      })
      .sort({
        createdAt: 1,
      })
      .exec();

    return result;
  }

  public async getAllPackagePoliciesByAdmin(packageId: ObjectId): Promise<PackagePolicy[]> {
    const targetPackage = await this.packageModel.findById(packageId);

    if (!targetPackage) {
      throw new BadRequestException(Message.NO_DATA_FOUND);
    }

    const result = await this.packagePolicyModel
      .find({
        packageId,
      })
      .sort({
        createdAt: 1,
      })
      .exec();

    return result;
  }

  private packageContributesToAgentCount(packageStatus: PackageStatus): boolean {
    return ![PackageStatus.SOLD, PackageStatus.DELETED].includes(packageStatus);
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

  public async searchPackagesForAI(
    destination?: string,
    minPrice?: number,
    maxPrice?: number,
    days?: number,
    category?: PackageCategory,
    packageType?: PackageType,
    packageLevel?: PackageLevel,
    transportType?: TransportType,
    people?: number,
    minRating?: number,
  ): Promise<TravelPackage[]> {
    const match: FilterQuery<TravelPackage> = {
      packageStatus: PackageStatus.ACTIVE,
    };

    if (destination) {
      match.$or = [
        {
          destinationCity: {
            $regex: destination,
            $options: 'i',
          },
        },
        {
          destinationCountry: {
            $regex: destination,
            $options: 'i',
          },
        },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      match.packagePrice = {};

      if (minPrice !== undefined) {
        match.packagePrice.$gte = minPrice;
      }

      if (maxPrice !== undefined) {
        match.packagePrice.$lte = maxPrice;
      }
    }

    if (days !== undefined) {
      match.packageDays = days;
    }

    if (category) {
      match.packageCategory = category;
    }

    if (packageType) {
      match.packageType = packageType;
    }

    if (packageLevel) {
      match.packageLevel = packageLevel;
    }

    if (transportType) {
      match.transportType = transportType;
    }

    if (people !== undefined) {
      match.minPeople = {
        $lte: people,
      };

      match.maxPeople = {
        $gte: people,
      };
    }

    if (minRating !== undefined) {
      match.packageRating = {
        $gte: minRating,
      };
    }

    return this.packageModel
      .find(match)
      .sort({
        packageRating: -1,
        packageReviewCount: -1,
      })
      .limit(10)
      .lean<TravelPackage[]>();
  }
}
