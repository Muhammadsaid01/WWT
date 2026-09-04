import { Injectable } from '@nestjs/common';

@Injectable()
export class WwtBatchService {
  getHello(): string {
    return 'Welcome to the WWT Batch Server!';
  }
}
