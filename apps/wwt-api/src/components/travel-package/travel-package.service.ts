import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { TravelPackage } from '../../libs/dto/travel-package/travel-package';
import { TravelPackageInput } from '../../libs/dto/travel-package/travel-package.input';
import { Message } from '../../libs/enums/common.enum';
import { AgentService } from '../agent/agent.service';

@Injectable()
export class TravelPackageService {
  constructor(
    @InjectModel('TravelPackage') private readonly packageModel: Model<TravelPackage>,
    private readonly agentService: AgentService,
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

  public async updateTravelPackage(): Promise<string> {
    return 'updateTravelPackage executed!';
  }

  public async deleteTravelPackage(): Promise<string> {
    return 'deleteTravelPackage executed!';
  }

  public async getMyTravelPackages(): Promise<string> {
    return 'getMyTravelPackages executed!';
  }

  public async getTravelPackage(): Promise<string> {
    return 'getTravelPackage executed!';
  }

  public async getTravelPackages(): Promise<string> {
    return 'getTravelPackages executed!';
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
}
