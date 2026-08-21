import { Controller, Get } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BatchService } from './batch.service';

@Controller()
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Get()
  public getHello(): string {
    return this.batchService.getHello();
  }

  // =========================================================
  // CRON JOBS
  // =========================================================

  // Every day 01:00:00
  @Cron('0 0 1 * * *')
  public async batchRollback(): Promise<void> {
    await this.batchService.batchRollback();
  }

  // Every day 01:00:20
  @Cron('20 0 1 * * *')
  public async batchTopPackages(): Promise<void> {
    await this.batchService.batchTopPackages();
  }

  // Every day 01:00:40
  @Cron('40 0 1 * * *')
  public async batchTopAgents(): Promise<void> {
    await this.batchService.batchTopAgents();
  }

  @Cron('0 1 1 * * *')
  public async batchMemberRanks(): Promise<void> {
    await this.batchService.batchMemberRanks();
  }

  // =========================================================
  // MANUAL TEST ENDPOINTS
  // =========================================================

  // @Get('test/rollback')
  // public async testRollback(): Promise<string> {
  //   await this.batchService.batchRollback();

  //   return 'Batch rollback completed';
  // }

  // @Get('test/packages')
  // public async testPackages(): Promise<string> {
  //   await this.batchService.batchTopPackages();

  //   return 'Package batch completed';
  // }

  // @Get('test/agents')
  // public async testAgents(): Promise<string> {
  //   await this.batchService.batchTopAgents();

  //   return 'Agent batch completed';
  // }
}
