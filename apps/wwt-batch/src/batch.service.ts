import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Agent } from '../../wwt-api/src/libs/dto/agent/agent';
import { Member } from '../../wwt-api/src/libs/dto/member/member';
import { TravelPackage } from '../../wwt-api/src/libs/dto/travel-package/travel-package';
import { AgentStatus, AgentVerificationStatus } from '../../wwt-api/src/libs/enums/agent.enum';
import { MemberRank, MemberStatus } from '../../wwt-api/src/libs/enums/member.enum';
import { PackageStatus } from '../../wwt-api/src/libs/enums/package.enum';

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);

  constructor(
    @InjectModel('TravelPackage')
    private readonly packageModel: Model<TravelPackage>,

    @InjectModel('Agent')
    private readonly agentModel: Model<Agent>,

    @InjectModel('Member')
    private readonly memberModel: Model<Member>,
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

  public async batchMemberRanks(): Promise<void> {
    const members = await this.memberModel.find({
      memberStatus: MemberStatus.ACTIVE,
    });

    if (!members.length) {
      this.logger.warn('No active members found');
      return;
    }

    const operations = members.map((member) => {
      const points = member.memberPoint ?? 0;

      let memberRank: MemberRank;

      if (points >= 15000) {
        memberRank = MemberRank.DIAMOND;
      } else if (points >= 7000) {
        memberRank = MemberRank.PLATINUM;
      } else if (points >= 3000) {
        memberRank = MemberRank.GOLD;
      } else if (points >= 1000) {
        memberRank = MemberRank.SILVER;
      } else {
        memberRank = MemberRank.BRONZE;
      }

      return {
        updateOne: {
          filter: {
            _id: member._id,
          },
          update: {
            $set: {
              memberRank,
            },
          },
        },
      };
    });

    await this.memberModel.bulkWrite(operations);

    this.logger.log(`Member ranks updated successfully: ${members.length} members`);
  }
}
