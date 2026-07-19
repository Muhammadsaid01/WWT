/* eslint-disable prettier/prettier */
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { TravelPackage, TravelPackages } from '../../libs/dto/travel-package/travel-package';
import {
  TravelPackageInput,
  TravelPackagesInquiry,
} from '../../libs/dto/travel-package/travel-package.input';
import { TravelPackageUpdate } from '../../libs/dto/travel-package/travel-package.update';
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
  @Mutation(() => String)
  public async deleteTravelPackage(): Promise<string> {
    return this.travelService.deleteTravelPackage();
  }

  @Roles(MemberType.AGENT)
  @UseGuards(RolesGuard)
  @Query(() => String)
  public async getMyTravelPackages(): Promise<string> {
    return this.travelService.getMyTravelPackages();
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

  @Query(() => String)
  public async getAllTravelPackagesByAdmin(): Promise<string> {
    return this.travelService.getAllTravelPackagesByAdmin();
  }

  @Mutation(() => String)
  public async updateTravelPackageByAdmin(): Promise<string> {
    return this.travelService.updateTravelPackageByAdmin();
  }

  @Mutation(() => String)
  public async deleteTravelPackageByAdmin(): Promise<string> {
    return this.travelService.deleteTravelPackageByAdmin();
  }

  //PackageSchedules

  @Mutation(() => String)
  public async createPackageSchedule(): Promise<string> {
    return this.travelService.createPackageSchedule();
  }

  @Mutation(() => String)
  public async updatePackageSchedule(): Promise<string> {
    return this.travelService.updatePackageSchedule();
  }

  @Mutation(() => String)
  public async deletePackageSchedule(): Promise<string> {
    return this.travelService.deletePackageSchedule();
  }

  @Query(() => String)
  public async getPackageSchedules(): Promise<string> {
    return this.travelService.getPackageSchedules();
  }

  @Query(() => String)
  public async getAllPackageSchedulesByAdmin(): Promise<string> {
    return this.travelService.getAllPackageSchedulesByAdmin();
  }

  @Mutation(() => String)
  public async updatePackageScheduleByAdmin(): Promise<string> {
    return this.travelService.updatePackageScheduleByAdmin();
  }

  //Itinerary

  @Mutation(() => String)
  public async createItinerary(): Promise<string> {
    return this.travelService.createItinerary();
  }

  @Mutation(() => String)
  public async updateItinerary(): Promise<string> {
    return this.travelService.updateItinerary();
  }

  @Mutation(() => String)
  public async deleteItinerary(): Promise<string> {
    return this.travelService.deleteItinerary();
  }

  @Query(() => String)
  public async getItineraries(): Promise<string> {
    return this.travelService.getItineraries();
  }

  @Query(() => String)
  public async getAllItinerariesByAdmin(): Promise<string> {
    return this.travelService.getAllItinerariesByAdmin();
  }

  @Mutation(() => String)
  public async updateItineraryByAdmin(): Promise<string> {
    return this.travelService.updateItineraryByAdmin();
  }

  //PackageInclude

  @Mutation(() => String)
  public async createPackageInclude(): Promise<string> {
    return this.travelService.createPackageInclude();
  }

  @Mutation(() => String)
  public async deletePackageInclude(): Promise<string> {
    return this.travelService.deletePackageInclude();
  }

  @Query(() => String)
  public async getPackageIncludes(): Promise<string> {
    return this.travelService.getPackageIncludes();
  }

  @Query(() => String)
  public async getAllPackageIncludesByAdmin(): Promise<string> {
    return this.travelService.getAllPackageIncludesByAdmin();
  }

  //PackageExclude

  @Mutation(() => String)
  public async createPackageExclude(): Promise<string> {
    return this.travelService.createPackageExclude();
  }

  @Query(() => String)
  public async getAllPackageExcludesByAdmin(): Promise<string> {
    return this.travelService.getAllPackageExcludesByAdmin();
  }

  @Mutation(() => String)
  public async deletePackageExclude(): Promise<string> {
    return this.travelService.deletePackageExclude();
  }

  @Query(() => String)
  public async getPackageExcludes(): Promise<string> {
    return this.travelService.getPackageExcludes();
  }

  //PackageTag

  @Mutation(() => String)
  public async createPackageTag(): Promise<string> {
    return this.travelService.createPackageTag();
  }

  @Query(() => String)
  public async getAllPackageTagsByAdmin(): Promise<string> {
    return this.travelService.getAllPackageTagsByAdmin();
  }

  @Mutation(() => String)
  public async deletePackageTag(): Promise<string> {
    return this.travelService.deletePackageTag();
  }

  @Query(() => String)
  public async getPackageTags(): Promise<string> {
    return this.travelService.getPackageTags();
  }

  //PackagePolicy

  @Mutation(() => String)
  public async createPackagePolicy(): Promise<string> {
    return this.travelService.createPackagePolicy();
  }

  @Mutation(() => String)
  public async updatePackagePolicy(): Promise<string> {
    return this.updatePackagePolicy();
  }

  @Mutation(() => String)
  public async deletePackagePolicy(): Promise<string> {
    return this.travelService.deletePackagePolicy();
  }

  //PackagePolicy

  @Query(() => String)
  public async getPackagePolicy(): Promise<string> {
    return this.getPackagePolicy();
  }

  @Query(() => String)
  public async getAllPackagePoliciesByAdmin(): Promise<string> {
    return this.travelService.getAllPackagePoliciesByAdmin();
  }

  @Mutation(() => String)
  public async updatePackagePolicyByAdmin(): Promise<string> {
    return this.travelService.updatePackagePolicyByAdmin();
  }
}
