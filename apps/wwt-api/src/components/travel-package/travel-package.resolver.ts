/* eslint-disable prettier/prettier */
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
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
  TravelPackageInput,
  TravelPackagesInquiry,
} from '../../libs/dto/travel-package/travel-package.input';
import {
  DeleteTravelPackageInput,
  TravelPackageUpdate,
} from '../../libs/dto/travel-package/travel-package.update';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { TravelPackageService } from './travel-package.service';

@Resolver()
export class TravelPackageResolver {
  constructor(private readonly travelService: TravelPackageService) {}

  /** AGENT  **/

  // travelPackage
  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => TravelPackage)
  public async createTravelPackage(
    @Args('input') input: TravelPackageInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<TravelPackage> {
    console.log('Mutation: createTravelPackage!');
    return this.travelService.createTravelPackage(memberId, input);
  }

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => TravelPackage)
  public async updateTravelPackage(
    @Args('input') input: TravelPackageUpdate,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<TravelPackage> {
    console.log('Mutation: updateTravelPackage!');
    input._id = shapeIntoMongoObjectId(input._id);
    return this.travelService.updateTravelPackage(memberId, input);
  }

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => TravelPackage)
  public async deleteTravelPackage(
    @Args('input') input: DeleteTravelPackageInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<TravelPackage> {
    console.log('Mutation: deleteTravelPackage!');
    input._id = shapeIntoMongoObjectId(input._id);
    return this.travelService.deleteTravelPackage(memberId, input);
  }

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Query(() => TravelPackages)
  public async getMyTravelPackages(
    @Args('input') input: AgentTravelPackagesInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<TravelPackages> {
    console.log('getMyTravelPackages executed!');
    return this.travelService.getMyTravelPackages(memberId, input);
  }

  /** PUBLIC **/
  @UseGuards(WithoutGuard)
  @Query(() => TravelPackage)
  public async getTravelPackage(
    @Args('input') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<TravelPackage> {
    console.log('Mutation: getTravelPackage!');
    const packageId = shapeIntoMongoObjectId(input);
    return this.travelService.getTravelPackage(memberId, packageId);
  }

  @UseGuards(WithoutGuard)
  @Query(() => TravelPackages)
  public async getTravelPackages(
    @Args('input') input: TravelPackagesInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<TravelPackages> {
    console.log('Mutation: getTravelPackages!');
    return this.travelService.getTravelPackages(memberId, input);
  }

  /** ADMIN  **/
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => TravelPackages)
  public async getAllTravelPackagesByAdmin(
    @Args('input') input: AllTravelPackagesInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<TravelPackages> {
    console.log('Query: getTravelPackagesByAdmin!');
    return this.travelService.getAllTravelPackagesByAdmin(memberId, input);
  }
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => TravelPackage)
  public async updateTravelPackageByAdmin(
    @Args('input') input: TravelPackageUpdate,
  ): Promise<TravelPackage> {
    console.log('Query: updateTravelPackageByAdmin!');
    input._id = shapeIntoMongoObjectId(input._id);
    return this.travelService.updateTravelPackageByAdmin(input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => TravelPackage)
  public async deleteTravelPackageByAdmin(
    @Args('input') input: DeleteTravelPackageInput,
  ): Promise<TravelPackage> {
    console.log('Mutation: deleteTravelPackageByAdmin!');

    input._id = shapeIntoMongoObjectId(input._id);
    return this.travelService.deleteTravelPackageByAdmin(input._id);
  }

  // ================================
  // Package Schedule
  // ================================

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => PackageSchedule)
  public async createPackageSchedule(
    @Args('input') input: PackageScheduleInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PackageSchedule> {
    console.log('memberId:', memberId);
    console.log('Mutation: createPackageSchedule');

    input.packageId = shapeIntoMongoObjectId(input.packageId);

    return await this.travelService.createPackageSchedule(memberId, input);
  }

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => PackageSchedule)
  public async updatePackageSchedule(
    @Args('input') input: PackageScheduleUpdate,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PackageSchedule> {
    console.log('Mutation: updatePackageSchedule');
    input._id = shapeIntoMongoObjectId(input._id);
    input.packageId = shapeIntoMongoObjectId(input.packageId);
    return this.travelService.updatePackageSchedule(memberId, input);
  }

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => PackageSchedule)
  public async deletePackageSchedule(
    @Args('input') input: DeletePackageScheduleInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PackageSchedule> {
    console.log('Mutation: deletePackageSchedule');
    console.log('memberId:', memberId);

    input._id = shapeIntoMongoObjectId(input._id);

    return this.travelService.deletePackageSchedule(memberId, input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => [PackageSchedule])
  public async getPackageSchedules(
    @Args('packageId', { type: () => String })
    packageId: string,
  ): Promise<PackageSchedule[]> {
    console.log('Query: getPackageSchedules');

    const targetPackageId = shapeIntoMongoObjectId(packageId);

    return this.travelService.getPackageSchedules(targetPackageId);
  }

  @UseGuards(WithoutGuard)
  @Query(() => PackageSchedule)
  public async getPackageSchedule(
    @Args('scheduleId') scheduleId: string,
  ): Promise<PackageSchedule> {
    return this.travelService.getPackageSchedule(shapeIntoMongoObjectId(scheduleId));
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => [PackageSchedule])
  public async getPackageSchedulesByAdmin(
    @Args('packageId', { type: () => String })
    packageId: string,
  ): Promise<PackageSchedule[]> {
    return this.travelService.getPackageSchedulesByAdmin(shapeIntoMongoObjectId(packageId));
  }

  @UseGuards(RolesGuard)
  @Roles(MemberType.ADMIN)
  @Mutation(() => PackageSchedule)
  public async updatePackageScheduleByAdmin(
    @Args('scheduleId', { type: () => String })
    scheduleId: string,
    @Args('input')
    input: PackageScheduleUpdateByAdmin,
  ): Promise<PackageSchedule> {
    return this.travelService.updatePackageScheduleByAdmin(
      shapeIntoMongoObjectId(scheduleId),
      input,
    );
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => PackageSchedule)
  public async deletePackageScheduleByAdmin(
    @Args('scheduleId', { type: () => String })
    scheduleId: string,
  ): Promise<PackageSchedule> {
    console.log('Mutation: deletePackageScheduleByAdmin');

    return this.travelService.deletePackageScheduleByAdmin(shapeIntoMongoObjectId(scheduleId));
  }

  // ================================
  // Itinerary
  // ================================

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => Itinerary)
  public async createItinerary(
    @Args('input') input: ItineraryInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Itinerary> {
    console.log('memberId:', memberId);
    console.log('Mutation: createItinerary');

    input.packageId = shapeIntoMongoObjectId(input.packageId);

    return await this.travelService.createItinerary(memberId, input);
  }
  @UseGuards(WithoutGuard)
  @Query(() => [Itinerary])
  public async getItineraries(
    @Args('packageId', { type: () => String })
    packageId: string,
  ): Promise<Itinerary[]> {
    console.log('Query: getItineraries');

    const targetId = shapeIntoMongoObjectId(packageId);

    return this.travelService.getItineraries(targetId);
  }
  @UseGuards(WithoutGuard)
  @Query(() => Itinerary)
  public async getItinerary(@Args('itineraryId') itineraryId: string): Promise<Itinerary> {
    console.log('Query: getItinerary');
    const targetId = shapeIntoMongoObjectId(itineraryId);
    return this.travelService.getItinerary(targetId);
  }
  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => Itinerary)
  public async updateItinerary(
    @Args('input') input: ItineraryUpdate,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Itinerary> {
    console.log('Mutation: updateItinerary');
    console.log('memberId:', memberId);

    input._id = shapeIntoMongoObjectId(input._id);

    return this.travelService.updateItinerary(memberId, input);
  }

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => Itinerary)
  public async deleteItinerary(
    @Args('input') input: DeleteItineraryInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Itinerary> {
    console.log('Mutation: deleteItinerary');
    console.log('memberId:', memberId);

    input._id = shapeIntoMongoObjectId(input._id);

    return this.travelService.deleteItinerary(memberId, input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => [Itinerary])
  public async getItinerariesByAdmin(@Args('packageId') packageId: string): Promise<Itinerary[]> {
    console.log('Query: getItinerariesByAdmin');

    const targetId = shapeIntoMongoObjectId(packageId);

    return this.travelService.getItinerariesByAdmin(targetId);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Itinerary)
  public async updateItineraryByAdmin(@Args('input') input: ItineraryUpdate): Promise<Itinerary> {
    console.log('Mutation: updateItineraryByAdmin');

    input._id = shapeIntoMongoObjectId(input._id);

    return this.travelService.updateItineraryByAdmin(input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Itinerary)
  public async deleteItineraryByAdmin(
    @Args('input') input: DeleteItineraryInput,
  ): Promise<Itinerary> {
    console.log('Mutation: deletePackageScheduleByAdmin');

    input._id = shapeIntoMongoObjectId(input._id);

    return this.travelService.deleteItineraryByAdmin(input);
  }

  //PackageInclude
  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => PackageInclude)
  public async createPackageInclude(
    @Args('input') input: PackageIncludeInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PackageInclude> {
    console.log('Mutation: createPackageInclude');
    console.log('memberId:', memberId);

    input.packageId = shapeIntoMongoObjectId(input.packageId);

    return this.travelService.createPackageInclude(memberId, input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => [PackageInclude])
  public async getPackageIncludes(
    @Args('packageId', { type: () => String })
    packageId: string,
  ): Promise<PackageInclude[]> {
    console.log('Query: getPackageIncludes');

    const targetId = shapeIntoMongoObjectId(packageId);

    return this.travelService.getPackageIncludes(targetId);
  }

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => PackageInclude)
  public async deletePackageInclude(
    @Args('input') input: DeletePackageIncludeInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PackageInclude> {
    console.log('Mutation: deletePackageInclude');
    console.log('memberId:', memberId);
    input._id = shapeIntoMongoObjectId(input._id);
    return this.travelService.deletePackageInclude(memberId, input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => [PackageInclude])
  public async getAllPackageIncludesByAdmin(
    @Args('packageId') packageId: string,
  ): Promise<PackageInclude[]> {
    console.log('Query: getAllPackageIncludesByAdmin');

    const targetId = shapeIntoMongoObjectId(packageId);

    return this.travelService.getAllPackageIncludesByAdmin(targetId);
  }

  //PackageExclude
  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => PackageExclude)
  public async createPackageExclude(
    @Args('input') input: PackageExcludeInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PackageExclude> {
    console.log('Mutation: createPackageExclude');
    console.log('memberId:', memberId);

    input.packageId = shapeIntoMongoObjectId(input.packageId);
    return this.travelService.createPackageExclude(memberId, input);
  }
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => [PackageExclude])
  public async getAllPackageExcludesByAdmin(
    @Args('packageId') packageId: string,
  ): Promise<PackageExclude[]> {
    console.log('Query: getAllPackageExcludesByAdmin');

    const targetId = shapeIntoMongoObjectId(packageId);
    return this.travelService.getAllPackageExcludesByAdmin(targetId);
  }

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => PackageExclude)
  public async deletePackageExclude(
    @Args('input') input: DeletePackageExcludeInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PackageExclude> {
    console.log('Mutation: deletePackageInclude');
    input._id = shapeIntoMongoObjectId(input._id);
    return this.travelService.deletePackageExclude(memberId, input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => [PackageExclude])
  public async getPackageExcludes(
    @Args('packageId', { type: () => String })
    packageId: string,
  ): Promise<PackageExclude[]> {
    console.log('Query: getPackageExcludes');

    const targetId = shapeIntoMongoObjectId(packageId);

    return this.travelService.getPackageExcludes(targetId);
  }

  //PackageTag
  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => PackageTag)
  public async createPackageTag(
    @Args('input') input: PackageTagInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PackageTag> {
    console.log('Mutation: createPackageTag');
    console.log('memberId:', memberId);

    input.packageId = shapeIntoMongoObjectId(input.packageId);
    return this.travelService.createPackageTag(memberId, input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => [PackageTag])
  public async getPackageTags(
    @Args('packageId', { type: () => String })
    packageId: string,
  ): Promise<PackageTag[]> {
    console.log('Query: getPackageTags');

    const targetId = shapeIntoMongoObjectId(packageId);
    return this.travelService.getPackageTags(targetId);
  }

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => PackageTag)
  public async deletePackageTag(
    @Args('input') input: DeletePackageTagInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PackageTag> {
    console.log('Mutation: deletePackageTag');
    input._id = shapeIntoMongoObjectId(input._id);
    return this.travelService.deletePackageTag(memberId, input);
  }
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => [PackageTag])
  public async getAllPackageTagByAdmin(
    @Args('packageId') packageId: string,
  ): Promise<PackageTag[]> {
    console.log('Query: getAllPackageTagsByAdmin');

    const targetId = shapeIntoMongoObjectId(packageId);
    return this.travelService.getAllPackageTagByAdmin(targetId);
  }

  //PackagePolicy
  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => PackagePolicy)
  public async createPackagePolicy(
    @Args('input') input: PackagePolicyInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PackagePolicy> {
    console.log('Mutation: createPackageTag');
    console.log('memberId:', memberId);

    input.packageId = shapeIntoMongoObjectId(input.packageId);
    return this.travelService.createPackagePolicy(memberId, input);
  }
  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Mutation(() => PackagePolicy)
  public async deletePackagePolicy(
    @Args('input') input: DeletePackagePolicyInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PackagePolicy> {
    console.log('Mutation: deletePackageTag');
    input._id = shapeIntoMongoObjectId(input._id);
    return this.travelService.deletePackagePolicy(memberId, input);
  }

  //PackagePolicy
  @UseGuards(WithoutGuard)
  @Query(() => [PackagePolicy])
  public async getPackagePolicy(
    @Args('packageId', { type: () => String })
    packageId: string,
  ): Promise<PackagePolicy[]> {
    console.log('Query: getPackageTags');
    const targetId = shapeIntoMongoObjectId(packageId);
    return this.getPackagePolicy(targetId);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => [PackagePolicy])
  public async getAllPackagePoliciesByAdmin(
    @Args('packageId') packageId: string,
  ): Promise<PackagePolicy[]> {
    console.log('Query: getAllPackageTagsByAdmin');
    const targetId = shapeIntoMongoObjectId(packageId);
    return this.travelService.getAllPackagePoliciesByAdmin(targetId);
  }
}
