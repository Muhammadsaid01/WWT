import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Agent } from '../../wwt-api/src/libs/dto/agent/agent';
import { TravelPackage } from '../../wwt-api/src/libs/dto/travel-package/travel-package';
import { AgentStatus, AgentVerificationStatus } from '../../wwt-api/src/libs/enums/agent.enum';
import { PackageStatus } from '../../wwt-api/src/libs/enums/package.enum';

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);

  constructor(
    @InjectModel('TravelPackage')
    private readonly packageModel: Model<TravelPackage>,

    @InjectModel('Agent')
    private readonly agentModel: Model<Agent>,
  ) {}

  public getHello(): string {
    return 'Welcome to the Batch Server!';
  }

  // =========================================================
  // ROLLBACK RANKS
  // =========================================================

  public async batchRollback(): Promise<void> {
    await Promise.all([
      this.packageModel.updateMany(
        {},
        {
          $set: {
            packageRank: 0,
          },
        },
      ),

      this.agentModel.updateMany(
        {},
        {
          $set: {
            agentRank: 0,
          },
        },
      ),
    ]);

    this.logger.log('Package and Agent ranks reset successfully');
  }

  // =========================================================
  // CALCULATE PACKAGE RANK
  // =========================================================

  public async batchTopPackages(): Promise<void> {
    const packages = await this.packageModel.find({
      packageStatus: PackageStatus.ACTIVE,
    });

    if (!packages.length) {
      this.logger.warn('No active travel packages found');
      return;
    }

    const operations = packages.map((pkg) => {
      const packageRank =
        (pkg.packageViewCount ?? 0) * 1 +
        (pkg.packageLikeCount ?? 0) * 3 +
        (pkg.packageBookingCount ?? 0) * 10 +
        (pkg.packageReviewCount ?? 0) * 5 +
        (pkg.packageRating ?? 0) * 20;

      return {
        updateOne: {
          filter: {
            _id: pkg._id,
          },
          update: {
            $set: {
              packageRank,
            },
          },
        },
      };
    });

    await this.packageModel.bulkWrite(operations);

    this.logger.log(`Package ranking updated successfully: ${packages.length} packages`);
  }

  // =========================================================
  // CALCULATE AGENT RANK
  // =========================================================

  public async batchTopAgents(): Promise<void> {
    const agents = await this.agentModel.find({
      agentStatus: AgentStatus.ACTIVE,
      verificationStatus: AgentVerificationStatus.APPROVED,
    });

    if (!agents.length) {
      this.logger.warn('No active agents found');
      return;
    }

    const operations = agents.map((agent) => {
      const agentRank =
        (agent.agentFollowerCount ?? 0) * 2 +
        (agent.agentPackageCount ?? 0) * 3 +
        (agent.agentBookingCount ?? 0) * 10 +
        (agent.agentReviewCount ?? 0) * 5 +
        (agent.agentRating ?? 0) * 20;

      return {
        updateOne: {
          filter: {
            _id: agent._id,
          },
          update: {
            $set: {
              agentRank,
            },
          },
        },
      };
    });

    await this.agentModel.bulkWrite(operations);

    this.logger.log(`Agent ranking updated successfully: ${agents.length} agents`);
  }
}
