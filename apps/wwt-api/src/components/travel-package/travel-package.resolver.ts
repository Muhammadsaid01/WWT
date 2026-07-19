/* eslint-disable prettier/prettier */
import { Mutation, Query, Resolver } from '@nestjs/graphql';
import { TravelPackageService } from './travel-package.service';

@Resolver()
export class TravelPackageResolver {
  constructor(private readonly travelService: TravelPackageService) {}

  /** PUBLIC **/
  // travelPackage
  @Query(() => String)
  public async getTravelPackage(): Promise<string> {
    return 'getTravelPackage executed!';
  }

  @Query(() => String)
  public async getTravelPackages(): Promise<string> {
    return 'getTravelPackages executed!';
  }

  //PackageSchedules
  @Query(() => String)
  public async getPackageSchedules(): Promise<string> {
    return 'getPackageSchedules executed!';
  }

  //Itinerary

  @Query(() => String)
  public async getItineraries(): Promise<string> {
    return 'getItineraries executed!';
  }

  //PackageInclude

  @Query(() => String)
  public async getPackageIncludes(): Promise<string> {
    return 'getPackageIncludes executed!';
  }

  //PackageExclude

  @Query(() => String)
  public async getPackageExcludes(): Promise<string> {
    return 'getPackageExcludes executed!';
  }
  //PackageTag

  @Query(() => String)
  public async getPackageTags(): Promise<string> {
    return 'getPackageTags executed!';
  }

  //PackagePolicy

  @Query(() => String)
  public async getPackagePolicy(): Promise<string> {
    return 'getPackagePolicy executed!';
  }

  /** AGENT  **/

  // travelPackage

  @Mutation(() => String)
  public async createTravelPackage(): Promise<string> {
    return 'createTravelPackage executed!';
  }

  @Mutation(() => String)
  public async updateTravelPackage(): Promise<string> {
    return 'updateTravelPackage executed!';
  }

  @Mutation(() => String)
  public async deleteTravelPackage(): Promise<string> {
    return 'deleteTravelPackage executed!';
  }
  @Query(() => String)
  public async getMyTravelPackages(): Promise<string> {
    return 'getMyTravelPackages executed!';
  }

  //PackageSchedules

  @Mutation(() => String)
  public async createPackageSchedule(): Promise<string> {
    return 'createPackageSchedule executed!';
  }

  @Mutation(() => String)
  public async updatePackageSchedule(): Promise<string> {
    return 'updatePackageSchedule executed!';
  }

  @Mutation(() => String)
  public async deletePackageSchedule(): Promise<string> {
    return 'deletePackageSchedule executed!';
  }

  //Itinerary

  @Mutation(() => String)
  public async createItinerary(): Promise<string> {
    return 'createItinerary executed!';
  }

  @Mutation(() => String)
  public async updateItinerary(): Promise<string> {
    return 'updateItinerary executed!';
  }

  @Mutation(() => String)
  public async deleteItinerary(): Promise<string> {
    return 'deleteItinerary executed!';
  }

  //PackageInclude

  @Mutation(() => String)
  public async createPackageInclude(): Promise<string> {
    return 'createPackageSchedule executed!';
  }

  @Mutation(() => String)
  public async deletePackageInclude(): Promise<string> {
    return 'createPackageSchedule executed!';
  }

  //PackageExclude

  @Mutation(() => String)
  public async createPackageExclude(): Promise<string> {
    return 'createPackageExclude executed!';
  }

  @Mutation(() => String)
  public async deletePackageExclude(): Promise<string> {
    return 'deletePackageExclude executed!';
  }

  //PackageTag

  @Mutation(() => String)
  public async createPackageTag(): Promise<string> {
    return 'createPackageTag executed!';
  }

  @Mutation(() => String)
  public async deletePackageTag(): Promise<string> {
    return 'deletePackageTag executed!';
  }

  //PackagePolicy

  @Mutation(() => String)
  public async createPackagePolicy(): Promise<string> {
    return 'createPackagePolicy executed!';
  }

  @Mutation(() => String)
  public async updatePackagePolicy(): Promise<string> {
    return 'updatePackagePolicy executed!';
  }

  @Mutation(() => String)
  public async deletePackagePolicy(): Promise<string> {
    return 'deletePackagePolicy executed!';
  }

  /** ADMIN  **/

  @Query(() => String)
  public async getAllTravelPackagesByAdmin(): Promise<string> {
    return 'getAllTravelPackagesByAdmin executed!';
  }

  @Mutation(() => String)
  public async updateTravelPackageByAdmin(): Promise<string> {
    return 'updateTravelPackageByAdmin executed!';
  }

  @Mutation(() => String)
  public async deleteTravelPackageByAdmin(): Promise<string> {
    return 'deleteTravelPackageByAdmin executed!';
  }

  @Query(() => String)
  public async getAllPackageSchedulesByAdmin(): Promise<string> {
    return 'getAllPackageSchedulesByAdmin executed!';
  }

  @Mutation(() => String)
  public async updatePackageScheduleByAdmin(): Promise<string> {
    return 'updatePackageScheduleByAdmin executed!';
  }

  @Query(() => String)
  public async getAllItinerariesByAdmin(): Promise<string> {
    return 'getAllItinerariesByAdmin executed!';
  }

  @Mutation(() => String)
  public async updateItineraryByAdmin(): Promise<string> {
    return 'updateItineraryByAdmin executed!';
  }

  @Query(() => String)
  public async getAllPackageIncludesByAdmin(): Promise<string> {
    return 'getAllPackageIncludesByAdmin executed!';
  }

  @Query(() => String)
  public async getAllPackageExcludesByAdmin(): Promise<string> {
    return 'getAllPackageExcludesByAdmin executed!';
  }

  @Query(() => String)
  public async getAllPackageTagsByAdmin(): Promise<string> {
    return 'getAllPackageTagsByAdmin executed!';
  }

  @Query(() => String)
  public async getAllPackagePoliciesByAdmin(): Promise<string> {
    return 'getAllPackagePoliciesByAdmin executed!';
  }

  @Mutation(() => String)
  public async updatePackagePolicyByAdmin(): Promise<string> {
    return 'updatePackagePolicyByAdmin executed!';
  }
}
