import { Controller, Get } from '@nestjs/common';
import { WwtBatchService } from './wwt-batch.service';

@Controller()
export class WwtBatchController {
  constructor(private readonly wwtBatchService: WwtBatchService) {}

  @Get()
  getHello(): string {
    return this.wwtBatchService.getHello();
  }
}
